export type MessageStatus = 'unread' | 'read' | 'archived';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  status: MessageStatus;
}

export interface Conversation {
  id: string;
  participants: string[]; // IDs dos usuários participantes (aluno e professor)
  participant_names: Record<string, string>; // Mapeamento de IDs para nomes (para exibição rápida)
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
  created_at: string;
  updated_at: string;
  course_id?: string; // Se a conversa estiver relacionada a um curso específico
  course_title?: string; // Título do curso para exibição
  unread_count?: Record<string, number>; // Contador de mensagens não lidas por usuário
}

export interface CreateMessageData {
  conversation_id: string;
  sender_id: string;
  content: string;
}

export interface CreateConversationData {
  participants: string[];
  participant_names: Record<string, string>;
  course_id?: string;
  course_title?: string;
  initial_message?: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
} 