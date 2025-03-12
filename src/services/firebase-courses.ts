import { getDatabase, ref, set, get, update, remove, query, orderByChild, equalTo, push } from 'firebase/database';
import { storage } from '@/config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Course, CreateCourseData, ProfessorStats, VideoContent, PaymentType, RecurrenceInterval } from '@/types/course';
import { collections } from './firebase';

const db = getDatabase();

export const getUserCourses = async (userId: string): Promise<Course[]> => {
  try {
    console.log('getUserCourses - Buscando cursos para o usuário:', userId);
    
    // Buscar todos os cursos e filtrar no cliente para evitar necessidade de índice
    const coursesRef = ref(db, collections.courses);
    const snapshot = await get(coursesRef);
    
    const courses: Course[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const courseData = childSnapshot.val();
        
        // Filtrar cursos pelo professor_id
        if (courseData.professor_id === userId) {
          console.log('getUserCourses - Dados do curso encontrado:', JSON.stringify(courseData, null, 2));
          
          courses.push({
            id: childSnapshot.key as string,
            fields: {
              title: courseData.title,
              description: courseData.description,
              thumbnail: courseData.thumbnail,
              price: courseData.price,
              category: courseData.category || '',
              level: courseData.level,
              status: courseData.status,
              what_will_learn: courseData.what_will_learn,
              requirements: courseData.requirements,
              professor_id: courseData.professor_id,
              created_at: courseData.created_at,
              updated_at: courseData.updated_at,
              // Incluir campos de pagamento
              paymentType: courseData.paymentType,
              recurrenceInterval: courseData.recurrenceInterval,
              installments: courseData.installments,
              installmentCount: courseData.installmentCount
            }
          });
        }
      });
    }
    
    console.log('getUserCourses - Total de cursos encontrados:', courses.length);
    return courses;
  } catch (error: unknown) {
    console.error('Erro ao buscar cursos do usuário:', error);
    throw error;
  }
};

export const getProfessorStats = async (professorId: string): Promise<ProfessorStats> => {
  try {
    console.log('Buscando estatísticas para professor:', professorId);
    
    // Buscar todos os cursos e filtrar no cliente
    const coursesRef = ref(db, collections.courses);
    const snapshot = await get(coursesRef);
    
    const courses: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const courseData = childSnapshot.val();
        
        // Filtrar cursos pelo professor_id
        if (courseData.professor_id === professorId) {
          courses.push({
            id: childSnapshot.key,
            fields: courseData
          });
        }
      });
    }

    if (courses.length === 0) {
      return {
        totalStudents: 0,
        activeCourses: 0,
        monthlyRevenue: 0,
        studentsTrend: { value: 0, isPositive: true },
        revenueTrend: { value: 0, isPositive: true }
      };
    }

    // Buscar cursos publicados
    const publishedCourses = courses.filter(course => 
      course.fields.status === 'published'
    );

    // Buscar matrículas ativas apenas se houver cursos publicados
    let activeEnrollments: any[] = [];
    if (publishedCourses.length > 0) {
      const enrollmentsRef = ref(db, collections.enrollments);
      const enrollmentsSnapshot = await get(enrollmentsRef);
      
      if (enrollmentsSnapshot.exists()) {
        enrollmentsSnapshot.forEach((childSnapshot) => {
          const enrollment = childSnapshot.val();
          const courseId = enrollment.course_id;
          
          // Verificar se a matrícula é para um dos cursos do professor e está ativa
          if (publishedCourses.some(course => course.id === courseId) && enrollment.status === 'active') {
            activeEnrollments.push({
              id: childSnapshot.key,
              fields: enrollment
            });
          }
        });
      }
    }

    // Calcular receita mensal
    const monthlyRevenue = activeEnrollments.reduce((total, enrollment) => {
      const course = publishedCourses.find(c => c.id === enrollment.fields.course_id);
      return total + (course?.fields.price || 0);
    }, 0);

    return {
      totalStudents: activeEnrollments.length,
      activeCourses: publishedCourses.length,
      monthlyRevenue,
      studentsTrend: { value: 0, isPositive: true },
      revenueTrend: { value: 0, isPositive: true }
    };

  } catch (error: unknown) {
    console.error('Error fetching professor stats:', error);
    throw error;
  }
};

