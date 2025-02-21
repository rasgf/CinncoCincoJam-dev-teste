import { tables } from './airtable';
import { deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import { Record, FieldSet } from 'airtable';

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  activeStudents: number;
  pendingProfessors: number;
}

interface AirtableCourse {
  id: string;
  fields: {
    price: number | string;
    course_id: string;
    // ... outros campos
  };
}

interface AirtableEnrollment {
  id: string;
  fields: {
    course_id: string;
    status: string;
    // ... outros campos
  };
}

interface User {
  id: string;
  fields: {
    uid: string;
    email: string;
    name: string;
    role: string;
    status: string;
    created_at: string;
  };
}

interface EnrollmentRecord extends Record<FieldSet> {
  fields: {
    status: string;
    course_id: string;
    user_id: string;
  };
}

interface CourseRecord extends Record<FieldSet> {
  fields: {
    price: number;
    status: string;
  };
}

interface CourseFields {
  price: number;
  course_id: string;
  // ... outros campos
}

interface Course {
  id: string;
  fields: CourseFields;
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
      const users = await tables.users.select({
        filterByFormula: `{status} = 'active'`
      }).firstPage();
      totalUsers = users.length;
    } catch (error) {
      console.warn('Erro ao buscar usuários:', error);
    }

    try {
      // Buscar cursos publicados
      const publishedCourses = await tables.courses.select({
        filterByFormula: `{status} = 'published'`
      }).firstPage();
      totalCourses = publishedCourses.length;

      // Buscar matrículas ativas apenas se houver cursos publicados
      if (publishedCourses.length > 0) {
        const courseIds = publishedCourses.map(c => c.id);
        const enrollmentsFormula = `AND(
          OR(${courseIds.map(id => `{course_id} = '${id}'`).join(',')}),
          {status} = 'active'
        )`;

        const activeEnrollments = await tables.enrollments.select({
          filterByFormula: enrollmentsFormula
        }).firstPage();

        // Calcular receita total
        if (activeEnrollments.length > 0) {
          totalRevenue = activeEnrollments.reduce((total, enrollment) => {
            const course = publishedCourses.find(c => c.id === enrollment.fields.course_id);
            // Garantir que o preço é um número
            const price = course?.fields.price ? Number(course.fields.price) : 0;
            return total + price;
          }, 0);
        }

        // Obter IDs únicos de alunos ativos
        const activeStudentIds = new Set(
          activeEnrollments.map(enrollment => enrollment.fields.user_id)
        );
        activeStudents = activeStudentIds.size;
      }
    } catch (error) {
      console.warn('Erro ao buscar cursos/matrículas:', error);
    }

    try {
      // Buscar professores pendentes
      const professors = await tables.professors.select({
        filterByFormula: `{status} = 'pending'`
      }).firstPage();
      pendingProfessors = professors.length;
    } catch (error) {
      console.warn('Erro ao buscar professores:', error);
    }

    return {
      totalUsers,
      totalCourses,
      totalRevenue,
      activeStudents,
      pendingProfessors
    };

  } catch (error: unknown) {
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

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const records = await tables.users.select({
      sort: [{ field: 'created_at', direction: 'desc' }]
    }).firstPage();

    return records.map(record => ({
      id: record.id,
      fields: {
        uid: record.fields.uid as string,
        email: record.fields.email as string,
        name: record.fields.name as string,
        role: (record.fields.role as string) || 'aluno',
        status: (record.fields.status as string) || 'active',
        created_at: record.fields.created_at as string
      }
    }));
  } catch (error: unknown) {
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