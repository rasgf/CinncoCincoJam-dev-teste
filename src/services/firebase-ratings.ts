import { getDatabase, ref, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { app } from '@/config/firebase';

const db = getDatabase(app);

// Estrutura das avaliações
export interface VideoRating {
  id?: string;
  user_id: string;
  course_id: string;
  video_id: string;
  rating: number; // 0-5 com incrementos de 0.5
  comment?: string;
  created_at: string;
  updated_at?: string;
}

// Adicionar uma avaliação para um vídeo (ou atualizar uma existente)
export const addVideoRating = async (ratingData: Omit<VideoRating, 'id' | 'created_at'>) => {
  try {
    // Criar um ID único baseado no user_id e video_id para garantir que cada usuário só tenha uma avaliação por vídeo
    const ratingId = `${ratingData.user_id}_${ratingData.video_id}`;
    const ratingRef = ref(db, `video_ratings/${ratingId}`);
    
    // Verificar se já existe uma avaliação para atualizar
    const existingSnapshot = await get(ratingRef);
    let ratingObject;
    
    if (existingSnapshot.exists()) {
      // Atualizar a avaliação existente, mantendo a data de criação original
      const existingRating = existingSnapshot.val();
      ratingObject = {
        ...ratingData,
        created_at: existingRating.created_at,
        updated_at: new Date().toISOString() // Adicionar data de atualização
      };
      console.log('Atualizando avaliação existente:', ratingObject);
    } else {
      // Criar uma nova avaliação
      ratingObject = {
        ...ratingData,
        created_at: new Date().toISOString()
      };
      console.log('Criando nova avaliação:', ratingObject);
    }
    
    await set(ratingRef, ratingObject);
    return { id: ratingId, ...ratingObject };
  } catch (error) {
    console.error('Erro ao adicionar/atualizar avaliação:', error);
    throw error;
  }
};

// Verificar se um usuário já avaliou um vídeo
export const getUserVideoRating = async (userId: string, videoId: string) => {
  try {
    const ratingId = `${userId}_${videoId}`;
    const ratingRef = ref(db, `video_ratings/${ratingId}`);
    const snapshot = await get(ratingRef);
    
    if (snapshot.exists()) {
      return { id: ratingId, ...snapshot.val() };
    }
    return null;
  } catch (error) {
    console.error('Erro ao verificar avaliação do usuário:', error);
    throw error;
  }
};

// Obter todas as avaliações para um vídeo
export const getVideoRatings = async (videoId: string) => {
  try {
    const ratingsRef = ref(db, 'video_ratings');
    const videoRatingsQuery = query(ratingsRef, orderByChild('video_id'), equalTo(videoId));
    const snapshot = await get(videoRatingsQuery);
    
    const ratings: VideoRating[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        ratings.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }
    
    return ratings;
  } catch (error) {
    console.error('Erro ao obter avaliações do vídeo:', error);
    throw error;
  }
};

// Obter a média das avaliações para um vídeo
export const getVideoAverageRating = async (videoId: string) => {
  try {
    const ratings = await getVideoRatings(videoId);
    
    if (ratings.length === 0) {
      return 0;
    }
    
    const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
    return sum / ratings.length;
  } catch (error) {
    console.error('Erro ao calcular média de avaliações:', error);
    throw error;
  }
};

// Obter a média das avaliações para um curso (média de todos os vídeos)
export const getCourseAverageRating = async (courseId: string) => {
  try {
    // Método alternativo que não requer índice
    const ratingsRef = ref(db, 'video_ratings');
    const snapshot = await get(ratingsRef);
    
    const ratings: VideoRating[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const rating = childSnapshot.val();
        // Filtrar manualmente por course_id
        if (rating.course_id === courseId) {
          ratings.push({
            id: childSnapshot.key as string,
            ...rating
          });
        }
      });
    }
    
    if (ratings.length === 0) {
      return {
        average: 0,
        count: 0
      };
    }
    
    const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
    return {
      average: sum / ratings.length,
      count: ratings.length
    };
  } catch (error) {
    console.error('Erro ao calcular média de avaliações do curso:', error);
    throw error;
  }
};

// Obter todos os comentários de avaliações para um curso, com nome dos usuários
export const getCourseRatingComments = async (courseId: string) => {
  try {
    // Buscar todas as avaliações para este curso
    const ratingsRef = ref(db, 'video_ratings');
    const snapshot = await get(ratingsRef);
    
    const ratings: Array<VideoRating & { username?: string; videoTitle?: string }> = [];
    
    if (snapshot.exists()) {
      // Primeiro, coletar todas as avaliações do curso que têm comentários
      const commentPromises: Promise<any>[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const rating = childSnapshot.val();
        
        // Verificar se é do curso desejado e tem comentário
        if (rating.course_id === courseId && rating.comment && rating.comment.trim() !== '') {
          // Adicionar à lista temporária para processamento
          const ratingWithID = {
            id: childSnapshot.key,
            ...rating
          };
          
          // Buscar nome do usuário
          const userPromise = getUserName(rating.user_id).then(username => {
            ratingWithID.username = username;
            return ratingWithID;
          });
          
          // Buscar título do vídeo
          const videoPromise = getVideoTitle(rating.video_id).then(videoTitle => {
            ratingWithID.videoTitle = videoTitle;
            return ratingWithID;
          });
          
          // Processar ambas as promessas
          const combinedPromise = Promise.all([userPromise, videoPromise]).then(() => {
            return ratingWithID;
          });
          
          commentPromises.push(combinedPromise);
        }
      });
      
      // Aguardar todas as buscas de detalhes e adicionar à lista final
      const processedRatings = await Promise.all(commentPromises);
      ratings.push(...processedRatings);
    }
    
    // Ordenar por data (mais recentes primeiro)
    ratings.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
    
    return ratings;
  } catch (error) {
    console.error('Erro ao buscar comentários das avaliações:', error);
    throw error;
  }
};

// Função auxiliar para buscar o nome do usuário
const getUserName = async (userId: string): Promise<string> => {
  try {
    // Buscar usuário no Firebase
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return userData.name || 'Usuário';
    }
    
    return 'Usuário';
  } catch (error) {
    console.error('Erro ao buscar nome do usuário:', error);
    return 'Usuário';
  }
};

// Função auxiliar para buscar o título do vídeo
const getVideoTitle = async (videoId: string): Promise<string> => {
  try {
    // Buscar conteúdo do curso no Firebase
    const courseContentRef = ref(db, `courseContents/${videoId}`);
    const snapshot = await get(courseContentRef);
    
    if (snapshot.exists()) {
      const videoData = snapshot.val();
      return videoData.title || 'Vídeo';
    }
    
    return 'Vídeo';
  } catch (error) {
    console.error('Erro ao buscar título do vídeo:', error);
    return 'Vídeo';
  }
}; 