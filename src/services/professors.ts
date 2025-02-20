import { tables } from './airtable';
import { Professor } from '@/types/course';

export const getProfessors = async () => {
  try {
    // Buscar todos os professores aprovados
    const professors = await tables.professors.select({
      filterByFormula: `{status} = 'approved'`
    }).firstPage();

    // Buscar informações dos usuários correspondentes
    const userIds = professors.map(prof => prof.fields.user_id);
    const users = await tables.users.select({
      filterByFormula: `OR(${userIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`
    }).firstPage();

    // Combinar dados de professor com dados de usuário
    return professors.map(professor => {
      const user = users.find(u => u.id === professor.fields.user_id);
      return {
        ...professor,
        fields: {
          ...professor.fields,
          name: user?.fields.name || '',
          profile_image: user?.fields.profile_image,
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
    const professor = await tables.professors.find(id);
    const user = await tables.users.find(professor.fields.user_id);

    return {
      ...professor,
      fields: {
        ...professor.fields,
        name: user.fields.name,
        profile_image: user.fields.profile_image,
      }
    };
  } catch (error) {
    console.error('Erro ao buscar professor:', error);
    throw new Error('Falha ao carregar dados do professor');
  }
};

export const getProfessorByUserId = async (userId: string): Promise<Professor | null> => {
  try {
    const records = await tables.professors.select({
      filterByFormula: `{user_id} = '${userId}'`
    }).firstPage();

    if (records.length === 0) {
      // Se não encontrar o professor, buscar dados do usuário e criar o registro
      const userRecord = await tables.users.find(userId);
      
      const newProfessor = await createProfessor({
        user_id: userId,
        name: userRecord.fields.name,
        email: userRecord.fields.email,
        status: 'active' // ou o status inicial apropriado
      });

      return newProfessor;
    }

    return records[0];
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
  status?: string;
}) => {
  try {
    const records = await tables.professors.create([
      {
        fields: {
          user_id: userData.user_id,
          name: userData.name,
          email: userData.email,
          bio: userData.bio || '',
          status: userData.status || 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    ]);

    return records[0];
  } catch (error) {
    console.error('Erro ao criar professor:', error);
    throw error;
  }
}; 