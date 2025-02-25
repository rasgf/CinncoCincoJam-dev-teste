import { getDatabase, ref, update, remove, query, orderByChild, equalTo, get } from 'firebase/database';
import { collections } from './firebase';

const db = getDatabase();

// Interface para professores pendentes
interface PendingProfessor {
  id: string;
  fields: {
    user_id: string;
    name: string;
    email: string;
    bio: string;
    specialties: string[];
    created_at: string;
  };
}

// Obter professores com status pendente
export const getPendingProfessors = async (): Promise<PendingProfessor[]> => {
  try {
    const professorsRef = ref(db, collections.professors);
    const pendingQuery = query(professorsRef, orderByChild('status'), equalTo('pending'));
    const snapshot = await get(pendingQuery);
    
    const pendingProfessors: PendingProfessor[] = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const professor: PendingProfessor = {
          id: childSnapshot.key as string,
          fields: {
            user_id: data.user_id,
            name: data.name || '',
            email: data.email || '',
            bio: data.bio || '',
            specialties: data.specialties || [],
            created_at: data.created_at || new Date().toISOString()
          }
        };
        pendingProfessors.push(professor);
      });
    }
    
    return pendingProfessors;
  } catch (error) {
    console.error('Erro ao buscar professores pendentes:', error);
    throw error;
  }
};

// Aprovar um professor pendente
export const approveProfessor = async (professorId: string): Promise<{ success: boolean }> => {
  try {
    const professorRef = ref(db, `${collections.professors}/${professorId}`);
    const snapshot = await get(professorRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Professor com ID ${professorId} não encontrado.`);
    }
    
    const professorData = snapshot.val();
    
    // Atualizar status do professor para aprovado
    await update(professorRef, {
      status: 'active',
      updated_at: new Date().toISOString()
    });
    
    // Também atualizar o papel do usuário relacionado, se necessário
    if (professorData.user_id) {
      const userRef = ref(db, `${collections.users}/${professorData.user_id}`);
      await update(userRef, {
        role: 'professor',
        updated_at: new Date().toISOString()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao aprovar professor:', error);
    throw error;
  }
};

// Rejeitar um professor pendente
export const rejectProfessor = async (professorId: string): Promise<{ success: boolean }> => {
  try {
    const professorRef = ref(db, `${collections.professors}/${professorId}`);
    const snapshot = await get(professorRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Professor com ID ${professorId} não encontrado.`);
    }
    
    const professorData = snapshot.val();
    
    // Remover entrada da coleção de professores
    await remove(professorRef);
    
    // Se houver um usuário associado, garantir que seu papel não é 'professor'
    if (professorData.user_id) {
      const userRef = ref(db, `${collections.users}/${professorData.user_id}`);
      await update(userRef, {
        role: 'aluno',
        updated_at: new Date().toISOString()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao rejeitar professor:', error);
    throw error;
  }
}; 