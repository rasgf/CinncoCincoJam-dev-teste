import { tables } from './airtable';
import { deleteUser, signInWithEmailAndPassword } from 'firebase/auth';

export const getAdminStats = async () => {
  try {
    // Buscar todos os usuários ativos
    const users = await tables.users.select().firstPage();
    const activeUsers = users.filter(user => user.fields.status === 'active');

    // Buscar professores pendentes
    const professors = await tables.professors.select().firstPage();
    const pendingProfessors = professors.filter(prof => prof.fields.status === 'pending');

    // Buscar todos os cursos
    const courses = await tables.courses.select().firstPage();
    const publishedCourses = courses.filter(course => course.fields.status === 'published');

    // Buscar todas as matrículas
    const enrollments = await tables.enrollments.select().firstPage();
    const activeEnrollments = enrollments.filter(enroll => enroll.fields.status === 'active');

    // Calcular receita total (soma do preço de todas as matrículas ativas)
    const totalRevenue = activeEnrollments.reduce((total, enrollment) => {
      // Encontrar o curso correspondente à matrícula
      const course = courses.find(c => c.id === enrollment.fields.course_id);
      return total + (course?.fields.price || 0);
    }, 0);

    // Contar alunos ativos (usuários com pelo menos uma matrícula ativa)
    const activeStudentIds = new Set(
      activeEnrollments.map(enrollment => enrollment.fields.user_id)
    );

    console.log('Estatísticas calculadas:', {
      totalUsers: activeUsers.length,
      totalCourses: publishedCourses.length,
      totalRevenue,
      activeStudents: activeStudentIds.size,
      pendingProfessors: pendingProfessors.length
    });

    return {
      totalUsers: activeUsers.length,
      totalCourses: publishedCourses.length,
      totalRevenue,
      activeStudents: activeStudentIds.size,
      pendingProfessors: pendingProfessors.length
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    throw new Error('Falha ao carregar estatísticas administrativas');
  }
};

export const getPendingProfessors = async () => {
  try {
    const records = await tables.professors.select().firstPage();
    const pendingProfessors = records.filter(prof => prof.fields.status === 'pending');

    // Buscar informações dos usuários correspondentes
    const userIds = pendingProfessors.map(prof => prof.fields.user_id);
    const users = await tables.users.select({
      filterByFormula: `OR(${userIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`
    }).firstPage();

    // Combinar dados de professor com dados de usuário
    return pendingProfessors.map(professor => {
      const user = users.find(u => u.id === professor.fields.user_id);
      return {
        ...professor,
        fields: {
          ...professor.fields,
          name: user?.fields.name || '',
          email: user?.fields.email || '',
        }
      };
    });
  } catch (error) {
    console.error('Erro ao buscar professores pendentes:', error);
    throw new Error('Falha ao carregar professores pendentes');
  }
};

export const approveProfessor = async (professorId: string) => {
  try {
    const records = await tables.professors.update([{
      id: professorId,
      fields: {
        status: 'approved',
        updated_at: new Date().toISOString()
      }
    }]);

    return records[0];
  } catch (error) {
    console.error('Error approving professor:', error);
    throw error;
  }
};

export const rejectProfessor = async (professorId: string) => {
  try {
    const records = await tables.professors.update([{
      id: professorId,
      fields: {
        status: 'rejected',
        updated_at: new Date().toISOString()
      }
    }]);

    return records[0];
  } catch (error) {
    console.error('Error rejecting professor:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const records = await tables.users.select({
      sort: [{ field: 'created_at', direction: 'desc' }]
    }).firstPage();
    return records;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const updateUserStatus = async (userId: string, status: 'active' | 'inactive') => {
  try {
    const records = await tables.users.update([{
      id: userId,
      fields: {
        status,
        updated_at: new Date().toISOString()
      }
    }]);
    return records[0];
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

export const getSystemSettings = async () => {
  try {
    const records = await tables.settings.select().firstPage();
    return records[0];
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

export const updateSystemSettings = async (settingsId: string, data: any) => {
  try {
    const records = await tables.settings.update([{
      id: settingsId,
      fields: {
        ...data,
        updated_at: new Date().toISOString()
      }
    }]);
    return records[0];
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};

export const updateUserRole = async (userId: string, role: 'admin' | 'professor' | 'aluno') => {
  try {
    const records = await tables.users.update([{
      id: userId,
      fields: {
        role,
        updated_at: new Date().toISOString()
      }
    }]);
    return records[0];
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new Error('Falha ao atualizar tipo de usuário');
  }
};

interface CreateUserData {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'professor' | 'aluno';
  status: 'active' | 'inactive';
}

export const createUser = async (data: CreateUserData) => {
  try {
    const records = await tables.users.create([
      {
        fields: {
          uid: data.uid,
          email: data.email,
          name: data.name,
          role: data.role,
          status: data.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    ]);

    return records[0];
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, data: Partial<CreateUserData>) => {
  try {
    const records = await tables.users.update([
      {
        id: userId,
        fields: {
          ...data,
          updated_at: new Date().toISOString()
        }
      }
    ]);

    return records[0];
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
};

export const removeUser = async (userId: string, firebaseUid: string, email: string, secondaryAuth: any) => {
  try {
    // Primeiro remove do Airtable
    await tables.users.destroy([userId]);

    // Tenta remover do Firebase
    try {
      // Faz login com o usuário que será removido
      await signInWithEmailAndPassword(secondaryAuth, email, 'senha123');
      const user = secondaryAuth.currentUser;
      
      if (user) {
        await deleteUser(user);
      }
    } catch (firebaseError) {
      console.error('Erro ao remover usuário do Firebase:', firebaseError);
      // Continua mesmo se falhar no Firebase, já que o usuário foi removido do Airtable
    }

    return true;
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    throw error;
  }
};

export const promoteToTeacher = async (userId: string) => {
  try {
    // Atualizar role do usuário para professor
    await tables.users.update([{
      id: userId,
      fields: {
        role: 'professor',
        updated_at: new Date().toISOString()
      }
    }]);

    return true;
  } catch (error) {
    console.error('Erro ao promover usuário para professor:', error);
    throw error;
  }
};

export const revokeTeacherRole = async (userId: string) => {
  try {
    // Verificar se o professor tem cursos
    const courses = await tables.courses.select({
      filterByFormula: `{professor_id} = '${userId}'`
    }).firstPage();

    if (courses.length > 0) {
      throw new Error('Não é possível remover um professor que possui cursos');
    }

    // Atualizar role do usuário para aluno
    await tables.users.update([{
      id: userId,
      fields: {
        role: 'aluno',
        updated_at: new Date().toISOString()
      }
    }]);

    return true;
  } catch (error) {
    console.error('Erro ao revogar papel de professor:', error);
    throw error;
  }
}; 