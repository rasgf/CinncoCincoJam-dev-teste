import { getDatabase, ref, set, get, query, orderByChild, child, remove } from 'firebase/database';
import { collections } from './firebase';
import { VideoContent } from '@/types/course';

const db = getDatabase();

export const getCourseContents = async (courseId: string): Promise<VideoContent[]> => {
  try {
    console.log('getCourseContents - Iniciando busca de conteúdos para o curso:', courseId);
    
    const courseContentsRef = ref(db, `${collections.course_contents}/${courseId}`);
    const snapshot = await get(courseContentsRef);
    
    if (!snapshot.exists()) {
      console.log('getCourseContents - Nenhum conteúdo encontrado para o curso:', courseId);
      return [];
    }
    
    const contentsData = snapshot.val();
    console.log('getCourseContents - Dados brutos de conteúdos:', JSON.stringify(contentsData, null, 2));
    
    // Converter o objeto em um array
    const contentsArray: VideoContent[] = Object.entries(contentsData).map(([id, data]: [string, any]) => ({
      id,
      ...data
    }));
    
    // Ordenar por ordem
    contentsArray.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    console.log('getCourseContents - Conteúdos formatados:', JSON.stringify(contentsArray, null, 2));
    
    return contentsArray;
  } catch (error) {
    console.error('Erro ao buscar conteúdos do curso:', error);
    return [];
  }
};

export const addCourseContent = async (courseId: string, content: Omit<VideoContent, 'id'>): Promise<VideoContent> => {
  try {
    const courseContentsRef = ref(db, `${collections.course_contents}/${courseId}`);
    const snapshot = await get(courseContentsRef);
    
    let contents: any[] = [];
    if (snapshot.exists()) {
      contents = snapshot.val();
      if (!Array.isArray(contents)) {
        contents = Object.values(contents);
      }
    }
    
    // Determinar a próxima ordem
    const nextOrder = contents.length > 0 
      ? Math.max(...contents.map(c => c.order || 0)) + 1 
      : 0;
    
    const contentId = `video-${Date.now()}`;
    const newContent: VideoContent = {
      ...content,
      id: contentId,
      order: content.order || nextOrder
    };
    
    // Adicionar ao array ou objeto
    if (Array.isArray(contents)) {
      contents.push(newContent);
      await set(courseContentsRef, contents);
    } else {
      const contentRef = ref(db, `${collections.course_contents}/${courseId}/${contentId}`);
      await set(contentRef, newContent);
    }
    
    return newContent;
  } catch (error) {
    console.error('Erro ao adicionar conteúdo ao curso:', error);
    throw error;
  }
};

export const updateCourseContents = async (courseId: string, contents: VideoContent[]) => {
  try {
    console.log('Iniciando updateCourseContents para o curso:', courseId);
    console.log('Conteúdos recebidos:', JSON.stringify(contents, null, 2));
    
    // Referência para os conteúdos do curso
    const courseContentsRef = ref(db, `${collections.course_contents}/${courseId}`);
    
    // Se não houver conteúdos, remover todos os conteúdos existentes
    if (contents.length === 0) {
      console.log('Nenhum conteúdo recebido. Removendo todos os conteúdos existentes para o curso:', courseId);
      await remove(courseContentsRef);
      console.log('Todos os conteúdos removidos com sucesso para o curso:', courseId);
      return true;
    }
    
    // Garantir que todos os conteúdos tenham um ID válido
    const formattedContents = contents.map((content, index) => {
      // Se for um ID temporário, criar um novo
      const id = content.id.startsWith('temp_') ? `video-${Date.now()}-${index}` : content.id;
      
      // Garante que os campos releaseDate e releaseTime estejam definidos, mesmo que vazios
      const releaseDate = content.releaseDate || '';
      const releaseTime = content.releaseTime || '';
      
      console.log(`Processando vídeo ${content.title}:`, {
        id,
        releaseDate,
        releaseTime,
        hasReleaseDate: !!releaseDate,
        hasReleaseTime: !!releaseTime
      });
      
      return {
        ...content,
        id,
        order: content.order !== undefined ? content.order : index,
        releaseDate,
        releaseTime
      };
    });
    
    console.log('Conteúdos formatados:', JSON.stringify(formattedContents, null, 2));
    
    // Salvar como um objeto com IDs como chaves para facilitar atualizações individuais
    const contentsObject: Record<string, any> = {};
    formattedContents.forEach(content => {
      const { id, ...contentData } = content;
      
      // Garante que todos os campos necessários estejam sempre incluídos
      contentData.title = contentData.title || '';
      contentData.youtubeUrl = contentData.youtubeUrl || '';
      contentData.releaseDate = contentData.releaseDate || '';
      contentData.releaseTime = contentData.releaseTime || '';
      contentData.order = contentData.order || 0;
      
      contentsObject[id] = contentData;
    });
    
    console.log('Objeto de conteúdos a ser salvo:', JSON.stringify(contentsObject, null, 2));
    
    // Atualizar tudo de uma vez
    await set(courseContentsRef, contentsObject);
    console.log('Conteúdos atualizados com sucesso para o curso:', courseId);
    
    // Verificar se os dados foram salvos corretamente
    const snapshot = await get(courseContentsRef);
    const savedData = snapshot.val();
    console.log('Dados salvos no Firebase:', JSON.stringify(savedData, null, 2));
    
    // Verificar se os dados de release estão presentes nos dados salvos
    Object.entries(savedData).forEach(([id, data]: [string, any]) => {
      console.log(`Verificando vídeo ${data.title}:`, {
        releaseDate: data.releaseDate,
        releaseTime: data.releaseTime,
        hasReleaseDate: !!data.releaseDate,
        hasReleaseTime: !!data.releaseTime
      });
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar conteúdos do curso:', error);
    throw error;
  }
}; 