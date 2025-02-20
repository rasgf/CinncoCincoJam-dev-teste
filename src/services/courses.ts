import { tables } from './airtable';
import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const getUserCourses = async (userId: string) => {
  try {
    // Buscar cursos diretamente usando o ID do usuário
    const courseRecords = await tables.courses.select({
      filterByFormula: `{professor_id} = '${userId}'`,
      sort: [{ field: 'created_at', direction: 'desc' }]
    }).firstPage();

    return courseRecords;
  } catch (error) {
    console.error('Erro ao buscar cursos do usuário:', error);
    throw error;
  }
};

export const getProfessorStats = async (professorId: string): Promise<ProfessorStats> => {
  try {
    // Buscar cursos do professor
    const courses = await tables.courses.select({
      filterByFormula: `{user_id} = '${professorId}'`
    }).firstPage();

    const courseIds = courses.map(course => course.id);

    // Buscar matrículas dos cursos do professor
    const enrollments = courseIds.length > 0 
      ? await tables.enrollments.select({
          filterByFormula: `OR(${courseIds.map(id => `{course_id} = '${id}'`).join(',')})`,
        }).firstPage()
      : [];

    const activeEnrollments = enrollments.filter(e => e.fields.status === 'active');

    // Calcular receita mensal
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyEnrollments = enrollments.filter(enrollment => {
      const enrollmentDate = new Date(enrollment.fields.created_at);
      return enrollmentDate >= firstDayOfMonth;
    });

    const monthlyRevenue = monthlyEnrollments.reduce((total, enrollment) => {
      const course = courses.find(c => c.id === enrollment.fields.course_id);
      return total + (course?.fields.price || 0);
    }, 0);

    // Calcular tendências
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnrollments = enrollments.filter(enrollment => {
      const enrollmentDate = new Date(enrollment.fields.created_at);
      return enrollmentDate >= lastMonth && enrollmentDate < firstDayOfMonth;
    });

    const studentsTrend = {
      value: lastMonthEnrollments.length > 0 
        ? Math.round(((monthlyEnrollments.length - lastMonthEnrollments.length) / lastMonthEnrollments.length) * 100)
        : 0,
      isPositive: monthlyEnrollments.length >= lastMonthEnrollments.length
    };

    const lastMonthRevenue = lastMonthEnrollments.reduce((total, enrollment) => {
      const course = courses.find(c => c.id === enrollment.fields.course_id);
      return total + (course?.fields.price || 0);
    }, 0);

    const revenueTrend = {
      value: lastMonthRevenue > 0 
        ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : 0,
      isPositive: monthlyRevenue >= lastMonthRevenue
    };

    return {
      totalStudents: activeEnrollments.length,
      activeCourses: courses.filter(c => c.fields.status === 'published').length,
      monthlyRevenue,
      studentsTrend,
      revenueTrend
    };
  } catch (error) {
    console.error('Error fetching professor stats:', error);
    throw error;
  }
};

interface CreateCourseData {
  title: string;
  description: string;
  price: string;
  category: string;
  level: string;
  thumbnail: File | null;
  professor_id: string;
}

export const createCourse = async (courseData: CreateCourseData) => {
  try {
    console.log('Iniciando criação do curso:', courseData);

    let thumbnailUrl = '';
    
    if (courseData.thumbnail) {
      console.log('Iniciando upload da thumbnail...');
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${courseData.thumbnail.name}`;
      const storageRef = ref(storage, `course_thumbnails/${fileName}`);
      
      const uploadResult = await uploadBytes(storageRef, courseData.thumbnail);
      console.log('Upload concluído:', uploadResult);
      
      thumbnailUrl = await getDownloadURL(storageRef);
      console.log('URL da thumbnail:', thumbnailUrl);
    }

    // Converter e validar o preço
    const price = Number(courseData.price);
    if (isNaN(price)) {
      throw new Error('Preço inválido');
    }

    const courseFields = {
      title: courseData.title,
      description: courseData.description,
      price: price, // Usar o número convertido
      category: courseData.category,
      level: courseData.level,
      thumbnail: thumbnailUrl,
      professor_id: courseData.professor_id,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Criando registro no Airtable:', courseFields);

    const records = await tables.courses.create([
      {
        fields: courseFields
      }
    ]);

    console.log('Curso criado com sucesso:', records[0]);
    return records[0];
  } catch (error) {
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

    const courseFields = {
      title: courseData.title,
      description: courseData.description,
      price: parseFloat(courseData.price),
      category: courseData.category,
      level: courseData.level,
      status: courseData.status,
      professor_id: courseData.professor_id,
      updated_at: new Date().toISOString(),
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
    console.log('Buscando curso no Airtable com ID:', id);
    const record = await tables.courses.find(id);
    console.log('Resposta do Airtable:', record);
    return record;
  } catch (error) {
    console.error('Erro detalhado ao buscar curso:', error);
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