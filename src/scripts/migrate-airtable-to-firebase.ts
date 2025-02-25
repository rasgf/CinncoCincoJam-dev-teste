import { getDatabase, ref, set, push } from 'firebase/database';
import { app } from '@/config/firebase';
import { collections } from '@/services/firebase';
import { tables } from '@/services/airtable';

// Inicializar o Realtime Database
const db = getDatabase(app);

// Função para migrar usuários
const migrateUsers = async () => {
  try {
    console.log('Migrando usuários...');
    const users = await tables.users.select().all();
    
    for (const user of users) {
      const userData = user.fields;
      const userRef = ref(db, `${collections.users}/${userData.uid}`);
      
      await set(userRef, {
        uid: userData.uid,
        email: userData.email,
        name: userData.name || '',
        role: userData.role || 'aluno',
        created_at: userData.created_at || new Date().toISOString(),
        updated_at: userData.updated_at || new Date().toISOString(),
        status: userData.status || 'active',
        profile_image: userData.profile_image || '',
        bio: userData.bio || '',
        specialties: userData.specialties || [],
        social_media: userData.social_media || ''
      });
      
      console.log(`Usuário migrado: ${userData.name || userData.email}`);
    }
    
    console.log(`Total de ${users.length} usuários migrados com sucesso!`);
  } catch (error) {
    console.error('Erro ao migrar usuários:', error);
    throw error;
  }
};

// Função para migrar cursos
const migrateCourses = async () => {
  try {
    console.log('Migrando cursos...');
    const courses = await tables.courses.select().all();
    const courseIdMap = new Map(); // Para mapear IDs antigos com novos
    
    for (const course of courses) {
      const courseData = course.fields;
      const coursesRef = ref(db, collections.courses);
      const newCourseRef = push(coursesRef);
      
      await set(newCourseRef, {
        title: courseData.title || '',
        description: courseData.description || '',
        price: Number(courseData.price) || 0,
        level: courseData.level || 'beginner',
        status: courseData.status || 'draft',
        thumbnail: courseData.thumbnail || '',
        what_will_learn: courseData.what_will_learn || '',
        requirements: courseData.requirements || '',
        professor_id: courseData.professor_id || '',
        created_at: courseData.created_at || new Date().toISOString().split('T')[0],
        updated_at: courseData.updated_at || new Date().toISOString().split('T')[0]
      });
      
      courseIdMap.set(course.id, newCourseRef.key);
      console.log(`Curso migrado: ${courseData.title}`);
    }
    
    console.log(`Total de ${courses.length} cursos migrados com sucesso!`);
    return courseIdMap;
  } catch (error) {
    console.error('Erro ao migrar cursos:', error);
    throw error;
  }
};

// Função para migrar matrículas
const migrateEnrollments = async (courseIdMap: Map<string, string>) => {
  try {
    console.log('Migrando matrículas...');
    const enrollments = await tables.enrollments.select().all();
    
    for (const enrollment of enrollments) {
      const enrollmentData = enrollment.fields;
      const courseIdStr = String(enrollmentData.course_id || '');
      const newCourseId = courseIdMap.get(courseIdStr);
      
      if (!newCourseId) {
        console.warn(`Curso não encontrado para matrícula: ${enrollment.id}`);
        continue;
      }
      
      const enrollmentsRef = ref(db, collections.enrollments);
      const newEnrollmentRef = push(enrollmentsRef);
      
      await set(newEnrollmentRef, {
        student_id: enrollmentData.student_id || '',
        course_id: newCourseId,
        status: enrollmentData.status || 'active',
        enrollment_date: enrollmentData.enrollment_date || new Date().toISOString().split('T')[0],
        last_access: enrollmentData.last_access || new Date().toISOString(),
        progress: Number(enrollmentData.progress) || 0
      });
      
      console.log(`Matrícula migrada para estudante: ${enrollmentData.student_id} - Curso: ${newCourseId}`);
    }
    
    console.log(`Total de ${enrollments.length} matrículas migradas com sucesso!`);
  } catch (error) {
    console.error('Erro ao migrar matrículas:', error);
    throw error;
  }
};

// Função para migrar conteúdos de cursos
const migrateCourseContents = async (courseIdMap: Map<string, string>) => {
  try {
    console.log('Migrando conteúdos dos cursos...');
    const courseContents = await tables.course_contents.select().all();
    
    for (const content of courseContents) {
      const contentData = content.fields;
      const courseIdStr = String(contentData.course_id || '');
      const newCourseId = courseIdMap.get(courseIdStr);
      
      if (!newCourseId) {
        console.warn(`Curso não encontrado para conteúdo: ${content.id}`);
        continue;
      }
      
      const contentsRef = ref(db, collections.course_contents);
      const newContentRef = push(contentsRef);
      
      await set(newContentRef, {
        course_id: newCourseId,
        title: contentData.title || '',
        content_type: contentData.content_type || 'text',
        content: contentData.content || '',
        order: Number(contentData.order) || 0,
        created_at: contentData.created_at || new Date().toISOString(),
        updated_at: contentData.updated_at || new Date().toISOString()
      });
      
      console.log(`Conteúdo migrado: ${contentData.title} - Curso: ${newCourseId}`);
    }
    
    console.log(`Total de ${courseContents.length} conteúdos migrados com sucesso!`);
  } catch (error) {
    console.error('Erro ao migrar conteúdos de cursos:', error);
    throw error;
  }
};

// Função principal para executar a migração
export const migrateAirtableToFirebase = async () => {
  try {
    console.log('Iniciando migração do Airtable para o Firebase...');
    
    // Migrar usuários
    await migrateUsers();
    
    // Migrar cursos e obter mapeamento de IDs
    const courseIdMap = await migrateCourses();
    
    // Migrar matrículas usando o mapeamento de IDs
    await migrateEnrollments(courseIdMap);
    
    // Migrar conteúdos de cursos
    await migrateCourseContents(courseIdMap);
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
    throw error;
  }
};

// Verificar se o script está sendo executado diretamente
if (require.main === module) {
  migrateAirtableToFirebase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Erro no script de migração:', error);
      process.exit(1);
    });
} 