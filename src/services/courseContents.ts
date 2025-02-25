// Este arquivo agora serve como um wrapper para o Firebase
// Mantemos a mesma API, mas internamente chamamos o Firebase
import { 
  getCourseContents as getFirebaseCourseContents,
  updateCourseContents as updateFirebaseCourseContents
} from './firebase-course-contents';
import { VideoContent } from '@/types/course';

export const getCourseContents = async (courseId: string): Promise<VideoContent[]> => {
  console.log('Redirecionando para Firebase getCourseContents');
  return getFirebaseCourseContents(courseId);
};

export const updateCourseContents = async (courseId: string, contents: VideoContent[]) => {
  console.log('Redirecionando para Firebase updateCourseContents');
  return updateFirebaseCourseContents(courseId, contents);
}; 