interface CreateCourseFields {
  title: string;
  description: string;
  price: number;
  level: string;
  status: string;
  category?: string;
  thumbnail: File | null;
  what_will_learn: string | string[];
  requirements: string | string[];
  professor_id: string;
  contents?: VideoContent[];
  paymentType: PaymentType;
  recurrenceInterval?: RecurrenceInterval;
  installments?: boolean;
  installmentCount?: number;
}

export const createCourse = async (data: CreateCourseFields): Promise<Course> => {
  try {
    console.log('createCourse - Iniciando criação de curso com dados:', JSON.stringify({
      ...data,
      thumbnail: data.thumbnail ? 'File object' : null,
      contents: data.contents ? `${data.contents.length} conteúdos` : 'nenhum conteúdo'
    }, null, 2));
    
    let thumbnailUrl = '';
    
    if (data.thumbnail) {
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${data.thumbnail.name}`;
      const storagePath = storageRef(storage, `course_thumbnails/${fileName}`);
      
      await uploadBytes(storagePath, data.thumbnail);
      thumbnailUrl = await getDownloadURL(storagePath);
    }

    const whatWillLearn = Array.isArray(data.what_will_learn) 
      ? data.what_will_learn.join(',')
      : data.what_will_learn;

    const requirements = Array.isArray(data.requirements)
      ? data.requirements.join(',')
      : data.requirements;

    const formattedDate = new Date().toISOString().split('T')[0];

    // Campos base do curso
    const courseFields: {
      title: string;
      description: string;
      price: number;
      level: string;
      status: string;
      category: string;
      thumbnail: string;
      what_will_learn: string;
      requirements: string;
      professor_id: string;
      created_at: string;
      updated_at: string;
      paymentType: PaymentType;
      recurrenceInterval?: RecurrenceInterval;
      installments?: boolean;
      installmentCount?: number;
      [key: string]: any; // Adicionar assinatura de índice para permitir acesso dinâmico
    } = {
      title: data.title,
      description: data.description,
      price: Number(data.price),
      level: data.level,
      status: data.status,
      category: data.category || '',
      thumbnail: thumbnailUrl,
      what_will_learn: whatWillLearn,
      requirements: requirements,
      professor_id: data.professor_id,
      created_at: formattedDate,
      updated_at: formattedDate,
      // Sempre incluir o tipo de pagamento
      paymentType: data.paymentType,
    };

    // Adicionar campos específicos com base no tipo de pagamento
    if (data.paymentType === 'recurring') {
      if (data.recurrenceInterval) {
        courseFields.recurrenceInterval = data.recurrenceInterval;
      }
    } else if (data.paymentType === 'one_time') {
      courseFields.installments = data.installments || false;
      if (data.installments && data.installmentCount) {
        courseFields.installmentCount = data.installmentCount;
      }
    }

    // Remover quaisquer campos undefined que possam ter sido adicionados
    Object.keys(courseFields).forEach(key => {
      if (courseFields[key] === undefined) {
        delete courseFields[key];
      }
    });

    console.log('createCourse - Campos do curso a serem salvos:', JSON.stringify(courseFields, null, 2));

    // Criar um novo ID único para o curso
    const coursesRef = ref(db, collections.courses);
    const newCourseRef = push(coursesRef);
    const courseId = newCourseRef.key;

    if (!courseId) {
      throw new Error('Falha ao gerar ID para o curso');
    }

    // Salvar o curso
    await set(newCourseRef, courseFields);
    console.log('createCourse - Curso salvo com sucesso, ID:', courseId);

    // Se houver conteúdos, salvá-los
    if (data.contents && data.contents.length > 0) {
      console.log('createCourse - Salvando conteúdos do curso:', JSON.stringify(data.contents, null, 2));
      
      const courseContentsRef = ref(db, `${collections.course_contents}/${courseId}`);
      
      // Garantir que todos os conteúdos tenham um ID válido
      const formattedContents = data.contents.map((content, index) => {
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
      
      // Salvar os conteúdos
      await set(courseContentsRef, contentsObject);
      console.log('createCourse - Conteúdos do curso salvos com sucesso');
    } else {
      console.log('createCourse - Nenhum conteúdo para salvar');
    }

    // Retornar o curso criado
    return {
      id: courseId,
      fields: {
        ...courseFields
      }
    };
  } catch (error: unknown) {
    console.error('Erro ao criar curso:', error);
    throw error;
  }
};

export const getAllPublishedCourses = async (): Promise<Course[]> => {
  try {
    console.log('getAllPublishedCourses - Buscando todos os cursos publicados');
    
    const coursesRef = ref(db, collections.courses);
    const snapshot = await get(coursesRef);
    
    const courses: Course[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const courseData = childSnapshot.val();
        
        // Adicionar apenas cursos publicados
        if (courseData.status === 'published') {
          courses.push({
            id: childSnapshot.key as string,
            fields: {
              ...courseData,
              // Garantir que todos os campos estejam presentes
              category: courseData.category || '',
              // Incluir campos de pagamento
              paymentType: courseData.paymentType,
              recurrenceInterval: courseData.recurrenceInterval,
              installments: courseData.installments,
              installmentCount: courseData.installmentCount
            }
          });
        }
      });
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    courses.sort((a, b) => {
      const dateA = new Date(a.fields.created_at || 0).getTime();
      const dateB = new Date(b.fields.created_at || 0).getTime();
      return dateB - dateA;
    });
    
    console.log('getAllPublishedCourses - Total de cursos publicados encontrados:', courses.length);
    return courses;
  } catch (error) {
    console.error('Erro ao buscar cursos publicados:', error);
    throw error;
  }
};

export const updateCourse = async (courseId: string, courseData: {
  title: string;
  description: string;
  price: string;
  category?: string;
  level: string;
  status: string;
  thumbnail: File | null;
  professor_id: string;
  paymentType: PaymentType;
  recurrenceInterval?: RecurrenceInterval;
  installments?: boolean;
  installmentCount?: number;
}) => {
  try {
    console.log('updateCourse - Iniciando atualização do curso:', courseId);
    console.log('updateCourse - Dados recebidos:', JSON.stringify({
      ...courseData,
      thumbnail: courseData.thumbnail ? 'File object' : null
    }, null, 2));
    
    let thumbnailUrl = '';
    
    if (courseData.thumbnail) {
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${courseData.thumbnail.name}`;
      const storagePath = storageRef(storage, `course_thumbnails/${fileName}`);
      
      await uploadBytes(storagePath, courseData.thumbnail);
      thumbnailUrl = await getDownloadURL(storagePath);
      console.log('updateCourse - Thumbnail atualizada:', thumbnailUrl);
    }

    const formattedDate = new Date().toISOString().split('T')[0];
    
    // Obter os dados atuais do curso
    const courseRef = ref(db, `${collections.courses}/${courseId}`);
    const snapshot = await get(courseRef);
    
    if (!snapshot.exists()) {
      throw new Error('Curso não encontrado');
    }
    
    const currentCourseData = snapshot.val();
    console.log('updateCourse - Dados atuais do curso:', JSON.stringify(currentCourseData, null, 2));

    // Primeiro, remover campos de pagamento existentes para evitar conflitos
    const cleanedCurrentData = { ...currentCourseData };
    ['paymentType', 'recurrenceInterval', 'installments', 'installmentCount'].forEach(field => {
      if (field in cleanedCurrentData) {
        delete cleanedCurrentData[field];
      }
    });

    // Garantir que não haja valores undefined
    const updatedFields = {
      ...cleanedCurrentData,
      title: courseData.title || '',
      description: courseData.description || '',
      price: parseFloat(courseData.price) || 0,
      // Usar string vazia se category for undefined
      category: courseData.category || '',
      level: courseData.level || '',
      status: courseData.status || 'draft',
      professor_id: courseData.professor_id || currentCourseData.professor_id,
      updated_at: formattedDate,
      // Sempre incluir o tipo de pagamento
      paymentType: courseData.paymentType || 'one_time',
    };

    // Adicionar campos específicos com base no tipo de pagamento
    if (courseData.paymentType === 'recurring') {
      if (courseData.recurrenceInterval) {
        updatedFields.recurrenceInterval = courseData.recurrenceInterval;
      }
    } else if (courseData.paymentType === 'one_time') {
      updatedFields.installments = courseData.installments || false;
      if (courseData.installments && courseData.installmentCount) {
        updatedFields.installmentCount = courseData.installmentCount;
      }
    }

    // Adicionar thumbnail apenas se houver uma nova
    if (thumbnailUrl) {
      updatedFields.thumbnail = thumbnailUrl;
    }

    // Remover quaisquer campos undefined que possam ter sido adicionados
    Object.keys(updatedFields).forEach(key => {
      if (updatedFields[key] === undefined) {
        delete updatedFields[key];
      }
    });

    console.log('updateCourse - Campos atualizados a serem enviados:', JSON.stringify(updatedFields, null, 2));

    // Atualizar o curso no Firebase
    await update(courseRef, updatedFields);
    console.log('updateCourse - Curso atualizado com sucesso:', courseId);

    return {
      id: courseId,
      fields: updatedFields
    };
  } catch (error) {
    console.error('Erro ao atualizar curso:', error);
    throw error;
  }
};

