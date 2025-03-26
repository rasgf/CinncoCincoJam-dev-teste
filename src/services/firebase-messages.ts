import { getDatabase, ref, set, get, update, push, query, orderByChild, equalTo } from 'firebase/database';
import { collections } from './firebase';
import { 
  Conversation, 
  Message, 
  CreateMessageData, 
  CreateConversationData,
  ConversationWithMessages
} from '@/types/message';

const db = getDatabase();

// Criar uma nova conversa
export const createConversation = async (data: CreateConversationData): Promise<Conversation> => {
  try {
    console.log('createConversation - Iniciando criação de conversa:', data);
    
    // Criar uma nova conversa
    const conversationsRef = ref(db, collections.conversations);
    const newConversationRef = push(conversationsRef);
    const conversationId = newConversationRef.key;
    
    if (!conversationId) {
      throw new Error('Falha ao gerar ID para a conversa');
    }
    
    const now = new Date().toISOString();
    
    // Preparar objeto de conversa
    const conversation: Omit<Conversation, 'id'> = {
      participants: data.participants,
      participant_names: data.participant_names,
      created_at: now,
      updated_at: now,
      unread_count: {}
    };
    
    // Adicionar informações do curso se fornecidas
    if (data.course_id) {
      conversation.course_id = data.course_id;
    }
    
    if (data.course_title) {
      conversation.course_title = data.course_title;
    }
    
    // Inicializar contadores de mensagens não lidas para todos os participantes
    data.participants.forEach(participantId => {
      if (conversation.unread_count) {
        conversation.unread_count[participantId] = 0;
      }
    });
    
    // Salvar a conversa
    await set(newConversationRef, conversation);
    console.log('createConversation - Conversa criada com ID:', conversationId);
    
    // Se houver uma mensagem inicial, criá-la
    if (data.initial_message && data.participants.length > 0) {
      const messageData: CreateMessageData = {
        conversation_id: conversationId,
        sender_id: data.participants[0], // primeiro participante é o remetente da mensagem inicial
        content: data.initial_message
      };
      
      try {
        const message = await createMessage(messageData);
        console.log('createConversation - Mensagem inicial criada:', message);
      } catch (error) {
        console.error('createConversation - Erro ao criar mensagem inicial:', error);
      }
    }
    
    return {
      id: conversationId,
      ...conversation
    };
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    throw error;
  }
};

// Criar uma nova mensagem
export const createMessage = async (data: CreateMessageData): Promise<Message> => {
  try {
    console.log('createMessage - Iniciando criação de mensagem:', data);
    
    // Validar dados
    if (!data.conversation_id || !data.sender_id || !data.content) {
      throw new Error('Dados de mensagem inválidos');
    }
    
    // Verificar se a conversa existe
    const conversationRef = ref(db, `${collections.conversations}/${data.conversation_id}`);
    const conversationSnapshot = await get(conversationRef);
    
    if (!conversationSnapshot.exists()) {
      throw new Error('Conversa não encontrada');
    }
    
    const conversation = conversationSnapshot.val() as Omit<Conversation, 'id'>;
    
    // Verificar se o remetente é um participante
    if (!conversation.participants.includes(data.sender_id)) {
      throw new Error('Remetente não é um participante da conversa');
    }
    
    // Criar uma nova mensagem
    const messagesRef = ref(db, `${collections.messages}/${data.conversation_id}`);
    const newMessageRef = push(messagesRef);
    const messageId = newMessageRef.key;
    
    if (!messageId) {
      throw new Error('Falha ao gerar ID para a mensagem');
    }
    
    const now = new Date().toISOString();
    
    // Preparar objeto de mensagem
    const message: Omit<Message, 'id'> = {
      conversation_id: data.conversation_id,
      sender_id: data.sender_id,
      content: data.content,
      created_at: now,
      status: 'unread'
    };
    
    // Salvar a mensagem
    await set(newMessageRef, message);
    console.log('createMessage - Mensagem criada com ID:', messageId);
    
    // Atualizar a última mensagem na conversa
    const lastMessage = {
      content: data.content,
      sender_id: data.sender_id,
      created_at: now
    };
    
    // Atualizar contadores de mensagens não lidas
    const unreadCount = conversation.unread_count || {};
    
    // Incrementar contador para todos os participantes exceto o remetente
    conversation.participants.forEach(participantId => {
      if (participantId !== data.sender_id) {
        unreadCount[participantId] = (unreadCount[participantId] || 0) + 1;
      }
    });
    
    // Atualizar a conversa
    await update(conversationRef, {
      last_message: lastMessage,
      updated_at: now,
      unread_count: unreadCount
    });
    
    console.log('createMessage - Conversa atualizada com última mensagem');
    
    return {
      id: messageId,
      ...message
    };
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    throw error;
  }
};

