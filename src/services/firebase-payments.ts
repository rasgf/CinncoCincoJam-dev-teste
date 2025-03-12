import { getDatabase, ref, get, query, orderByChild, equalTo, push, set } from 'firebase/database';
import { collections } from './firebase';

const db = getDatabase();

export interface Payment {
  id: string;
  course: {
    id: string;
    title: string;
    price: number;
  };
  student: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  date: string;
  dueDate?: string;
  status: 'paid' | 'pending' | 'processing' | 'overdue';
  payment_date?: string;
  payment_due_date?: string;
  payment_status: string;
  payment_method?: string;
  payment_id?: string;
  course_id: string;
  user_id: string;
}

/**
 * Obter todos os pagamentos de um professor
 */
export const getProfessorPayments = async (professorId: string): Promise<Payment[]> => {
  try {
    console.log('getProfessorPayments - Buscando pagamentos do professor:', professorId);
    
    // Primeiro, buscar todos os cursos do professor
    const coursesRef = ref(db, collections.courses);
    const coursesQuery = query(coursesRef, orderByChild('professor_id'), equalTo(professorId));
    const coursesSnapshot = await get(coursesQuery);
    
    if (!coursesSnapshot.exists()) {
      console.log('getProfessorPayments - Nenhum curso encontrado para o professor');
      return [];
    }
    
    // Coletar IDs dos cursos do professor
    const courseIds: string[] = [];
    coursesSnapshot.forEach((childSnapshot) => {
      courseIds.push(childSnapshot.key as string);
    });
    
    console.log('getProfessorPayments - Cursos encontrados:', courseIds);
    
    // Buscar todas as matrículas relacionadas a esses cursos
    const enrollmentsRef = ref(db, collections.enrollments);
    const enrollmentsSnapshot = await get(enrollmentsRef);
    
    if (!enrollmentsSnapshot.exists()) {
      console.log('getProfessorPayments - Nenhuma matrícula encontrada');
      return [];
    }
    
    // Filtrar matrículas pelos cursos do professor
    const payments: Payment[] = [];
    
    enrollmentsSnapshot.forEach((childSnapshot) => {
      const enrollment = childSnapshot.val();
      
      if (courseIds.includes(enrollment.course_id)) {
        payments.push({
          id: childSnapshot.key as string,
          course_id: enrollment.course_id,
          user_id: enrollment.user_id,
          amount: 0, // Será preenchido depois
          date: enrollment.payment_date || enrollment.payment_due_date || enrollment.created_at,
          dueDate: enrollment.payment_due_date,
          status: mapPaymentStatus(enrollment.payment_status),
          payment_date: enrollment.payment_date,
          payment_due_date: enrollment.payment_due_date,
          payment_status: enrollment.payment_status,
          payment_method: enrollment.payment_method,
          payment_id: enrollment.payment_id,
          course: {
            id: enrollment.course_id,
            title: '', // Será preenchido depois
            price: 0 // Será preenchido depois
          },
          student: {
            id: enrollment.user_id,
            name: '', // Será preenchido depois
            email: '' // Será preenchido depois
          }
        });
      }
    });
    
    console.log('getProfessorPayments - Pagamentos encontrados (antes de enriquecer):', payments.length);
    
    // Enriquecer com informações do curso e do aluno
    const enrichedPayments = await Promise.all(payments.map(async (payment) => {
      // Buscar informações do curso
      const courseRef = ref(db, `${collections.courses}/${payment.course_id}`);
      const courseSnapshot = await get(courseRef);
      const courseData = courseSnapshot.exists() ? courseSnapshot.val() : null;
      
      // Buscar informações do aluno
      const userRef = ref(db, `${collections.users}/${payment.user_id}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.exists() ? userSnapshot.val() : null;
      
      return {
        ...payment,
        amount: courseData?.price || 0,
        course: courseData ? {
          id: payment.course_id,
          title: courseData.title,
          price: courseData.price
        } : payment.course,
        student: userData ? {
          id: payment.user_id,
          name: userData.name,
          email: userData.email
        } : payment.student
      };
    }));
    
    console.log('getProfessorPayments - Pagamentos enriquecidos:', enrichedPayments.length);
    
    // Ordenar por data (mais recente primeiro)
    enrichedPayments.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
    
    return enrichedPayments;
  } catch (error) {
    console.error('Erro ao buscar pagamentos do professor:', error);
    throw error;
  }
};

/**
 * Obter pagamentos pendentes de um professor
 */
export const getPendingPayments = async (professorId: string): Promise<Payment[]> => {
  try {
    const allPayments = await getProfessorPayments(professorId);
    return allPayments.filter(payment => 
      payment.status === 'pending' || payment.status === 'processing'
    );
  } catch (error) {
    console.error('Erro ao buscar pagamentos pendentes:', error);
    throw error;
  }
};

/**
 * Obter pagamentos atrasados de um professor
 */
export const getOverduePayments = async (professorId: string): Promise<Payment[]> => {
  try {
    const allPayments = await getProfessorPayments(professorId);
    return allPayments.filter(payment => payment.status === 'overdue');
  } catch (error) {
    console.error('Erro ao buscar pagamentos atrasados:', error);
    throw error;
  }
};

/**
 * Obter pagamentos recebidos de um professor
 */
export const getPaidPayments = async (professorId: string): Promise<Payment[]> => {
  try {
    const allPayments = await getProfessorPayments(professorId);
    return allPayments.filter(payment => payment.status === 'paid');
  } catch (error) {
    console.error('Erro ao buscar pagamentos recebidos:', error);
    throw error;
  }
};

/**
 * Mapear status de pagamento do banco para o formato da UI
 */
const mapPaymentStatus = (status: string): 'paid' | 'pending' | 'processing' | 'overdue' => {
  switch (status) {
    case 'paid':
      return 'paid';
    case 'pending':
      return 'pending';
    case 'processing':
      return 'processing';
    case 'overdue':
      return 'overdue';
    default:
      return 'pending';
  }
};

/**
 * Enviar lembrete de pagamento para um aluno
 */
export const sendPaymentReminder = async (paymentId: string): Promise<boolean> => {
  try {
    // Buscar informações do pagamento
    const enrollmentRef = ref(db, `${collections.enrollments}/${paymentId}`);
    const enrollmentSnapshot = await get(enrollmentRef);
    
    if (!enrollmentSnapshot.exists()) {
      throw new Error('Pagamento não encontrado');
    }
    
    const enrollment = enrollmentSnapshot.val();
    
    // Criar uma nova mensagem
    const messagesRef = ref(db, 'messages');
    const newMessageRef = push(messagesRef);
    
    const messageData = {
      user_id: enrollment.user_id,
      content: `Lembrete de pagamento: Você tem um pagamento pendente para o curso. Por favor, regularize sua situação.`,
      read: false,
      created_at: new Date().toISOString(),
      payment_id: paymentId
    };
    
    await set(newMessageRef, messageData);
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar lembrete de pagamento:', error);
    throw error;
  }
};

/**
 * Obter estatísticas de pagamentos de um professor
 */
export const getPaymentStats = async (professorId: string) => {
  try {
    const allPayments = await getProfessorPayments(professorId);
    
    const totalReceived = allPayments
      .filter(payment => payment.status === 'paid')
      .reduce((sum, payment) => sum + payment.amount, 0);
      
    const totalPending = allPayments
      .filter(payment => payment.status === 'pending' || payment.status === 'processing')
      .reduce((sum, payment) => sum + payment.amount, 0);
      
    const totalOverdue = allPayments
      .filter(payment => payment.status === 'overdue')
      .reduce((sum, payment) => sum + payment.amount, 0);
      
    return {
      totalReceived,
      totalPending,
      totalOverdue,
      totalPayments: allPayments.length,
      paidPayments: allPayments.filter(payment => payment.status === 'paid').length,
      pendingPayments: allPayments.filter(payment => payment.status === 'pending' || payment.status === 'processing').length,
      overduePayments: allPayments.filter(payment => payment.status === 'overdue').length
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de pagamentos:', error);
    throw error;
  }
}; 