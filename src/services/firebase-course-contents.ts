import { getDatabase, ref, set, get, query, orderByChild, child, remove } from 'firebase/database';
import { collections } from './firebase';
import { VideoContent } from '@/types/course';

const db = getDatabase();

export const getCourseContents = async (courseId: string): Promise<VideoContent[]> => {
  try {
    const contentsRef = ref(db, `${collections.course_contents}/${courseId}`);
    const snapshot = await get(contentsRef);
    
    const contents: VideoContent[] = [];
    
    if (snapshot.exists()) {
      // Se tivermos um array de vídeos
      if (Array.isArray(snapshot.val())) {
        snapshot.val().forEach((content: VideoContent, index: number) => {
          if (content) {
            contents.push({
              ...content,
              id: content.id || `video-${index}`,
              order: content.order || index
            });
          }
        });
      } else {
        // Se tivermos um objeto com ids como chaves
        Object.entries(snapshot.val()).forEach(([key, value]: [string, any]) => {
          contents.push({
            ...value,
            id: key,
            order: value.order || 0
          });
        });
      }
      
      // Ordenar por ordem
      contents.sort((a, b) => a.order - b.order);
    }
    
    return contents;
  } catch (error) {
    console.error('Erro ao buscar conteúdos do curso:', error);
    throw error;
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
    // Referência para os conteúdos do curso
    const courseContentsRef = ref(db, `${collections.course_contents}/${courseId}`);
    
    // Garantir que todos os conteúdos tenham um ID válido
    const formattedContents = contents.map((content, index) => {
      // Se for um ID temporário, criar um novo
      const id = content.id.startsWith('temp_') ? `video-${Date.now()}-${index}` : content.id;
      
      return {
        ...content,
        id,
        order: content.order !== undefined ? content.order : index
      };
    });
    
    // Salvar como um objeto com IDs como chaves para facilitar atualizações individuais
    const contentsObject: Record<string, any> = {};
    formattedContents.forEach(content => {
      const { id, ...contentData } = content;
      contentsObject[id] = contentData;
    });
    
    // Atualizar tudo de uma vez
    await set(courseContentsRef, contentsObject);
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar conteúdos do curso:', error);
    throw error;
  }
}; 