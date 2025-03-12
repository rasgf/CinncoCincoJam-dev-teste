import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { collections } from '../firebase';

const db = getDatabase();

/**
 * Serviço para consultar o banco de dados para o chatbot
 */

// Obter todos os cursos
export const getAllCourses = async () => {
  try {
    const coursesRef = ref(db, collections.courses);
    const snapshot = await get(coursesRef);
    
    const courses: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const courseData = childSnapshot.val();
        courses.push({
          id: childSnapshot.key,
          ...courseData
        });
      });
    }
    
    return courses;
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    throw error;
  }
};

// Obter todos os cursos publicados
export const getPublishedCourses = async () => {
  try {
    const coursesRef = ref(db, collections.courses);
    const snapshot = await get(coursesRef);
    
    const courses: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const courseData = childSnapshot.val();
        if (courseData.status === 'published') {
          courses.push({
            id: childSnapshot.key,
            ...courseData
          });
        }
      });
    }
    
    return courses;
  } catch (error) {
    console.error('Erro ao buscar cursos publicados:', error);
    throw error;
  }
};

// Obter todos os alunos
export const getAllStudents = async () => {
  try {
    const usersRef = ref(db, collections.users);
    const userQuery = query(usersRef, orderByChild('role'), equalTo('aluno'));
    const snapshot = await get(userQuery);
    
    const students: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        students.push({
          id: childSnapshot.key,
          ...userData
        });
      });
    }
    
    return students;
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    throw error;
  }
};

// Obter todas as matrículas
export const getAllEnrollments = async () => {
  try {
    const enrollmentsRef = ref(db, collections.enrollments);
    const snapshot = await get(enrollmentsRef);
    
    const enrollments: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const enrollmentData = childSnapshot.val();
        enrollments.push({
          id: childSnapshot.key,
          ...enrollmentData
        });
      });
    }
    
    return enrollments;
  } catch (error) {
    console.error('Erro ao buscar matrículas:', error);
    throw error;
  }
};

// Obter alunos por curso
export const getStudentsByCourse = async (courseId: string) => {
  try {
    const enrollmentsRef = ref(db, collections.enrollments);
    const courseQuery = query(enrollmentsRef, orderByChild('course_id'), equalTo(courseId));
    const snapshot = await get(courseQuery);
    
    const studentIds: string[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const enrollment = childSnapshot.val();
        if (enrollment.status === 'active') {
          studentIds.push(enrollment.user_id);
        }
      });
    }
    
    if (studentIds.length === 0) {
      return [];
    }
    
    // Buscar informações dos alunos
    const usersRef = ref(db, collections.users);
    const usersSnapshot = await get(usersRef);
    
    const students: any[] = [];
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        if (studentIds.includes(childSnapshot.key as string)) {
          const userData = childSnapshot.val();
          students.push({
            id: childSnapshot.key,
            ...userData
          });
        }
      });
    }
    
    return students;
  } catch (error) {
    console.error('Erro ao buscar alunos por curso:', error);
    throw error;
  }
};

// Obter pagamentos pendentes
export const getPendingPayments = async () => {
  try {
    // Usar dados mockados para demonstração, similar aos da página de pagamentos
    const mockPayments = [
      {
        id: '3',
        course_id: 'course-1',
        user_id: 'student-3',
        payment_status: 'pending',
        payment_due_date: '2025-04-10',
        course: {
          id: 'course-1',
          title: 'Teoria Musical Avançada',
          price: 750.00
        },
        student: {
          id: 'student-3',
          name: 'Mariana Santos',
          email: 'mariana@example.com'
        }
      },
      {
        id: '4',
        course_id: 'course-2',
        user_id: 'student-4',
        payment_status: 'pending',
        payment_due_date: '2025-04-15',
        course: {
          id: 'course-2',
          title: 'Jazz Instrumental',
          price: 490.00
        },
        student: {
          id: 'student-4',
          name: 'Pedro Costa',
          email: 'pedro@example.com'
        }
      },
      {
        id: '5',
        course_id: 'course-1',
        user_id: 'student-5',
        payment_status: 'processing',
        payment_due_date: '2025-03-20',
        course: {
          id: 'course-1',
          title: 'Teoria Musical Avançada',
          price: 500.00
        },
        student: {
          id: 'student-5',
          name: 'Juliana Mendes',
          email: 'juliana@example.com'
        }
      },
      {
        id: '6',
        course_id: 'course-1',
        user_id: 'student-6',
        payment_status: 'overdue',
        payment_due_date: '2025-02-05',
        course: {
          id: 'course-1',
          title: 'Teoria Musical Avançada',
          price: 350.00
        },
        student: {
          id: 'student-6',
          name: 'Roberto Almeida',
          email: 'roberto@example.com'
        }
      },
      {
        id: '7',
        course_id: 'course-2',
        user_id: 'student-7',
        payment_status: 'overdue',
        payment_due_date: '2025-02-10',
        course: {
          id: 'course-2',
          title: 'Jazz Instrumental',
          price: 490.00
        },
        student: {
          id: 'student-7',
          name: 'Fernanda Lima',
          email: 'fernanda@example.com'
        }
      }
    ];
    
    return mockPayments;
  } catch (error) {
    console.error('Erro ao buscar pagamentos pendentes:', error);
    throw error;
  }
};

