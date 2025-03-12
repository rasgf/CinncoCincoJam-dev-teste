import { getDatabase, ref, set, push, get } from 'firebase/database';
import { collections } from '../firebase';
import * as dbQueries from './database-queries';

const db = getDatabase();

/**
 * Tipos de ações que o chatbot pode executar
 */
export type ActionType = 
  | 'get_courses'
  | 'get_students'
  | 'get_payments'
  | 'get_revenue'
  | 'get_stats'
  | 'get_revenue_by_period'
  | 'get_payments_by_date'
  | 'send_message'
  | 'get_students_by_course'
  | 'get_mentors'
  | 'contact_mentor';

/**
 * Interface para os parâmetros das ações
 */
export interface ActionParams {
  courseId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  message?: string;
  recipients?: string[];
  period?: 'day' | 'week' | 'month' | 'year';
  date?: string;
  mentorId?: string;
  topic?: string;
}

/**
 * Processa uma ação solicitada pelo chatbot
 */
export const processAction = async (
  actionType: ActionType,
  params: ActionParams = {}
): Promise<any> => {
  try {
    switch (actionType) {
      case 'get_courses':
        return await dbQueries.getPublishedCourses();
        
      case 'get_students':
        return await dbQueries.getAllStudents();
        
      case 'get_payments':
        return await dbQueries.getPendingPayments();
        
      case 'get_revenue':
        if (!params.startDate || !params.endDate) {
          const now = new Date();
          params.startDate = `${now.getFullYear()}-01-01`;
          params.endDate = `${now.getFullYear()}-12-31`;
        }
        return await dbQueries.getRevenueByPeriod(params.startDate, params.endDate);
        
      case 'get_revenue_by_period':
        if (!params.period) {
          params.period = 'year';
        }
        const { startDate, endDate } = getDateRangeForPeriod(params.period);
        return await dbQueries.getRevenueByPeriod(startDate, endDate);
        
      case 'get_payments_by_date':
        if (!params.date) {
          params.date = formatDate(new Date());
        }
        return await dbQueries.getPaymentsByDate(params.date);
        
      case 'get_stats':
        return await dbQueries.getGeneralStats();
        
      case 'get_students_by_course':
        if (!params.courseId) {
          return await dbQueries.getAllStudents();
        }
        return await dbQueries.getStudentsByCourse(params.courseId);
        
      case 'get_mentors':
        return await dbQueries.getMentors();
        
      case 'contact_mentor':
        // Verificar se há um ID de mentor e uma mensagem
        if (!params.mentorId) {
          // Se não especificou um mentor, retornar todos os mentores
          return {
            success: false,
            error: "É necessário especificar um mentor para entrar em contato.",
            mentors: await dbQueries.getMentors()
          };
        }
        
        if (!params.message) {
          params.message = "Olá, gostaria de obter mais informações sobre como vender aulas de música online.";
        }
        
        // Simular o contato com o mentor
        return await contactMentor(params.mentorId, params.message, params.topic);
        
      case 'send_message': {
        // Verificar se há uma mensagem para enviar
        if (!params.message) {
          params.message = "Olá! Este é um comunicado importante da plataforma.";
        }

        let recipientIds: string[] = [];

        // Se recipients for 'all', buscar todos os alunos
        if (params.recipients && params.recipients.includes('all')) {
          const students = await dbQueries.getAllStudents();
          recipientIds = students.map(student => student.id);
        } 
        // Se recipients for 'pending_payment', buscar alunos com pagamentos pendentes
        else if (params.recipients && params.recipients.includes('pending_payment')) {
          // Buscar pagamentos pendentes
          const pendingPayments = await dbQueries.getPendingPayments();
          
          // Extrair IDs de usuários únicos dos pagamentos pendentes
          const userIdsWithPendingPayments = new Set<string>();
          pendingPayments.forEach(payment => {
            if (payment.user_id) {
              userIdsWithPendingPayments.add(payment.user_id);
            }
          });
          
          recipientIds = Array.from(userIdsWithPendingPayments);
        }
        // Se courseId estiver definido, buscar alunos do curso
        else if (params.courseId) {
          // Buscar alunos matriculados no curso
          const students = await dbQueries.getStudentsByCourse(params.courseId);
          recipientIds = students.map(student => student.id);
        }
        // Caso contrário, usar os IDs de destinatários fornecidos
        else if (params.recipients && params.recipients.length > 0) {
          recipientIds = params.recipients;
        }

        // Se não houver destinatários, retornar erro
        if (recipientIds.length === 0) {
          return {
            success: false,
            error: "Nenhum destinatário encontrado para enviar a mensagem."
          };
        }

        // Enviar mensagem para os destinatários
        const result = await sendMessageToStudents(recipientIds, params.message);
        return result;
      }
      
      default:
        return await dbQueries.getGeneralStats();
    }
  } catch (error) {
    console.error(`Erro ao processar ação ${actionType}:`, error);
    return {
      error: true,
      message: `Não foi possível processar a ação ${actionType}. Tentando fornecer informações gerais.`,
      fallbackData: await dbQueries.getGeneralStats()
    };
  }
};

