import { getDatabase, ref, set, get, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { app } from '@/config/firebase';
import { collections } from './firebase';
import { User } from '@/types/user';

// Inicializar o Realtime Database
const db = getDatabase(app);

// Atualizar o papel do usuário
export const updateUserRole = async (userId: string, newRole: 'admin' | 'professor' | 'aluno') => {
  try {
    const userRef = ref(db, `${collections.users}/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Usuário com ID ${userId} não encontrado.`);
    }
    
    const userData = snapshot.val();
    await update(userRef, {
      role: newRole,
      updated_at: new Date().toISOString()
    });
    
    return { id: userId, fields: { ...userData, role: newRole } };
  } catch (error) {
    console.error('Erro ao atualizar papel do usuário:', error);
    throw error;
  }
};

// Promover usuário para professor
export const promoteToTeacher = async (userId: string) => {
  try {
    // 1. Atualizar papel para professor
    const userRef = ref(db, `${collections.users}/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Usuário com ID ${userId} não encontrado.`);
    }
    
    const userData = snapshot.val();
    await update(userRef, {
      role: 'professor',
      updated_at: new Date().toISOString()
    });
    
    // 2. Criar entrada na coleção de professores
    const professorsRef = ref(db, `${collections.professors}/${userId}`);
    await set(professorsRef, {
      user_id: userId,
      name: userData.name || '',
      email: userData.email || '',
      bio: userData.bio || '',
      specialties: userData.specialties || [],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    return { id: userId, success: true };
  } catch (error) {
    console.error('Erro ao promover usuário para professor:', error);
    throw error;
  }
};

// Revogar papel de professor
export const revokeTeacherRole = async (userId: string) => {
  try {
    // 1. Atualizar papel para aluno
    const userRef = ref(db, `${collections.users}/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Usuário com ID ${userId} não encontrado.`);
    }
    
    await update(userRef, {
      role: 'aluno',
      updated_at: new Date().toISOString()
    });
    
    // 2. Remover entrada da coleção de professores
    const professorRef = ref(db, `${collections.professors}/${userId}`);
    await remove(professorRef);
    
    return { id: userId, success: true };
  } catch (error) {
    console.error('Erro ao revogar papel de professor:', error);
    throw error;
  }
};

// Remover usuário (preservando função original para compatibilidade)
export const removeUser = async (userId: string, firebaseUid: string, email: string) => {
  try {
    // Remover do Realtime Database
    const userRef = ref(db, `${collections.users}/${userId}`);
    await remove(userRef);
    
    // Você pode adicionar aqui código para remover o usuário do Firebase Authentication
    // se tiver as permissões necessárias
    
    return { id: userId, success: true };
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    throw error;
  }
}; 