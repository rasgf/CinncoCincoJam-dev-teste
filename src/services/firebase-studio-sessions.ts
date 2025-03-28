import { getDatabase, ref, set, get, update, remove, query, orderByChild, equalTo, push } from 'firebase/database';
import { app } from '@/config/firebase';
import { collections } from './firebase';
import { getUsersByRole, getAllUsers } from './firebase';

// Inicializar o Realtime Database
const db = getDatabase(app);

export interface StudioSession {
  id: string;
  studioId: string;
  studioName: string;
  date: string; // ISO string
  time: string;
  professorId: string;
  professorName: string;
  students: {
    [studentId: string]: {
      id: string;
      name: string;
      instrument?: string;
      email?: string;
      status: 'pending' | 'confirmed' | 'declined';
    }
  };
  status?: 'active' | 'canceled' | 'completed';
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  name: string;
  instrument?: string;
  email?: string;
}

// Buscar todos os alunos
export const getStudents = async (): Promise<Student[]> => {
  try {
    // Buscar usuários com papel de 'aluno'
    const students = await getUsersByRole('aluno');
    
    return students.map(student => ({
      id: student.id,
      name: student.fields.name || 'Aluno sem nome',
      email: student.fields.email || '',
      instrument: student.fields.instrument || student.fields.specialties?.[0] || '',
    }));
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    return [];
  }
};

// Criar uma nova sessão de estúdio
export const createStudioSession = async (sessionData: Omit<StudioSession, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
  try {
    const sessionsRef = ref(db, collections.studio_sessions);
    const newSessionRef = push(sessionsRef);
    
    const now = new Date().toISOString();
    
    // Adicionar timestamps e definir status como ativo por padrão
    await set(newSessionRef, {
      ...sessionData,
      status: 'active',
      createdAt: now,
      updatedAt: now
    });
    
    return {
      success: true,
      sessionId: newSessionRef.key
    };
  } catch (error) {
    console.error('Erro ao criar sessão de estúdio:', error);
    throw error;
  }
};

// Buscar sessões de estúdio de um professor
export const getProfessorStudioSessions = async (professorId: string) => {
  try {
    // Em vez de usar query com orderByChild e equalTo, vamos buscar todas as sessões
    // e filtrar no código
    const sessionsRef = ref(db, collections.studio_sessions);
    const snapshot = await get(sessionsRef);
    
    const sessions: StudioSession[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const session = childSnapshot.val();
        // Filtrar apenas as sessões do professor especificado
        if (session.professorId === professorId) {
          sessions.push({
            ...session,
            id: childSnapshot.key
          });
        }
      });
    }
    
    return sessions;
  } catch (error) {
    console.error('Erro ao buscar sessões de estúdio do professor:', error);
    return [];
  }
};

// Atualizar status de um aluno em uma sessão
export const updateStudentSessionStatus = async (
  sessionId: string, 
  studentId: string, 
  status: 'confirmed' | 'declined'
) => {
  try {
    const sessionRef = ref(db, `${collections.studio_sessions}/${sessionId}/students/${studentId}`);
    await update(sessionRef, { status });
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar status do aluno na sessão:', error);
    throw error;
  }
};

// Remover um aluno de uma sessão
export const removeStudentFromSession = async (
  sessionId: string,
  studentId: string
) => {
  try {
    const studentSessionRef = ref(db, `${collections.studio_sessions}/${sessionId}/students/${studentId}`);
    await remove(studentSessionRef);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao remover aluno da sessão:', error);
    throw error;
  }
};

