import { tables } from './airtable';
import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Course, CreateCourseData, ProfessorStats } from '@/types/course';

export const getUserCourses = async (userId: string): Promise<Course[]> => {
  try {
    const records = await tables.courses.select({
      filterByFormula: `{professor_id} = '${userId}'`,
      sort: [{ field: 'created_at', direction: 'desc' }]
    }).firstPage();

    return records.map(record => ({
      id: record.id,
      fields: {
        title: record.fields.title,
        description: record.fields.description,
        thumbnail: record.fields.thumbnail,
        progress: record.fields.progress,
        professor_name: record.fields.professor_name,
        price: record.fields.price
      }
    }));
  } catch (error: unknown) {
    console.error('Erro ao buscar cursos do usuário:', error);
    throw error;
  }
};

export const getProfessorStats = async (professorId: string): Promise<ProfessorStats> => {
  try {
    console.log('Buscando estatísticas para professor:', professorId);
    
    // Buscar cursos do professor
    const courses = await tables.courses.select({
      filterByFormula: `{professor_id} = '${professorId}'`
    }).firstPage();

    // Buscar cursos publicados
    const publishedCourses = courses.filter(course => 
      course.fields.status === 'published'
    );

    // Buscar matrículas ativas
    const activeEnrollments = await tables.enrollments.select({
      filterByFormula: `AND(
        OR(${publishedCourses.map(c => `{course_id} = '${c.id}'`).join(',')}),
        {status} = 'active'
      )`
    }).firstPage();

    // Calcular receita mensal
    const monthlyRevenue = activeEnrollments.reduce((total, enrollment) => {
      const course = publishedCourses.find(c => c.id === enrollment.fields.course_id);
      const price = course?.fields.price ? Number(course.fields.price) : 0;
      return total + price;
    }, 0);

    // Calcular tendências (exemplo simples)
    const studentsTrend = {
      value: 10,
      isPositive: true
    };

    const revenueTrend = {
      value: 15,
      isPositive: true
    };

    return {
      totalStudents: activeEnrollments.length,
      activeCourses: publishedCourses.length,
      monthlyRevenue,
      studentsTrend,
      revenueTrend
    };

  } catch (error: unknown) {
    console.error('Error fetching professor stats:', error);
    throw error;
  }
};

export const createCourse = async (courseData: CreateCourseData): Promise<Course> => {
  try {
    let thumbnailUrl = '';
    
    if (courseData.thumbnail) {
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${courseData.thumbnail.name}`;
      const storageRef = ref(storage, `course_thumbnails/${fileName}`);
      
      await uploadBytes(storageRef, courseData.thumbnail);
      thumbnailUrl = await getDownloadURL(storageRef);
    }

    const whatWillLearn = Array.isArray(courseData.what_will_learn) 
      ? courseData.what_will_learn.join(',')
      : '';

    const requirements = Array.isArray(courseData.requirements)
      ? courseData.requirements.join(',')
      : '';

    const formattedDate = new Date().toISOString().split('T')[0];

    const courseFields = {
      title: courseData.title,
      description: courseData.description,
      price: Number(courseData.price.toFixed(2)),
      level: courseData.level,
      status: courseData.status,
      thumbnail: thumbnailUrl,
      what_will_learn: whatWillLearn,
      requirements: requirements,
      professor_id: courseData.professor_id,
      created_at: formattedDate,
      updated_at: formattedDate
    };

    const records = await tables.courses.create([
      {
        fields: courseFields
      }
    ]);

    return records[0];
  } catch (error: unknown) {
    console.error('Erro ao criar curso:', error);
    throw error;
  }
};

export const getAllPublishedCourses = async () => {
  try {
    const records = await tables.courses.select({
      filterByFormula: `{status} = 'published'`,
      sort: [{ field: 'created_at', direction: 'desc' }]
    }).firstPage();

    return records;
  } catch (error) {
    console.error('Erro ao buscar cursos publicados:', error);
    throw error;
  }
};

export const updateCourse = async (courseId: string, courseData: {
  title: string;
  description: string;
  price: string;
  category: string;
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
      const storageRef = ref(storage, `course_thumbnails/${fileName}`);
      
      await uploadBytes(storageRef, courseData.thumbnail);
      thumbnailUrl = await getDownloadURL(storageRef);
    }

    const formattedDate = new Date().toISOString().split('T')[0];

    const courseFields = {
      title: courseData.title,
      description: courseData.description,
      price: parseFloat(courseData.price),
      category: courseData.category,
      level: courseData.level,
      status: courseData.status,
      professor_id: courseData.professor_id,
      updated_at: formattedDate,
      ...(thumbnailUrl && { thumbnail: thumbnailUrl })
    };

    const records = await tables.courses.update([
      {
        id: courseId,
        fields: courseFields
      }
    ]);

    return records[0];
  } catch (error) {
    console.error('Erro ao atualizar curso:', error);
    throw error;
  }
};

export const getCourseById = async (id: string) => {
  try {
    const records = await tables.courses.select({
      filterByFormula: `RECORD_ID() = '${id}'`
    }).firstPage();

    return records[0];
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
};

export const deleteCourse = async (courseId: string) => {
  try {
    // Verificar se existem matrículas ativas
    const enrollments = await tables.enrollments.select({
      filterByFormula: `AND(
        {course_id} = '${courseId}',
        {status} = 'active'
      )`
    }).firstPage();

    if (enrollments.length > 0) {
      throw new Error('Não é possível remover um curso com alunos matriculados');
    }

    // Remover o curso
    await tables.courses.destroy([courseId]);

    return true;
  } catch (error) {
    console.error('Erro ao remover curso:', error);
    throw error;
  }
};

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  activeStudents: number;
  pendingProfessors: number;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const users = await tables.users.select().firstPage();
    const activeUsers = users.filter(user => user.fields.status === 'active');

    let pendingProfessors = [];
    try {
      const professors = await tables.professors.select().firstPage();
      pendingProfessors = professors.filter(prof => prof.fields.status === 'pending');
    } catch (error) {
      console.warn('Sem acesso à tabela de professores:', error);
    }

    let courses = [];
    let activeEnrollments = [];
    try {
      courses = await tables.courses.select().firstPage();
      const enrollments = await tables.enrollments.select().firstPage();
      activeEnrollments = enrollments.filter(enroll => enroll.fields.status === 'active');
    } catch (error) {
      console.warn('Erro ao buscar cursos/matrículas:', error);
    }

    const publishedCourses = courses.filter(course => course.fields.status === 'published');
    const totalRevenue = activeEnrollments.reduce((total, enrollment) => {
      const course = courses.find(c => c.id === enrollment.fields.course_id);
      const price = course?.fields.price ? Number(course.fields.price) : 0;
      return total + price;
    }, 0);

    const activeStudentIds = new Set(
      activeEnrollments.map(enrollment => enrollment.fields.user_id)
    );

    return {
      totalUsers: activeUsers.length,
      totalCourses: publishedCourses.length,
      totalRevenue,
      activeStudents: activeStudentIds.size,
      pendingProfessors: pendingProfessors.length
    };
  } catch (error: unknown) {
    console.error('Erro ao buscar estatísticas:', error);
    throw new Error('Falha ao carregar estatísticas administrativas');
  }
}; 