import { getDatabase, ref, set, get, query, orderByChild, equalTo, push } from 'firebase/database';
import { Professor } from '@/types/course';
import { collections } from './firebase';

const db = getDatabase();

export const getProfessors = async (): Promise<Professor[]> => {
  try {
    // Buscar todos os professores aprovados
    const professorsRef = ref(db, collections.professors);
    const statusQuery = query(professorsRef, orderByChild('status'), equalTo('approved'));
    const snapshot = await get(statusQuery);
    
    const professors: Professor[] = [];
    const userIds: string[] = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const professor: Professor = {
          id: childSnapshot.key as string,
          fields: {
            ...data,
            status: data.status || 'pending' as 'pending' | 'active' | 'inactive',
            role: data.role || 'professor' as 'professor',
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString()
          }
        };
        professors.push(professor);
        userIds.push(professor.fields.user_id);
      });
    }
    
    // Buscar informações dos usuários correspondentes
    const usersRef = ref(db, collections.users);
    const usersSnapshot = await get(usersRef);
    const users: any[] = [];
    
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        if (userIds.includes(childSnapshot.key as string)) {
          users.push({
            id: childSnapshot.key,
            fields: childSnapshot.val()
          });
        }
      });
    }
    
    // Combinar dados de professor com dados de usuário
    return professors.map(professor => {
      const user = users.find(u => u.id === professor.fields.user_id);
      return {
        ...professor,
        fields: {
          ...professor.fields,
          name: user?.fields.name || professor.fields.name || '',
          profile_image: user?.fields.profile_image || professor.fields.profile_image,
        }
      };
    });
  } catch (error) {
    console.error('Erro ao buscar professores:', error);
    throw new Error('Falha ao carregar lista de professores');
  }
};

export const getProfessorById = async (id: string) => {
  try {
    const professorRef = ref(db, `${collections.professors}/${id}`);
    const snapshot = await get(professorRef);
    
    if (!snapshot.exists()) {
      throw new Error('Professor não encontrado');
    }
    
    const professorData = snapshot.val();
    
    const professor = {
      id,
      fields: {
        ...professorData,
        status: professorData.status || 'pending' as 'pending' | 'active' | 'inactive',
        role: professorData.role || 'professor' as 'professor',
        created_at: professorData.created_at || new Date().toISOString(),
        updated_at: professorData.updated_at || new Date().toISOString()
      }
    };
    
    const userRef = ref(db, `${collections.users}/${professor.fields.user_id}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      throw new Error('Usuário do professor não encontrado');
    }
    
    const user = userSnapshot.val();
    
    return {
      ...professor,
      fields: {
        ...professor.fields,
        name: user.name,
        profile_image: user.profile_image,
      }
    };
  } catch (error) {
    console.error('Erro ao buscar professor:', error);
    throw new Error('Falha ao carregar dados do professor');
  }
};

export const getProfessorByUserId = async (userId: string): Promise<Professor | null> => {
  try {
    const professorsRef = ref(db, collections.professors);
    const userQuery = query(professorsRef, orderByChild('user_id'), equalTo(userId));
    const snapshot = await get(userQuery);
    
    if (!snapshot.exists() || snapshot.size === 0) {
      // Se não encontrar o professor, buscar dados do usuário e criar o registro
      const userRef = ref(db, `${collections.users}/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        throw new Error('Usuário não encontrado');
      }
      
      const userData = userSnapshot.val();
      
      const newProfessor = await createProfessor({
        user_id: userId,
        name: userData.name,
        email: userData.email,
        status: 'active' as 'pending' | 'active' | 'inactive' // ou o status inicial apropriado
      });
      
      return newProfessor;
    }
    
    let professor: Professor | null = null;
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      professor = {
        id: childSnapshot.key as string,
        fields: {
          ...data,
          status: data.status || 'pending' as 'pending' | 'active' | 'inactive',
          role: data.role || 'professor' as 'professor',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        }
      };
    });
    
    return professor;
  } catch (error) {
    console.error('Erro ao buscar/criar professor:', error);
    throw error;
  }
};

export const createProfessor = async (userData: {
  user_id: string;
  name: string;
  email: string;
  bio?: string;
  status?: "pending" | "active" | "inactive";
}) => {
  try {
    const professorData = {
      user_id: userData.user_id,
      name: userData.name,
      email: userData.email,
      bio: userData.bio || '',
      status: userData.status || 'pending' as "pending" | "active" | "inactive",
      role: 'professor' as "professor",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const professorsRef = ref(db, collections.professors);
    const newProfessorRef = push(professorsRef);
    await set(newProfessorRef, professorData);
    
    return {
      id: newProfessorRef.key as string,
      fields: professorData
    };
  } catch (error) {
    console.error('Erro ao criar professor:', error);
    throw error;
  }
}; 