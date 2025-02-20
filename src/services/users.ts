import { tables } from './airtable';

export const updateProfile = async (userId: string, data: {
  name: string;
  bio?: string;
  specialties?: string[];
  social_media?: string;
}) => {
  try {
    const record = await tables.users.update([
      {
        id: userId,
        fields: {
          name: data.name,
          bio: data.bio,
          specialties: data.specialties,
          social_media: data.social_media,
          updated_at: new Date().toISOString()
        }
      }
    ]);

    return record[0];
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
}; 