import { getDatabase, ref, update } from 'firebase/database';
import { collections } from './firebase';

const db = getDatabase();

export const updateProfile = async (userId: string, data: {
  name: string;
  bio?: string;
  profile_image?: string;
  updated_at: string;
}) => {
  try {
    const userRef = ref(db, `${collections.users}/${userId}`);
    
    const updateData = {
      name: data.name,
      ...(data.bio && { bio: data.bio }),
      ...(data.profile_image && { profile_image: data.profile_image }),
      updated_at: new Date().toISOString()
    };
    
    await update(userRef, updateData);
    
    return {
      id: userId,
      fields: updateData
    };
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
}; 