// Buscar sessões de estúdio que um aluno foi convidado
export const getStudentStudioSessions = async (studentId: string): Promise<StudioSession[]> => {
  try {
    // Buscar todas as sessões
    const sessionsRef = ref(db, collections.studio_sessions);
    const snapshot = await get(sessionsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const sessions: StudioSession[] = [];
    
    // Filtrar apenas as sessões que contêm o aluno
    snapshot.forEach((childSnapshot) => {
      const session = childSnapshot.val();
      // Verificar se o aluno está na lista de estudantes da sessão
      if (session.students && session.students[studentId]) {
        // Garantir que o campo createdAt exista
        if (!session.createdAt) {
          session.createdAt = session.date || new Date().toISOString();
          
          // Atualizar no banco de dados para sessões sem createdAt
          const sessionRef = ref(db, `${collections.studio_sessions}/${childSnapshot.key}`);
          update(sessionRef, { createdAt: session.createdAt }).catch(err => {
            console.error(`Erro ao atualizar createdAt para sessão ${childSnapshot.key}:`, err);
          });
        }
        
        sessions.push({
          ...session,
          id: childSnapshot.key
        });
      }
    });
    
    console.log("Sessões recuperadas:", sessions.length, "- Exemplo:", sessions[0]?.createdAt);
    return sessions;
  } catch (error) {
    console.error('Erro ao buscar sessões do aluno:', error);
    throw error;
  }
};

// Buscar uma sessão específica pelo ID
export const getStudioSession = async (sessionId: string): Promise<StudioSession | null> => {
  try {
    const sessionRef = ref(db, `${collections.studio_sessions}/${sessionId}`);
    const snapshot = await get(sessionRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      ...snapshot.val(),
      id: snapshot.key
    };
  } catch (error) {
    console.error('Erro ao buscar sessão de estúdio:', error);
    throw error;
  }
};

/**
 * Limpa todas as sessões de estúdio do banco de dados.
 * Esta função só deve ser usada por administradores para fins de teste/limpeza.
 */
export const clearAllStudioSessions = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const studioSessionsRef = ref(db, collections.studio_sessions);
    
    // Remove todo o nó de sessões de estúdio
    await set(studioSessionsRef, null);
    
    return {
      success: true,
      message: 'Todas as sessões de estúdio foram removidas com sucesso.'
    };
  } catch (error) {
    console.error('Erro ao limpar sessões de estúdio:', error);
    throw new Error('Falha ao limpar sessões de estúdio. Tente novamente mais tarde.');
  }
};

// Cancelar uma sessão de estúdio
export const cancelStudioSession = async (sessionId: string, cancelReason: string = '') => {
  try {
    const sessionRef = ref(db, `${collections.studio_sessions}/${sessionId}`);
    const snapshot = await get(sessionRef);
    
    if (!snapshot.exists()) {
      throw new Error('Sessão não encontrada');
    }
    
    // Atualizar o status da sessão para cancelada
    await update(sessionRef, { 
      status: 'canceled',
      cancelReason,
      updatedAt: new Date().toISOString() 
    });
    
    return { success: true, message: 'Sessão cancelada com sucesso.' };
  } catch (error) {
    console.error('Erro ao cancelar sessão de estúdio:', error);
    throw error;
  }
};

/**
 * Atualiza sessões antigas sem o campo createdAt
 * Esta função é usada apenas para fins de manutenção
 */
export const updateOldSessionsWithCreatedAt = async (forceUpdate = false) => {
  try {
    // Buscar todas as sessões
    const sessionsRef = ref(db, collections.studio_sessions);
    const snapshot = await get(sessionsRef);
    
    if (!snapshot.exists()) {
      return { success: true, message: 'Não há sessões para atualizar.' };
    }
    
    const updates: { [path: string]: any } = {};
    let updatedCount = 0;
    
    // Verificar cada sessão e adicionar campo createdAt se estiver faltando
    snapshot.forEach((childSnapshot) => {
      const session = childSnapshot.val();
      const sessionKey = childSnapshot.key;
      
      // Atualizar caso não tenha createdAt ou se forceUpdate for true
      if (!session.createdAt || forceUpdate) {
        // Usar a data da sessão como valor padrão para createdAt
        updates[`${collections.studio_sessions}/${sessionKey}/createdAt`] = session.date || new Date().toISOString();
        updatedCount++;
      }
    });
    
    // Se tiver atualizações para fazer
    if (updatedCount > 0) {
      const dbRef = ref(db);
      await update(dbRef, updates);
      return { 
        success: true, 
        message: `${updatedCount} sessões atualizadas com sucesso.` 
      };
    }
    
    return { 
      success: true, 
      message: 'Todas as sessões já têm o campo createdAt.' 
    };
  } catch (error) {
    console.error('Erro ao atualizar sessões antigas:', error);
    throw error;
  }
}; 