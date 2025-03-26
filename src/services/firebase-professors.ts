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

export const getProfessorByUserId = async (userId: string, retryCount = 0): Promise<Professor | null> => {
  try {
    console.log(`getProfessorByUserId - Buscando professor com user_id: ${userId} (tentativa ${retryCount + 1})`);
    
    // Primeiro, verificar se o userId é válido
    if (!userId) {
      console.error('getProfessorByUserId - userId inválido:', userId);
      throw new Error('ID de usuário inválido');
    }
    
    const professorsRef = ref(db, collections.professors);
    console.log('getProfessorByUserId - Buscando na coleção:', collections.professors);
    
    const userQuery = query(professorsRef, orderByChild('user_id'), equalTo(userId));
    const snapshot = await get(userQuery);
    
    console.log('getProfessorByUserId - Resultado da busca:', snapshot.exists() ? 'Encontrado' : 'Não encontrado');
    
    if (!snapshot.exists() || snapshot.size === 0) {
      console.log('getProfessorByUserId - Professor não encontrado para userId:', userId);
      
      // Se já tentamos várias vezes, verificar se o usuário existe e tem role de professor
      if (retryCount >= 2) {
        const userRef = ref(db, `${collections.users}/${userId}`);
        const userSnapshot = await get(userRef);
        
        if (!userSnapshot.exists()) {
          console.error('getProfessorByUserId - Usuário não encontrado após múltiplas tentativas:', userId);
          return null;
        }
        
        const userData = userSnapshot.val();
        
        // Só criar automaticamente se o usuário tiver role professor
        if (userData.role !== 'professor') {
          console.log('getProfessorByUserId - Usuário não tem role professor após múltiplas tentativas:', userData.role);
          return null;
        }
        
        console.log('getProfessorByUserId - Criando registro de professor após múltiplas tentativas');
        
        // Criar registro de professor pendente
        return await createProfessor({
          user_id: userId,
          name: userData.name || '',
          email: userData.email || '',
          status: 'pending'
        });
      }
      
      // Se ainda não tentamos muitas vezes, esperar um pouco e tentar novamente
      console.log(`getProfessorByUserId - Tentando novamente em 500ms (tentativa ${retryCount + 1})`);
      
      return new Promise((resolve) => {
        setTimeout(async () => {
          const result = await getProfessorByUserId(userId, retryCount + 1);
          resolve(result);
        }, 500);
      });
    }
    
    // Processar o resultado encontrado
    let professor: Professor | null = null;
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      professor = {
        id: childSnapshot.key as string,
        fields: {
          ...data,
          user_id: data.user_id,
          status: data.status || 'pending',
          role: data.role || 'professor',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        }
      };
    });
    
    console.log('getProfessorByUserId - Professor encontrado:', professor?.fields?.status);
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
    console.log('createProfessor - Iniciando criação com dados:', userData);
    console.log('createProfessor - userID recebido:', userData.user_id);
    
    // Validação dos dados
    if (!userData.user_id) {
      console.error('createProfessor - user_id é obrigatório');
      throw new Error('ID de usuário é obrigatório para criar professor');
    }
    
    // Primeiro verificar se já existe um professor com este user_id
    const professorsRef = ref(db, collections.professors);
    const userQuery = query(professorsRef, orderByChild('user_id'), equalTo(userData.user_id));
    const existingSnapshot = await get(userQuery);
    
    if (existingSnapshot.exists() && existingSnapshot.size > 0) {
      console.log('createProfessor - Professor já existe para este user_id:', userData.user_id);
      
      // Retornar o professor existente
      let existingProfessor: Professor | null = null;
      existingSnapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        existingProfessor = {
          id: childSnapshot.key as string,
          fields: {
            ...data,
            status: data.status || 'pending',
            updated_at: new Date().toISOString() // Atualizar timestamp
          }
        };
      });
      
      console.log('createProfessor - Retornando professor existente:', existingProfessor);
      return existingProfessor;
    }
    
    // Criar novo professor
    const professorData = {
      user_id: userData.user_id,
      name: userData?.name || '',
      email: userData?.email || '',
      bio: userData?.bio || '',
      status: userData?.status || 'pending',
      role: 'professor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('createProfessor - Referência da coleção:', collections.professors);
    console.log('createProfessor - Dados do professor a criar:', professorData);
    
    const newProfessorRef = push(professorsRef);
    await set(newProfessorRef, professorData);
    
    console.log('createProfessor - Professor criado com sucesso com ID:', newProfessorRef.key);
    
    return {
      id: newProfessorRef.key as string,
      fields: professorData
    };
  } catch (error) {
    console.error('Erro ao criar professor:', error);
    throw error;
  }
}; 