// Obter conversas de um usuário
export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    console.log('getUserConversations - Buscando conversas para o usuário:', userId);
    
    const conversationsRef = ref(db, collections.conversations);
    const conversationsSnapshot = await get(conversationsRef);
    
    if (!conversationsSnapshot.exists()) {
      console.log('getUserConversations - Nenhuma conversa encontrada');
      return [];
    }
    
    const conversations: Conversation[] = [];
    
    conversationsSnapshot.forEach((childSnapshot) => {
      const conversation = childSnapshot.val() as Omit<Conversation, 'id'>;
      const conversationId = childSnapshot.key;
      
      if (conversation.participants.includes(userId) && conversationId) {
        conversations.push({
          id: conversationId,
          ...conversation
        });
      }
    });
    
    // Ordenar por data de atualização (mais recente primeiro)
    conversations.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    
    console.log(`getUserConversations - ${conversations.length} conversas encontradas`);
    return conversations;
  } catch (error) {
    console.error('Erro ao buscar conversas do usuário:', error);
    throw error;
  }
};

// Obter mensagens de uma conversa
export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    console.log('getConversationMessages - Buscando mensagens da conversa:', conversationId);
    
    const messagesRef = ref(db, `${collections.messages}/${conversationId}`);
    const messagesSnapshot = await get(messagesRef);
    
    if (!messagesSnapshot.exists()) {
      console.log('getConversationMessages - Nenhuma mensagem encontrada');
      return [];
    }
    
    const messages: Message[] = [];
    
    messagesSnapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val() as Omit<Message, 'id'>;
      const messageId = childSnapshot.key;
      
      if (messageId) {
        messages.push({
          id: messageId,
          ...message
        });
      }
    });
    
    // Ordenar por data de criação (mais antiga primeiro)
    messages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    console.log(`getConversationMessages - ${messages.length} mensagens encontradas`);
    return messages;
  } catch (error) {
    console.error('Erro ao buscar mensagens da conversa:', error);
    throw error;
  }
};

// Obter conversa com mensagens
export const getConversationWithMessages = async (conversationId: string): Promise<ConversationWithMessages | null> => {
  try {
    console.log('getConversationWithMessages - Buscando conversa com mensagens:', conversationId);
    
    // Buscar a conversa
    const conversationRef = ref(db, `${collections.conversations}/${conversationId}`);
    const conversationSnapshot = await get(conversationRef);
    
    if (!conversationSnapshot.exists()) {
      console.log('getConversationWithMessages - Conversa não encontrada');
      return null;
    }
    
    const conversation = conversationSnapshot.val() as Omit<Conversation, 'id'>;
    
    // Buscar as mensagens
    const messages = await getConversationMessages(conversationId);
    
    return {
      id: conversationId,
      ...conversation,
      messages
    };
  } catch (error) {
    console.error('Erro ao buscar conversa com mensagens:', error);
    throw error;
  }
};

