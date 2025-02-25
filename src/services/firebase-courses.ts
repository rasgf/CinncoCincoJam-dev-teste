import { getDatabase, ref, set, get, update, remove, query, orderByChild, equalTo, push } from 'firebase/database';
import { storage } from '@/config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Course, CreateCourseData, ProfessorStats } from '@/types/course';
import { collections } from './firebase';

const db = getDatabase();

export const getUserCourses = async (userId: string): Promise<Course[]> => {
  try {
    // Buscar todos os cursos e filtrar no cliente para evitar necessidade de índice
    const coursesRef = ref(db, collections.courses);
    const snapshot = await get(coursesRef);
    
    const courses: Course[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const courseData = childSnapshot.val();
        
        // Filtrar cursos pelo professor_id
        if (courseData.professor_id === userId) {
          courses.push({
            id: childSnapshot.key as string,
            fields: {
              title: courseData.title,
              description: courseData.description,
              thumbnail: courseData.thumbnail,
              price: courseData.price,
              category: courseData.category || '',
              level: courseData.level,
              status: courseData.status,
              what_will_learn: courseData.what_will_learn,
              requirements: courseData.requirements,
              professor_id: courseData.professor_id,
              created_at: courseData.created_at,
              updated_at: courseData.updated_at
            }
          });
        }
      });
    }
    
    return courses;
  } catch (error: unknown) {
    console.error('Erro ao buscar cursos do usuário:', error);
    throw error;
  }
};

export const getProfessorStats = async (professorId: string): Promise<ProfessorStats> => {
  try {
    console.log('Buscando estatísticas para professor:', professorId);
    
    // Buscar todos os cursos e filtrar no cliente
    const coursesRef = ref(db, collections.courses);
    const snapshot = await get(coursesRef);
    
    const courses: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const courseData = childSnapshot.val();
        
        // Filtrar cursos pelo professor_id
        if (courseData.professor_id === professorId) {
          courses.push({
            id: childSnapshot.key,
            fields: courseData
          });
        }
      });
    }

    if (courses.length === 0) {
      return {
        totalStudents: 0,
        activeCourses: 0,
        monthlyRevenue: 0,
        studentsTrend: { value: 0, isPositive: true },
        revenueTrend: { value: 0, isPositive: true }
      };
    }

    // Buscar cursos publicados
    const publishedCourses = courses.filter(course => 
      course.fields.status === 'published'
    );

    // Buscar matrículas ativas apenas se houver cursos publicados
    let activeEnrollments: any[] = [];
    if (publishedCourses.length > 0) {
      const enrollmentsRef = ref(db, collections.enrollments);
      const enrollmentsSnapshot = await get(enrollmentsRef);
      
      if (enrollmentsSnapshot.exists()) {
        enrollmentsSnapshot.forEach((childSnapshot) => {
          const enrollment = childSnapshot.val();
          const courseId = enrollment.course_id;
          
          // Verificar se a matrícula é para um dos cursos do professor e está ativa
          if (publishedCourses.some(course => course.id === courseId) && enrollment.status === 'active') {
            activeEnrollments.push({
              id: childSnapshot.key,
              fields: enrollment
            });
          }
        });
      }
    }

    // Calcular receita mensal
    const monthlyRevenue = activeEnrollments.reduce((total, enrollment) => {
      const course = publishedCourses.find(c => c.id === enrollment.fields.course_id);
      return total + (course?.fields.price || 0);
    }, 0);

    return {
      totalStudents: activeEnrollments.length,
      activeCourses: publishedCourses.length,
      monthlyRevenue,
      studentsTrend: { value: 0, isPositive: true },
      revenueTrend: { value: 0, isPositive: true }
    };

  } catch (error: unknown) {
    console.error('Error fetching professor stats:', error);
    throw error;
  }
};

interface CreateCourseFields {
  title: string;
  description: string;
  price: number;
  level: string;
  status: string;
  thumbnail: File | null;
  what_will_learn: string;
  requirements: string;
  professor_id: string;
}

