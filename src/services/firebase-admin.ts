import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { collections } from './firebase';

const db = getDatabase();

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  activeStudents: number;
  pendingProfessors: number;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    // Inicializar valores padrão
    let totalUsers = 0;
    let totalCourses = 0;
    let totalRevenue = 0;
    let activeStudents = 0;
    let pendingProfessors = 0;

    try {
      // Buscar usuários ativos
      const usersRef = ref(db, collections.users);
      const activeQuery = query(usersRef, orderByChild('status'), equalTo('active'));
      const snapshot = await get(activeQuery);
      
      if (snapshot.exists()) {
        totalUsers = Object.keys(snapshot.val()).length;
      }
    } catch (error) {
      console.warn('Erro ao buscar usuários:', error);
    }

    try {
      // Buscar cursos publicados
      const coursesRef = ref(db, collections.courses);
      const publishedQuery = query(coursesRef, orderByChild('status'), equalTo('published'));
      const coursesSnapshot = await get(publishedQuery);
      
      if (coursesSnapshot.exists()) {
        const courses = coursesSnapshot.val();
        totalCourses = Object.keys(courses).length;
        
        // Calcular receita total dos cursos publicados
        Object.values(courses).forEach((course: any) => {
          totalRevenue += parseFloat(course.price) || 0;
        });
      }
    } catch (error) {
      console.warn('Erro ao buscar cursos:', error);
    }

    try {
      // Contar alunos ativos (usuários com papel de aluno)
      const usersRef = ref(db, collections.users);
      const studentsQuery = query(
        usersRef, 
        orderByChild('role'), 
        equalTo('aluno')
      );
      const studentsSnapshot = await get(studentsQuery);
      
      if (studentsSnapshot.exists()) {
        let count = 0;
        studentsSnapshot.forEach((childSnapshot) => {
          const student = childSnapshot.val();
          if (student.status === 'active') {
            count++;
          }
        });
        activeStudents = count;
      }
    } catch (error) {
      console.warn('Erro ao buscar alunos ativos:', error);
    }

    try {
      // Contar professores pendentes
      const usersRef = ref(db, collections.users);
      const pendingQuery = query(
        usersRef, 
        orderByChild('role'), 
        equalTo('professor')
      );
      const pendingSnapshot = await get(pendingQuery);
      
      if (pendingSnapshot.exists()) {
        let count = 0;
        pendingSnapshot.forEach((childSnapshot) => {
          const professor = childSnapshot.val();
          if (professor.status === 'pending') {
            count++;
          }
        });
        pendingProfessors = count;
      }
    } catch (error) {
      console.warn('Erro ao buscar professores pendentes:', error);
    }

    return {
      totalUsers,
      totalCourses,
      totalRevenue,
      activeStudents,
      pendingProfessors
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de admin:', error);
    throw error;
  }
}; 