/**
 * Obtém o intervalo de datas para um período específico
 */
export const getDateRangeForPeriod = (period: 'day' | 'week' | 'month' | 'year'): { startDate: string, endDate: string } => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;
  
  switch (period) {
    case 'day':
      // Hoje
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
      
    case 'week':
      // Esta semana (domingo a sábado)
      const dayOfWeek = now.getDay(); // 0 = domingo, 6 = sábado
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - dayOfWeek), 23, 59, 59, 999);
      break;
      
    case 'month':
      // Este mês
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
      
    case 'year':
      // Este ano
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
      
    default:
      throw new Error(`Período não suportado: ${period}`);
  }
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
};

/**
 * Formata uma data no formato YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Envia uma mensagem para alunos
 */
const sendMessageToStudents = async (recipientIds: string[], message: string): Promise<any> => {
  try {
    // Buscar informações dos destinatários para simular o envio
    const students = [];
    
    // Buscar informações de cada aluno específico
    for (const userId of recipientIds) {
      try {
        // Buscar informações do usuário no banco de dados
        const userRef = ref(db, `${collections.users}/${userId}`);
        const userSnapshot = await get(userRef);
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          students.push({
            id: userId,
            ...userData
          });
        }
      } catch (error) {
        console.error(`Erro ao buscar informações do usuário ${userId}:`, error);
      }
    }
    
    // Se não encontrou nenhum aluno, retornar erro
    if (students.length === 0) {
      return {
        success: false,
        error: "Nenhum destinatário válido encontrado."
      };
    }
    
    // Canais de comunicação disponíveis
    const availableChannels = ['WhatsApp', 'Email', 'SMS'];
    
    // Simular o envio de mensagens
    const results = students.map(student => {
      // Selecionar um canal aleatoriamente para demonstração
      const selectedChannel = availableChannels[Math.floor(Math.random() * availableChannels.length)];
      
      // Simular tempo de entrega (entre 1 e 5 segundos)
      const deliveryTime = new Date();
      deliveryTime.setSeconds(deliveryTime.getSeconds() + Math.floor(Math.random() * 5) + 1);
      
      return {
        userId: student.id,
        name: student.name || student.displayName || 'Aluno',
        email: student.email || 'email@exemplo.com',
        phone: student.phone || '+55 (XX) XXXXX-XXXX',
        channel: selectedChannel,
        status: 'simulated',
        deliveryTime: deliveryTime.toISOString()
      };
    });
    
    // Retornar informações sobre o envio simulado
    return {
      success: true,
      count: results.length,
      message,
      availableChannels,
      results
    };
  } catch (error) {
    console.error('Erro ao enviar mensagens:', error);
    return {
      success: false,
      error: "Ocorreu um erro ao enviar as mensagens."
    };
  }
};

/**
 * Simula o contato com um mentor
 */
const contactMentor = async (mentorId: string, message: string, topic?: string): Promise<any> => {
  try {
    // Buscar informações do mentor
    const mentors = await dbQueries.getMentors();
    const mentor = mentors.find(m => m.id === mentorId);
    
    if (!mentor) {
      return {
        success: false,
        error: "Mentor não encontrado.",
        mentors: mentors
      };
    }
    
    // Simular o envio da mensagem
    const now = new Date();
    const estimatedResponseTime = new Date(now.getTime() + Math.floor(Math.random() * 4 + 1) * 3600000); // 1-5 horas
    
    // Formatar o horário estimado de resposta
    const formattedResponseTime = estimatedResponseTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Formatar a data estimada de resposta
    const formattedResponseDate = estimatedResponseTime.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    return {
      success: true,
      mentor,
      message,
      topic: topic || "Vendas de aulas de música online",
      sentAt: now.toISOString(),
      estimatedResponseTime: estimatedResponseTime.toISOString(),
      formattedResponseTime,
      formattedResponseDate,
      contactMethods: [
        { type: 'email', value: mentor.email },
        { type: 'phone', value: mentor.phone }
      ]
    };
  } catch (error) {
    console.error('Erro ao contatar mentor:', error);
    return {
      success: false,
      error: "Ocorreu um erro ao tentar contatar o mentor."
    };
  }
}; 