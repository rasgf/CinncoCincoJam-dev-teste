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
    console.log('getProfessorById - Buscando professor com ID:', id);
    
    // Verificar se o ID é válido
    if (!id) {
      console.error('getProfessorById - ID inválido:', id);
      throw new Error('ID de professor inválido');
    }
    
    // Primeiro, tentar buscar diretamente pelo ID do professor
    const professorRef = ref(db, `${collections.professors}/${id}`);
    const snapshot = await get(professorRef);
    
    console.log('getProfessorById - Resultado da busca direta:', snapshot.exists() ? 'Encontrado' : 'Não encontrado');
    
    if (!snapshot.exists()) {
      // Se não encontrar pelo ID direto, tentar buscar pelo user_id
      console.log('getProfessorById - Professor não encontrado pelo ID direto, tentando como user_id');
      try {
        const professor = await getProfessorByUserId(id);
        if (professor) {
          console.log('getProfessorById - Professor encontrado pelo user_id:', professor);
          return professor;
        }
      } catch (error) {
        console.error('getProfessorById - Erro ao buscar professor pelo user_id:', error);
      }
      
      throw new Error('Professor não encontrado');
    }
    
    const professorData = snapshot.val();
    console.log('getProfessorById - Dados do professor encontrados:', professorData);
    
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
    
    // Se o professor tem user_id, buscar dados adicionais do usuário
    if (professor.fields.user_id) {
      try {
        const userRef = ref(db, `${collections.users}/${professor.fields.user_id}`);
        const userSnapshot = await get(userRef);
        
        if (userSnapshot.exists()) {
          const user = userSnapshot.val();
          professor.fields.name = user.name || professor.fields.name;
          professor.fields.profile_image = user.profile_image || professor.fields.profile_image;
        }
      } catch (userError) {
        console.error('getProfessorById - Erro ao buscar dados do usuário:', userError);
      }
    }
    
    console.log('getProfessorById - Professor completo:', professor);
    return professor;
  } catch (error) {
    console.error('Erro ao buscar professor:', error);
    throw error;
  }
};

export const getProfessorByUserId = async (userId: string): Promise<Professor | null> => {
  try {
    console.log('getProfessorByUserId - Buscando professor com user_id:', userId);
    
    // Primeiro, verificar se o userId é válido
    if (!userId) {
      console.error('getProfessorByUserId - userId inválido:', userId);
      throw new Error('ID de usuário inválido');
    }
    
    const professorsRef = ref(db, collections.professors);
    const userQuery = query(professorsRef, orderByChild('user_id'), equalTo(userId));
    const snapshot = await get(userQuery);
    
    console.log('getProfessorByUserId - Resultado da busca:', snapshot.exists() ? 'Encontrado' : 'Não encontrado');
    
    if (!snapshot.exists() || snapshot.size === 0) {
      console.log('getProfessorByUserId - Professor não encontrado, buscando dados do usuário para criar registro');
      
      // Se não encontrar o professor, buscar dados do usuário e criar o registro
      const userRef = ref(db, `${collections.users}/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        console.error('getProfessorByUserId - Usuário não encontrado:', userId);
        throw new Error('Usuário não encontrado');
      }
      
      const userData = userSnapshot.val();
      console.log('getProfessorByUserId - Dados do usuário encontrados:', userData);
      
      const newProfessor = await createProfessor({
        user_id: userId,
        name: userData.name,
        email: userData.email,
        status: 'active' as 'pending' | 'active' | 'inactive' // ou o status inicial apropriado
      });
      
      console.log('getProfessorByUserId - Novo professor criado:', newProfessor);
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
    
    console.log('getProfessorByUserId - Professor encontrado:', professor);
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