// Obter receita por período
export const getRevenueByPeriod = async (startDate: string, endDate: string) => {
  try {
    // Usar dados mockados para demonstração
    const mockPaidPayments = [
      {
        id: '1',
        course_id: 'course-1',
        user_id: 'student-1',
        payment_status: 'paid',
        payment_date: '2025-03-10',
        payment_method: 'credit_card',
        course: {
          id: 'course-1',
          title: 'Teoria Musical Avançada',
          price: 1250.00
        },
        student: {
          id: 'student-1',
          name: 'Ana Silva',
          email: 'ana@example.com'
        }
      },
      {
        id: '2',
        course_id: 'course-2',
        user_id: 'student-2',
        payment_status: 'paid',
        payment_date: '2025-03-15',
        payment_method: 'pix',
        course: {
          id: 'course-2',
          title: 'Jazz Instrumental',
          price: 980.00
        },
        student: {
          id: 'student-2',
          name: 'Carlos Oliveira',
          email: 'carlos@example.com'
        }
      }
    ];
    
    // Filtrar pagamentos dentro do período
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    const paymentsInPeriod = mockPaidPayments.filter(payment => {
      const paymentDate = new Date(payment.payment_date).getTime();
      return paymentDate >= start && paymentDate <= end;
    });
    
    const totalRevenue = paymentsInPeriod.reduce((sum, payment) => sum + payment.course.price, 0);
    
    return {
      totalRevenue,
      paymentsCount: paymentsInPeriod.length,
      startDate,
      endDate
    };
  } catch (error) {
    console.error('Erro ao calcular receita por período:', error);
    throw error;
  }
};