// Marcar mensagens como lidas
export const markMessagesAsRead = async (conversationId: string, userId: string): Promise<boolean> => {
  try {
    console.log('markMessagesAsRead - Marcando mensagens como lidas:', { conversationId, userId });
    
    // Buscar a conversa
    const conversationRef = ref(db, `${collections.conversations}/${conversationId}`);
    const conversationSnapshot = await get(conversationRef);
    
    if (!conversationSnapshot.exists()) {
      console.log('markMessagesAsRead - Conversa não encontrada');
      return false;
    }
    
    const conversation = conversationSnapshot.val() as Omit<Conversation, 'id'>;
    
    // Verificar se o usuário é um participante
    if (!conversation.participants.includes(userId)) {
      console.log('markMessagesAsRead - Usuário não é um participante da conversa');
      return false;
    }
    
    // Atualizar contador de mensagens não lidas
    const unreadCount = conversation.unread_count || {};
    unreadCount[userId] = 0;
    
    // Atualizar a conversa
    await update(conversationRef, {
      unread_count: unreadCount
    });
    
    // Buscar mensagens não lidas enviadas por outros usuários
    const messagesRef = ref(db, `${collections.messages}/${conversationId}`);
    const messagesSnapshot = await get(messagesRef);
    
    if (!messagesSnapshot.exists()) {
      return true;
    }
    
    // Promessas para atualizar mensagens
    const updatePromises: Promise<void>[] = [];
    
    messagesSnapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val() as Message;
      const messageId = childSnapshot.key;
      
      // Marcar como lida apenas se não for do próprio usuário e estiver não lida
      if (message.sender_id !== userId && message.status === 'unread' && messageId) {
        const messageRef = ref(db, `${collections.messages}/${conversationId}/${messageId}`);
        updatePromises.push(update(messageRef, { status: 'read' }));
      }
    });
    
    // Executar todas as atualizações
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(`markMessagesAsRead - ${updatePromises.length} mensagens marcadas como lidas`);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    throw error;
  }
};

// Verificar se existe uma conversa entre usuários
export const findConversationBetweenUsers = async (userIds: string[]): Promise<Conversation | null> => {
  try {
    console.log('findConversationBetweenUsers - Buscando conversa entre usuários:', userIds);
    
    const conversationsRef = ref(db, collections.conversations);
    const conversationsSnapshot = await get(conversationsRef);
    
    if (!conversationsSnapshot.exists()) {
      console.log('findConversationBetweenUsers - Nenhuma conversa encontrada');
      return null;
    }
    
    let foundConversation: Conversation | null = null;
    
    conversationsSnapshot.forEach((childSnapshot) => {
      const conversation = childSnapshot.val() as Omit<Conversation, 'id'>;
      const conversationId = childSnapshot.key;
      
      // Verificar se todos os userIds são participantes e se o número de participantes corresponde
      if (
        conversationId &&
        conversation.participants.length === userIds.length &&
        userIds.every(userId => conversation.participants.includes(userId))
      ) {
        foundConversation = {
          id: conversationId,
          ...conversation
        };
        return true; // Interromper o loop forEach
      }
      
      return false;
    });
    
    return foundConversation;
  } catch (error) {
    console.error('Erro ao buscar conversa entre usuários:', error);
    throw error;
  }
};

// Obter o total de mensagens não lidas para um usuário
export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  try {
    console.log('getUnreadMessageCount - Buscando total de mensagens não lidas para o usuário:', userId);
    
    const conversations = await getUserConversations(userId);
    
    let totalUnread = 0;
    
    conversations.forEach(conversation => {
      if (conversation.unread_count && conversation.unread_count[userId]) {
        totalUnread += conversation.unread_count[userId];
      }
    });
    
    console.log(`getUnreadMessageCount - ${totalUnread} mensagens não lidas encontradas`);
    return totalUnread;
  } catch (error) {
    console.error('Erro ao buscar total de mensagens não lidas:', error);
    return 0;
  }
}; 