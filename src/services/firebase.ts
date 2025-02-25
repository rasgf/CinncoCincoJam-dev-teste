import { getDatabase, ref, set, get, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { app } from '@/config/firebase';

// Inicializar o Realtime Database
const db = getDatabase(app);

export const collections = {
  users: 'users',
  professors: 'professors',
  courses: 'courses',
  enrollments: 'enrollments',
  affiliates: 'affiliates',
  settings: 'settings',
  lesson_progress: 'lesson_progress',
  course_contents: 'courseContents'
};

// Criar um usuário no Firebase
export const createUser = async (userData: {
  uid: string;
  email: string;
  name?: string;
  role?: 'professor' | 'aluno' | 'admin';
}) => {
  try {
    const userRef = ref(db, `${collections.users}/${userData.uid}`);
    const userObject = {
      uid: userData.uid,
      email: userData.email,
      name: userData.name || '',
      role: userData.role || 'aluno',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active'
    };
    
    await set(userRef, userObject);
    return { id: userData.uid, fields: userObject };
  } catch (error) {
    console.error('Error creating user in Firebase:', error);
    throw error;
  }
};

// Obter um usuário pelo UID
export const getUserByUid = async (uid: string) => {
  try {
    const userRef = ref(db, `${collections.users}/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return { id: uid, fields: userData };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user from Firebase:', error);
    throw error;
  }
};

// Atualizar um usuário
export const updateUser = async (recordId: string, userData: {
  name?: string;
  profile_image?: string;
  updated_at: string;
  [key: string]: any;
}) => {
  try {
    const userRef = ref(db, `${collections.users}/${recordId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error('User not found');
    }
    
    const currentData = snapshot.val();
    const updatedData = { ...currentData, ...userData };
    
    await update(userRef, updatedData);
    return { id: recordId, fields: updatedData };
  } catch (error) {
    console.error('Error updating user in Firebase:', error);
    throw error;
  }
};

// Deletar um usuário
export const deleteUser = async (recordId: string) => {
  try {
    const userRef = ref(db, `${collections.users}/${recordId}`);
    await remove(userRef);
    return { id: recordId, deleted: true };
  } catch (error) {
    console.error('Error deleting user from Firebase:', error);
    throw error;
  }
};

// Obter todos os usuários com um determinado papel
export const getUsersByRole = async (role: string) => {
  try {
    const usersRef = ref(db, collections.users);
    const roleQuery = query(usersRef, orderByChild('role'), equalTo(role));
    const snapshot = await get(roleQuery);
    
    const users: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        users.push({
          id: childSnapshot.key,
          fields: childSnapshot.val()
        });
      });
    }
    
    return users;
  } catch (error) {
    console.error('Error fetching users by role from Firebase:', error);
    throw error;
  }
};

// Obter todos os usuários
export const getAllUsers = async () => {
  try {
    const usersRef = ref(db, collections.users);
    const snapshot = await get(usersRef);
    
    const users: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        users.push({
          id: childSnapshot.key,
          fields: childSnapshot.val()
        });
      });
    }
    
    return users;
  } catch (error) {
    console.error('Error fetching all users from Firebase:', error);
    throw error;
  }
}; 