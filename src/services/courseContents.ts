import { tables } from './airtable';
import { VideoContent } from '@/types/course';
import { FieldSet } from 'airtable';

// Função auxiliar para obter a data atual no formato YYYY-MM-DD
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Função para validar e formatar os dados de data e hora
const formatReleaseDateTime = (date: string, time: string) => {
  // Se não houver data, considera disponível desde o início do projeto
  if (!date) {
    return {
      release_date: '2024-01-01', // Data base do projeto
      release_time: '00:00'
    };
  }

  return {
    release_date: date,
    release_time: time || '00:00' // Se não houver hora, considera meia-noite
  };
};

export const getCourseContents = async (courseId: string): Promise<VideoContent[]> => {
  try {
    console.log('Buscando conteúdos para o curso:', courseId); // Debug

    const records = await tables.course_contents.select({
      filterByFormula: `{course_id} = '${courseId}'`,
      sort: [{ field: 'order', direction: 'asc' }]
    }).firstPage();

    console.log('Registros encontrados:', records); // Debug

    const contents = records.map(record => ({
      id: record.id,
      title: record.fields.title as string,
      youtubeUrl: record.fields.youtube_url as string,
      releaseDate: record.fields.release_date as string,
      releaseTime: record.fields.release_time as string,
      order: Number(record.fields.order) // Garantir que é número
    }));

    console.log('Conteúdos formatados:', contents); // Debug
    return contents;

  } catch (error: unknown) {
    const airtableError = error as { error?: string };
    if (airtableError.error === 'NOT_AUTHORIZED') {
      console.warn('Sem acesso à tabela de conteúdos:', error);
      return [];
    }
    console.error('Erro detalhado ao buscar conteúdos:', error);
    throw error;
  }
};

interface CourseContentFields extends FieldSet {
  course_id: string;
  title: string;
  youtube_url: string;
  release_date: string;
  release_time: string;
  order: number;
  created_at: string;
  updated_at: string;
}

interface CourseContentRecord {
  id: string;
  fields: CourseContentFields;
}

export const updateCourseContents = async (courseId: string, contents: VideoContent[]) => {
  try {
    // Buscar conteúdos existentes
    const existingContents = await tables.course_contents.select({
      filterByFormula: `{course_id} = '${courseId}'`
    }).firstPage();

    // IDs dos conteúdos existentes
    const existingIds = existingContents.map(record => record.id);
    // IDs dos novos conteúdos (excluindo temporários)
    const newContentIds = contents.map(content => content.id).filter(id => !id.startsWith('temp_'));

    // Conteúdos para deletar
    const toDelete = existingIds.filter(id => !newContentIds.includes(id));

    // Deletar conteúdos removidos
    if (toDelete.length > 0) {
      await tables.course_contents.destroy(toDelete);
    }

    // Atualizar ou criar conteúdos
    const updates = contents.map(content => {
      const { release_date, release_time } = formatReleaseDateTime(
        content.releaseDate,
        content.releaseTime
      );

      const fields = {
        course_id: courseId,
        title: content.title || '',
        youtube_url: content.youtubeUrl || '',
        release_date,
        release_time,
        order: content.order || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return {
        id: content.id.startsWith('temp_') ? undefined : content.id,
        fields
      };
    });

    // Dividir em criação e atualização
    const toCreate = updates.filter(u => !u.id);
    const toUpdate = updates.filter(u => u.id);

    // Executar operações em lotes menores para evitar limites da API
    if (toCreate.length > 0) {
      for (let i = 0; i < toCreate.length; i += 10) {
        const batch = toCreate.slice(i, i + 10);
        await tables.course_contents.create(batch);
      }
    }

    if (toUpdate.length > 0) {
      const batch = toUpdate.map(update => ({
        id: update.id as string,
        fields: {
          course_id: update.fields.course_id,
          title: update.fields.title,
          youtube_url: update.fields.youtube_url,
          release_date: update.fields.release_date,
          release_time: update.fields.release_time,
          order: update.fields.order,
          created_at: update.fields.created_at,
          updated_at: update.fields.updated_at
        } as CourseContentFields
      }));
      await tables.course_contents.update(batch);
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar conteúdos do curso:', error);
    throw error;
  }
}; 