export const getCourseById = async (id: string): Promise<Course> => {
  try {
    console.log('getCourseById - Buscando curso com ID:', id);
    
    const courseRef = ref(db, `${collections.courses}/${id}`);
    const snapshot = await get(courseRef);
    
    if (!snapshot.exists()) {
      throw new Error('Curso não encontrado');
    }
    
    const courseData = snapshot.val();
    console.log('getCourseById - Dados do curso encontrado:', JSON.stringify(courseData, null, 2));
    
    return {
      id: id,
      fields: {
        title: courseData.title,
        description: courseData.description,
        thumbnail: courseData.thumbnail,
        what_will_learn: courseData.what_will_learn,
        requirements: courseData.requirements,
        price: courseData.price,
        level: courseData.level,
        status: courseData.status,
        professor_id: courseData.professor_id,
        category: courseData.category || '',
        created_at: courseData.created_at,
        updated_at: courseData.updated_at,
        // Incluir campos de pagamento
        paymentType: courseData.paymentType,
        recurrenceInterval: courseData.recurrenceInterval,
        installments: courseData.installments,
        installmentCount: courseData.installmentCount
      }
    };
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
};

export const deleteCourse = async (courseId: string) => {
  try {
    // Verificar se existem matrículas ativas
    const enrollmentsRef = ref(db, collections.enrollments);
    const snapshot = await get(enrollmentsRef);
    
    let hasActiveEnrollments = false;
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const enrollment = childSnapshot.val();
        if (enrollment.course_id === courseId && enrollment.status === 'active') {
          hasActiveEnrollments = true;
        }
      });
    }
    
    if (hasActiveEnrollments) {
      throw new Error('Não é possível remover um curso com alunos matriculados');
    }

    // Remover o curso
    const courseRef = ref(db, `${collections.courses}/${courseId}`);
    await remove(courseRef);
    
    return { success: true, id: courseId };
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

export const getAllCourses = async (): Promise<Course[]> => {
  try {
    console.log('getAllCourses - Buscando todos os cursos');
    
    const coursesRef = ref(db, collections.courses);
    const snapshot = await get(coursesRef);
    
    const courses: Course[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const courseData = childSnapshot.val();
        courses.push({
          id: childSnapshot.key as string,
          fields: {
            ...courseData,
            // Garantir que todos os campos estejam presentes
            category: courseData.category || '',
            // Incluir campos de pagamento
            paymentType: courseData.paymentType,
            recurrenceInterval: courseData.recurrenceInterval,
            installments: courseData.installments,
            installmentCount: courseData.installmentCount
          }
        });
      });
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    courses.sort((a, b) => {
      const dateA = new Date(a.fields.created_at || 0).getTime();
      const dateB = new Date(b.fields.created_at || 0).getTime();
      return dateB - dateA;
    });
    
    console.log('getAllCourses - Total de cursos encontrados:', courses.length);
    return courses;
  } catch (error) {
    console.error('Erro ao buscar todos os cursos:', error);
    throw error;
  }
}; 