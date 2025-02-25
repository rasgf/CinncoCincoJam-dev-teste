import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/config/firebase';

const storage = getStorage(app);

// Função para fazer upload de arquivo para o Firebase Storage
export async function uploadFileToStorage(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file to storage');
  }
}

// Função para determinar o tipo de URL de imagem
function getImageUrlType(url: string | null | undefined): 'firebase' | 'dataurl' | 'relative' | 'external' | 'empty' {
  if (!url) return 'empty';
  if (url.startsWith('data:')) return 'dataurl';
  if (url.startsWith('/')) return 'relative';
  if (url.includes('firebasestorage.googleapis.com')) return 'firebase';
  return 'external';
}

// Função para obter URL segura para imagens (considerando proxy para CORS)
export function getImageUrl(imageUrl: string | null | undefined, width = 300, height = 200, alt = 'No Image'): string {
  const urlType = getImageUrlType(imageUrl);
  
  // Se não houver URL, retorna placeholder
  if (urlType === 'empty') {
    return `/api/placeholder?width=${width}&height=${height}&text=${encodeURIComponent(alt)}`;
  }
  
  // Data URLs e URLs relativas não precisam de proxy
  if (urlType === 'dataurl' || urlType === 'relative') {
    return imageUrl as string;
  }
  
  // URLs do Firebase Storage usam proxy apenas em desenvolvimento
  if (urlType === 'firebase' && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl as string)}`;
  }
  
  // Qualquer outra URL é usada diretamente
  return imageUrl as string;
}

// Função para fazer upload de imagem do curso
export async function uploadCourseThumbnail(file: File): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const path = `course_thumbnails/${fileName}`;
  return uploadFileToStorage(file, path);
}

// Função para fazer upload de avatar do professor
export async function uploadProfessorAvatar(file: File): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const path = `professor_avatars/${fileName}`;
  return uploadFileToStorage(file, path);
} 