export const createCourse = async (data: CreateCourseFields): Promise<Course> => {
  try {
    let thumbnailUrl = '';
    
    if (data.thumbnail) {
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${data.thumbnail.name}`;
      const storagePath = storageRef(storage, `course_thumbnails/${fileName}`);
      
      await uploadBytes(storagePath, data.thumbnail);
      thumbnailUrl = await getDownloadURL(storagePath);
    }

    const whatWillLearn = Array.isArray(data.what_will_learn) 
      ? data.what_will_learn.join(',')
      : data.what_will_learn;

    const requirements = Array.isArray(data.requirements)
      ? data.requirements.join(',')
      : data.requirements;

    const formattedDate = new Date().toISOString().split('T')[0];

    const courseFields = {
      title: data.title,
      description: data.description,
      price: Number(data.price),
      level: data.level,
      status: data.status,
      thumbnail: thumbnailUrl,
      what_will_learn: whatWillLearn,
      requirements: requirements,
      professor_id: data.professor_id,
      created_at: formattedDate,
      updated_at: formattedDate
    };

    // Criar um novo ID único para o curso
    const coursesRef = ref(db, collections.courses);
    const newCourseRef = push(coursesRef);
    const courseId = newCourseRef.key;
    
    // Salvar o curso no Firebase
    await set(newCourseRef, courseFields);

    return {
      id: courseId as string,
      fields: courseFields
    };
  } catch (error: unknown) {
    console.error('Erro ao criar curso:', error);
    throw error;
  }
};

export const getAllPublishedCourses = async (): Promise<Course[]> => {
  try {
    const coursesRef = ref(db, collections.courses);
    const snapshot = await get(coursesRef);
    
    const courses: Course[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const courseData = childSnapshot.val();
        
        // Adicionar apenas cursos publicados
        if (courseData.status === 'published') {
          courses.push({
            id: childSnapshot.key as string,
            fields: courseData
          });
        }
      });
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    courses.sort((a, b) => {
      const dateA = new Date(a.fields.created_at || 0).getTime();
      const dateB = new Date(b.fields.created_at || 0).getTime();
      return dateB - dateA;
    });
    
    return courses;
  } catch (error) {
    console.error('Erro ao buscar cursos publicados:', error);
    throw error;
  }
};

export const updateCourse = async (courseId: string, courseData: {
  title: string;
  description: string;
  price: string;
  category?: string;
  level: string;
  status: string;
  thumbnail: File | null;
  professor_id: string;
}) => {
  try {
    let thumbnailUrl = '';
    
    if (courseData.thumbnail) {
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${courseData.thumbnail.name}`;
      const storagePath = storageRef(storage, `course_thumbnails/${fileName}`);
      
      await uploadBytes(storagePath, courseData.thumbnail);
      thumbnailUrl = await getDownloadURL(storagePath);
    }

    const formattedDate = new Date().toISOString().split('T')[0];
    
    // Obter os dados atuais do curso
    const courseRef = ref(db, `${collections.courses}/${courseId}`);
    const snapshot = await get(courseRef);
    
    if (!snapshot.exists()) {
      throw new Error('Curso não encontrado');
    }
    
    const currentCourseData = snapshot.val();

    // Garantir que não haja valores undefined
    const updatedFields = {
      ...currentCourseData,
      title: courseData.title || '',
      description: courseData.description || '',
      price: parseFloat(courseData.price) || 0,
      // Usar string vazia se category for undefined
      category: courseData.category || '',
      level: courseData.level || '',
      status: courseData.status || 'draft',
      professor_id: courseData.professor_id || currentCourseData.professor_id,
      updated_at: formattedDate
    };

    // Adicionar thumbnail apenas se houver uma nova
    if (thumbnailUrl) {
      updatedFields.thumbnail = thumbnailUrl;
    }

    // Atualizar o curso no Firebase
    await update(courseRef, updatedFields);

    return {
      id: courseId,
      fields: updatedFields
    };
  } catch (error) {
    console.error('Erro ao atualizar curso:', error);
    throw error;
  }
};

export const getCourseById = async (id: string): Promise<Course> => {
  try {
    const courseRef = ref(db, `${collections.courses}/${id}`);
    const snapshot = await get(courseRef);
    
    if (!snapshot.exists()) {
      throw new Error('Curso não encontrado');
    }
    
    const courseData = snapshot.val();
    
    return {
      id: id,
      fields: {
        title: courseData.title,
        description: courseData.description,
        thumbnail: courseData.thumbnail,
        what_will_learn: courseData.what_will_learn,
        requirements: courseData.requirements,
        price: courseData.price,
        level: courseData.level,
        status: courseData.status,
        professor_id: courseData.professor_id,
        category: courseData.category || '',
        created_at: courseData.created_at,
        updated_at: courseData.updated_at
      }
    };
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
};

export const deleteCourse = async (courseId: string) => {
  try {
    // Verificar se existem matrículas ativas
    const enrollmentsRef = ref(db, collections.enrollments);
    const snapshot = await get(enrollmentsRef);
    
    let hasActiveEnrollments = false;
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const enrollment = childSnapshot.val();
        if (enrollment.course_id === courseId && enrollment.status === 'active') {
          hasActiveEnrollments = true;
        }
      });
    }
    
    if (hasActiveEnrollments) {
      throw new Error('Não é possível remover um curso com alunos matriculados');
    }

    // Remover o curso
    const courseRef = ref(db, `${collections.courses}/${courseId}`);
    await remove(courseRef);
    
    return { success: true, id: courseId };
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const coursesRef = ref(db, collections.courses);
    const snapshot = await get(coursesRef);
    
    const courses: Course[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const courseData = childSnapshot.val();
        courses.push({
          id: childSnapshot.key as string,
          fields: courseData
        });
      });
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    courses.sort((a, b) => {
      const dateA = new Date(a.fields.created_at || 0).getTime();
      const dateB = new Date(b.fields.created_at || 0).getTime();
      return dateB - dateA;
    });
    
    return courses;
  } catch (error) {
    console.error('Erro ao buscar todos os cursos:', error);
    throw error;
  }
}; 