// Obter estatísticas gerais
export const getGeneralStats = async () => {
  try {
    // Dados mockados para demonstração
    return {
      studentsCount: 7,
      coursesCount: 2,
      enrollmentsCount: 7,
      totalRevenue: 2230.00,
      paidEnrollmentsCount: 2,
      pendingPaymentsCount: 5,
      totalPending: 2580.00
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas gerais:', error);
    throw error;
  }
};

// Obter pagamentos por data
export const getPaymentsByDate = async (date: string) => {
  try {
    const targetDate = new Date(date);
    const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Dados mockados para demonstração
    const allMockPayments = [
      {
        id: '1',
        course_id: 'course-1',
        user_id: 'student-1',
        payment_status: 'paid',
        payment_date: '2025-03-10',
        payment_method: 'credit_card',
        type: 'paid',
        course: {
          id: 'course-1',
          title: 'Teoria Musical Avançada',
          price: 1250.00
        },
        student: {
          id: 'student-1',
          name: 'Ana Silva',
          email: 'ana@example.com'
        }
      },
      {
        id: '2',
        course_id: 'course-2',
        user_id: 'student-2',
        payment_status: 'paid',
        payment_date: '2025-03-15',
        payment_method: 'pix',
        type: 'paid',
        course: {
          id: 'course-2',
          title: 'Jazz Instrumental',
          price: 980.00
        },
        student: {
          id: 'student-2',
          name: 'Carlos Oliveira',
          email: 'carlos@example.com'
        }
      },
      {
        id: '3',
        course_id: 'course-1',
        user_id: 'student-3',
        payment_status: 'pending',
        payment_due_date: '2025-04-10',
        type: 'due',
        course: {
          id: 'course-1',
          title: 'Teoria Musical Avançada',
          price: 750.00
        },
        student: {
          id: 'student-3',
          name: 'Mariana Santos',
          email: 'mariana@example.com'
        }
      },
      {
        id: '4',
        course_id: 'course-2',
        user_id: 'student-4',
        payment_status: 'pending',
        payment_due_date: '2025-04-15',
        type: 'due',
        course: {
          id: 'course-2',
          title: 'Jazz Instrumental',
          price: 490.00
        },
        student: {
          id: 'student-4',
          name: 'Pedro Costa',
          email: 'pedro@example.com'
        }
      },
      {
        id: '5',
        course_id: 'course-1',
        user_id: 'student-5',
        payment_status: 'processing',
        payment_due_date: '2025-03-20',
        type: 'due',
        course: {
          id: 'course-1',
          title: 'Teoria Musical Avançada',
          price: 500.00
        },
        student: {
          id: 'student-5',
          name: 'Juliana Mendes',
          email: 'juliana@example.com'
        }
      },
      {
        id: '6',
        course_id: 'course-1',
        user_id: 'student-6',
        payment_status: 'overdue',
        payment_due_date: '2025-02-05',
        type: 'due',
        course: {
          id: 'course-1',
          title: 'Teoria Musical Avançada',
          price: 350.00
        },
        student: {
          id: 'student-6',
          name: 'Roberto Almeida',
          email: 'roberto@example.com'
        }
      },
      {
        id: '7',
        course_id: 'course-2',
        user_id: 'student-7',
        payment_status: 'overdue',
        payment_due_date: '2025-02-10',
        type: 'due',
        course: {
          id: 'course-2',
          title: 'Jazz Instrumental',
          price: 490.00
        },
        student: {
          id: 'student-7',
          name: 'Fernanda Lima',
          email: 'fernanda@example.com'
        }
      }
    ];
    
    // Filtrar pagamentos pela data alvo
    const filteredPayments = allMockPayments.filter(payment => {
      if (payment.type === 'paid' && payment.payment_date) {
        const paymentDate = new Date(payment.payment_date);
        const paymentDateStr = paymentDate.toISOString().split('T')[0];
        return paymentDateStr === targetDateStr;
      } else if (payment.type === 'due' && payment.payment_due_date) {
        const dueDate = new Date(payment.payment_due_date);
        const dueDateStr = dueDate.toISOString().split('T')[0];
        return dueDateStr === targetDateStr;
      }
      return false;
    });
    
    return {
      date: targetDateStr,
      payments: filteredPayments,
      duePayments: filteredPayments.filter(p => p.type === 'due'),
      paidPayments: filteredPayments.filter(p => p.type === 'paid'),
      totalDue: filteredPayments
        .filter(p => p.type === 'due')
        .reduce((sum, p) => sum + (p.course?.price || 0), 0),
      totalPaid: filteredPayments
        .filter(p => p.type === 'paid')
        .reduce((sum, p) => sum + (p.course?.price || 0), 0)
    };
  } catch (error) {
    console.error('Erro ao buscar pagamentos por data:', error);
    throw error;
  }
};

// Obter mentores especialistas
export const getMentors = async () => {
  try {
    // Dados mockados de mentores especialistas
    const mentors = [
      {
        id: 'mentor-1',
        name: 'Ana Oliveira',
        email: 'ana.oliveira@cincocincojam.com',
        phone: '+55 11 98765-4321',
        specialty: 'Marketing Digital para Músicos',
        experience: '10 anos',
        bio: 'Especialista em estratégias de marketing digital para músicos e professores de música. Ajudou mais de 200 profissionais a estabelecerem presença online e monetizarem seu conhecimento através de cursos e aulas particulares.',
        availability: 'Segunda a Sexta, 9h às 18h',
        rating: 4.9,
        testimonials: [
          {
            author: 'Carlos Mendes',
            text: 'A Ana transformou completamente minha abordagem de vendas online. Em apenas 3 meses, consegui triplicar minha base de alunos.'
          }
        ]
      },
      {
        id: 'mentor-2',
        name: 'Ricardo Santos',
        email: 'ricardo.santos@cincocincojam.com',
        phone: '+55 21 98765-4321',
        specialty: 'Monetização de Conteúdo Musical',
        experience: '8 anos',
        bio: 'Especialista em criação e venda de cursos de música online e offline. Desenvolveu metodologia própria para precificação e estruturação de conteúdo que maximiza engajamento e retenção de alunos.',
        availability: 'Terça a Sábado, 10h às 19h',
        rating: 4.8,
        testimonials: [
          {
            author: 'Mariana Costa',
            text: 'O Ricardo me ajudou a estruturar meu curso de violão do zero. Sua experiência com plataformas online foi fundamental para o sucesso do lançamento.'
          }
        ]
      }
    ];
    
    return mentors;
  } catch (error) {
    console.error('Erro ao buscar mentores:', error);
    throw error;
  }
}; 