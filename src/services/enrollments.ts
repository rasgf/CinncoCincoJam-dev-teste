import { tables } from './airtable';

interface CreateEnrollmentData {
  user_id: string;
  course_id: string;
  professor_id: string;
  status?: 'active' | 'completed' | 'cancelled';
}

export const createEnrollment = async (data: CreateEnrollmentData) => {
  try {
    const records = await tables.enrollments.create([
      {
        fields: {
          user_id: data.user_id,
          course_id: data.course_id,
          professor_id: data.professor_id,
          status: data.status || 'active',
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    ]);

    return records[0];
  } catch (error) {
    console.error('Erro ao criar matrícula:', error);
    throw error;
  }
};

export const checkEnrollment = async (userId: string, courseId: string) => {
  try {
    const records = await tables.enrollments.select({
      filterByFormula: `AND(
        {user_id} = '${userId}',
        {course_id} = '${courseId}',
        {status} = 'active'
      )`
    }).firstPage();

    return records.length > 0;
  } catch (error) {
    console.error('Erro ao verificar matrícula:', error);
    throw error;
  }
};

interface StudentStats {
  enrolledCourses: number;
  completedCourses: number;
  totalHoursStudied: number;
  currentProgress: number;
  nextLesson?: {
    title: string;
    courseTitle: string;
    duration: number;
  };
}

export const getStudentStats = async (userId: string): Promise<StudentStats> => {
  try {
    // Buscar todas as matrículas do aluno
    const enrollments = await tables.enrollments.select({
      filterByFormula: `{user_id} = '${userId}'`
    }).firstPage();

    // Buscar todos os cursos relacionados às matrículas
    const courseIds = enrollments.map(enrollment => enrollment.fields.course_id);
    const courses = courseIds.length > 0 
      ? await tables.courses.select({
          filterByFormula: `OR(${courseIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`
        }).firstPage()
      : [];

    // Calcular estatísticas
    const activeEnrollments = enrollments.filter(e => e.fields.status === 'active');
    const completedEnrollments = enrollments.filter(e => e.fields.status === 'completed');
    
    // Calcular total de horas estudadas
    const totalHoursStudied = enrollments.reduce((total, enrollment) => {
      return total + (enrollment.fields.progress || 0);
    }, 0);

    // Encontrar próxima aula (do curso mais recentemente acessado)
    let nextLesson;
    if (activeEnrollments.length > 0) {
      const lastAccessed = activeEnrollments.sort((a, b) => {
        const dateA = new Date(a.fields.updated_at || '');
        const dateB = new Date(b.fields.updated_at || '');
        return dateB.getTime() - dateA.getTime();
      })[0];

      const course = courses.find(c => c.id === lastAccessed.fields.course_id);
      if (course) {
        nextLesson = {
          title: "Próxima Aula", // Você precisará implementar a lógica de aulas
          courseTitle: course.fields.title,
          duration: 30 // Valor exemplo - implemente conforme sua estrutura
        };
      }
    }

    return {
      enrolledCourses: activeEnrollments.length,
      completedCourses: completedEnrollments.length,
      totalHoursStudied: Math.round(totalHoursStudied),
      currentProgress: activeEnrollments.length > 0 
        ? Math.round((completedEnrollments.length / enrollments.length) * 100)
        : 0,
      nextLesson
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do aluno:', error);
    throw error;
  }
}; 