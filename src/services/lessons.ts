import { tables } from './airtable';

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration: number;
  order: number;
  course_id: string;
}

export const createLesson = async (lessonData: Omit<Lesson, 'id'>) => {
  try {
    const records = await tables.lessons.create([
      {
        fields: {
          ...lessonData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }
    ]);
    return records[0];
  } catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
  }
};

export const updateLesson = async (lessonId: string, lessonData: Partial<Lesson>) => {
  try {
    const records = await tables.lessons.update([
      {
        id: lessonId,
        fields: {
          ...lessonData,
          updated_at: new Date().toISOString(),
        }
      }
    ]);
    return records[0];
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
};

export const getLessonsByCourse = async (courseId: string) => {
  try {
    const records = await tables.lessons.select({
      filterByFormula: `{course_id} = '${courseId}'`,
      sort: [{ field: 'order', direction: 'asc' }]
    }).firstPage();
    return records;
  } catch (error) {
    console.error('Error fetching lessons:', error);
    throw error;
  }
};

export const updateLessonProgress = async (userId: string, lessonId: string, completed: boolean) => {
  try {
    const records = await tables.lesson_progress.select({
      filterByFormula: `AND({user_id} = '${userId}', {lesson_id} = '${lessonId}')`
    }).firstPage();

    if (records.length > 0) {
      // Atualizar progresso existente
      return tables.lesson_progress.update([{
        id: records[0].id,
        fields: {
          completed,
          updated_at: new Date().toISOString()
        }
      }]);
    } else {
      // Criar novo registro de progresso
      return tables.lesson_progress.create([{
        fields: {
          user_id: userId,
          lesson_id: lessonId,
          completed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }]);
    }
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    throw error;
  }
};

export const getLessonProgress = async (userId: string, courseId: string) => {
  try {
    const records = await tables.lesson_progress.select({
      filterByFormula: `AND({user_id} = '${userId}', {course_id} = '${courseId}')`
    }).firstPage();
    return records;
  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    throw error;
  }
}; 