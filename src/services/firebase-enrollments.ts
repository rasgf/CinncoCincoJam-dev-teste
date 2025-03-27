import { getDatabase, ref, set, get, query, orderByChild, equalTo, push, update } from 'firebase/database';
import { collections } from './firebase';

const db = getDatabase();

interface CreateEnrollmentData {
  user_id: string;
  course_id: string;
  professor_id: string;
  status?: 'active' | 'completed' | 'cancelled';
}

export const createEnrollment = async (data: CreateEnrollmentData) => {
  try {
    const enrollmentData = {
      user_id: data.user_id,
      course_id: data.course_id,
      professor_id: data.professor_id,
      status: data.status || 'active',
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const enrollmentsRef = ref(db, collections.enrollments);
    const newEnrollmentRef = push(enrollmentsRef);
    await set(newEnrollmentRef, enrollmentData);
    
    return {
      id: newEnrollmentRef.key,
      fields: enrollmentData
    };
  } catch (error) {
    console.error('Erro ao criar matrícula:', error);
    throw error;
  }
};

export const checkEnrollment = async (userId: string, courseId: string) => {
  try {
    const enrollmentsRef = ref(db, collections.enrollments);
    const userQuery = query(
      enrollmentsRef, 
      orderByChild('user_id'), 
      equalTo(userId)
    );
    
    const snapshot = await get(userQuery);
    
    if (!snapshot.exists()) {
      return false;
    }
    
    let hasEnrollment = false;
    
    snapshot.forEach((childSnapshot) => {
      const enrollment = childSnapshot.val();
      if (enrollment.course_id === courseId && enrollment.status !== 'cancelled') {
        hasEnrollment = true;
      }
    });
    
    return hasEnrollment;
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
    const enrollmentsRef = ref(db, collections.enrollments);
    const userQuery = query(enrollmentsRef, orderByChild('user_id'), equalTo(userId));
    const snapshot = await get(userQuery);
    
    if (!snapshot.exists()) {
      return {
        enrolledCourses: 0,
        completedCourses: 0,
        totalHoursStudied: 0,
        currentProgress: 0
      };
    }
    
    const enrollments: any[] = [];
    const courseIds: string[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const enrollment = {
        id: childSnapshot.key,
        fields: childSnapshot.val()
      };
      enrollments.push(enrollment);
      courseIds.push(enrollment.fields.course_id);
    });
    
    // Buscar todos os cursos relacionados às matrículas
    const coursesRef = ref(db, collections.courses);
    const coursesSnapshot = await get(coursesRef);
    const courses: any[] = [];
    
    if (coursesSnapshot.exists()) {
      coursesSnapshot.forEach((childSnapshot) => {
        if (courseIds.includes(childSnapshot.key)) {
          courses.push({
            id: childSnapshot.key,
            fields: childSnapshot.val()
          });
        }
      });
    }
    
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

export interface EnrollmentWithDetails {
  id: string;
  fields: {
    user_id: string;
    course_id: string;
    professor_id: string;
    status: string;
    created_at: string;
    userName?: string;
    userEmail?: string;
    courseName?: string;
    professorName?: string;
  };
}

export const getAllEnrollments = async (): Promise<EnrollmentWithDetails[]> => {
  try {
    // Buscar todas as matrículas
    const enrollmentsRef = ref(db, collections.enrollments);
    const enrollmentsSnapshot = await get(enrollmentsRef);
    
    if (!enrollmentsSnapshot.exists()) {
      return [];
    }
    
    const enrollments: EnrollmentWithDetails[] = [];
    const userIds = new Set();
    const courseIds = new Set();
    const professorIds = new Set();
    
    // Primeiro, coletamos todos os IDs únicos
    enrollmentsSnapshot.forEach((childSnapshot) => {
      const enrollmentData = childSnapshot.val();
      userIds.add(enrollmentData.user_id);
      courseIds.add(enrollmentData.course_id);
      professorIds.add(enrollmentData.professor_id);
      
      enrollments.push({
        id: childSnapshot.key as string,
        fields: enrollmentData
      });
    });
    
    // Buscar dados de usuários, cursos e professores de uma vez
    const [usersSnapshot, coursesSnapshot] = await Promise.all([
      get(ref(db, collections.users)),
      get(ref(db, collections.courses))
    ]);
    
    const users = new Map();
    const courses = new Map();
    
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((child) => {
        if (userIds.has(child.key) || professorIds.has(child.key)) {
          users.set(child.key, child.val());
        }
      });
    }
    
    if (coursesSnapshot.exists()) {
      coursesSnapshot.forEach((child) => {
        if (courseIds.has(child.key)) {
          courses.set(child.key, child.val());
        }
      });
    }
    
    // Enriquecer os dados de matrícula com informações adicionais
    return enrollments.map(enrollment => {
      const user = users.get(enrollment.fields.user_id);
      const course = courses.get(enrollment.fields.course_id);
      const professor = users.get(enrollment.fields.professor_id);
      
      return {
        ...enrollment,
        fields: {
          ...enrollment.fields,
          userName: user?.name || '',
          userEmail: user?.email || '',
          courseName: course?.title || '',
          professorName: professor?.name || ''
        }
      };
    });
  } catch (error) {
    console.error('Erro ao buscar matrículas:', error);
    throw error;
  }
};

export interface UserEnrollmentWithCourse {
  id: string;
  fields: {
    course_id: string;
    professor_id: string;
    status: string;
    progress: number;
    created_at: string;
    updated_at: string;
    courseName: string;
    courseDescription: string;
    courseImage: string;
    professorName: string;
    rating?: number;
    ratingCount?: number;
  };
}

export const getUserEnrollments = async (userId: string): Promise<UserEnrollmentWithCourse[]> => {
  try {
    // Buscar todas as matrículas do usuário
    const enrollmentsRef = ref(db, collections.enrollments);
    const userQuery = query(enrollmentsRef, orderByChild('user_id'), equalTo(userId));
    const snapshot = await get(userQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const enrollments: any[] = [];
    const courseIds = new Set<string>();
    const professorIds = new Set<string>();
    
    snapshot.forEach((childSnapshot) => {
      const enrollmentData = childSnapshot.val();
      const enrollmentId = childSnapshot.key as string;
      
      // Filtrar apenas matrículas ativas ou completadas, ignorando canceladas
      if (enrollmentData.status !== 'cancelled') {
        enrollments.push({
          id: enrollmentId,
          fields: enrollmentData
        });
        
        courseIds.add(enrollmentData.course_id);
        professorIds.add(enrollmentData.professor_id);
      }
    });
    
    // Se todas as matrículas foram filtradas, retorne um array vazio
    if (enrollments.length === 0) {
      return [];
    }
    
    // Buscar dados dos cursos e professores
    const [coursesSnapshot, usersSnapshot] = await Promise.all([
      get(ref(db, collections.courses)),
      get(ref(db, collections.users))
    ]);
    
    const courses = new Map<string, any>();
    const professors = new Map<string, any>();
    
    if (coursesSnapshot.exists()) {
      coursesSnapshot.forEach((child) => {
        if (courseIds.has(child.key as string)) {
          courses.set(child.key as string, child.val());
        }
      });
    }
    
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((child) => {
        if (professorIds.has(child.key as string)) {
          professors.set(child.key as string, child.val());
        }
      });
    }
    
    // Buscar avaliações para cada curso
    const { getCourseAverageRating } = await import('./firebase-ratings');
    const ratingsPromises = Array.from(courseIds).map(async (courseId) => {
      try {
        const ratingData = await getCourseAverageRating(courseId);
        return { courseId, rating: ratingData.average, count: ratingData.count };
      } catch (error) {
        console.error(`Erro ao carregar avaliações para o curso ${courseId}:`, error);
        return { courseId, rating: 0, count: 0 };
      }
    });
    
    const ratingsResults = await Promise.all(ratingsPromises);
    const ratingsMap = new Map<string, { rating: number, count: number }>();
    ratingsResults.forEach(result => {
      ratingsMap.set(result.courseId, { rating: result.rating, count: result.count });
    });
    
    // Combinar dados de matrículas com cursos e professores
    return enrollments.map(enrollment => {
      const course = courses.get(enrollment.fields.course_id) || {};
      const professor = professors.get(enrollment.fields.professor_id) || {};
      const ratings = ratingsMap.get(enrollment.fields.course_id) || { rating: 0, count: 0 };
      
      // Verificar ambas as propriedades possíveis para a imagem
      const courseImage = course.image || course.thumbnail || '';
      
      return {
        id: enrollment.id,
        fields: {
          ...enrollment.fields,
          courseName: course.title || 'Curso não encontrado',
          courseDescription: course.description || '',
          courseImage,
          professorName: professor.name || 'Professor não encontrado',
          rating: ratings.rating,
          ratingCount: ratings.count
        }
      };
    });
  } catch (error) {
    console.error('Erro ao buscar matrículas do usuário:', error);
    throw error;
  }
};

/**
 * Cancela a matrícula de um usuário em um curso específico
 * @param userId - ID do usuário
 * @param courseId - ID do curso
 * @returns true se a matrícula foi cancelada com sucesso
 */
export const cancelEnrollment = async (userId: string, courseId: string) => {
  try {
    // Buscar todas as matrículas do usuário
    const enrollmentsRef = ref(db, collections.enrollments);
    const userQuery = query(
      enrollmentsRef, 
      orderByChild('user_id'), 
      equalTo(userId)
    );
    
    const snapshot = await get(userQuery);
    
    if (!snapshot.exists()) {
      throw new Error('Nenhuma matrícula encontrada para este usuário');
    }
    
    let enrollmentId: string | null = null;
    
    // Encontrar a matrícula específica para este curso
    snapshot.forEach((childSnapshot) => {
      const enrollment = childSnapshot.val();
      if (enrollment.course_id === courseId) {
        enrollmentId = childSnapshot.key;
      }
    });
    
    if (!enrollmentId) {
      throw new Error('Matrícula não encontrada para este curso');
    }
    
    // Atualizar o status da matrícula para 'cancelled'
    const enrollmentRef = ref(db, `${collections.enrollments}/${enrollmentId}`);
    await update(enrollmentRef, {
      status: 'cancelled',
      updated_at: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao cancelar matrícula:', error);
    throw error;
  }
}; 