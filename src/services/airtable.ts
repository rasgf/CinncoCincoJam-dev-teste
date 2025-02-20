import Airtable from 'airtable';

const base = new Airtable({
  apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
}).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);

export const tables = {
  users: base('Users'),
  professors: base('Professors'),
  courses: base('Courses'),
  enrollments: base('Enrollments'),
  affiliates: base('Affiliates'),
  settings: base('Settings'),
  lesson_progress: base('Lesson_Progress'),
  course_contents: base('CourseContents')
};

// Verificar se as tabelas estão configuradas corretamente
console.log('Tabelas configuradas:', Object.keys(tables));

export const createUser = async (userData: {
  uid: string;
  email: string;
  name?: string;
  role?: 'professor' | 'aluno' | 'admin';
}) => {
  try {
    const records = await tables.users.create([
      {
        fields: {
          uid: userData.uid,
          email: userData.email,
          name: userData.name || '',
          role: userData.role || 'aluno',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active'
        }
      }
    ]);

    return records[0];
  } catch (error) {
    console.error('Error creating user in Airtable:', error);
    throw error;
  }
};

export const getUserByUid = async (uid: string) => {
  try {
    const records = await tables.users.select({
      filterByFormula: `{uid} = '${uid}'`
    }).firstPage();

    return records[0];
  } catch (error) {
    console.error('Error fetching user from Airtable:', error);
    throw error;
  }
};

export const updateUser = async (recordId: string, userData: {
  name?: string;
  profile_image?: string;
  updated_at: string;
}) => {
  console.log('Iniciando atualização no Airtable...', { recordId, userData });
  try {
    const records = await tables.users.update([
      {
        id: recordId,
        fields: userData
      }
    ]);
    console.log('Resposta do Airtable:', records[0]);
    return records[0];
  } catch (error) {
    console.error('Erro na atualização do Airtable:', error);
    throw error;
  }
};

export const deleteUser = async (recordId: string) => {
  try {
    const deletedRecord = await tables.users.destroy([recordId]);
    return deletedRecord[0];
  } catch (error) {
    console.error('Error deleting user from Airtable:', error);
    throw error;
  }
}; 