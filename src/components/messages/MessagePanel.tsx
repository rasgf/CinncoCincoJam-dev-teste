'use client';

import { useState, useEffect, useRef } from 'react';
import { ConversationWithMessages } from '@/types/message';
import { MessageItem } from './MessageItem';
import { createMessage, markMessagesAsRead } from '@/services/firebase-messages';
import { Button } from '@/components/common/Button';

interface MessagePanelProps {
  conversation: ConversationWithMessages;
  currentUserId: string;
}

export function MessagePanel({ conversation, currentUserId }: MessagePanelProps) {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Encontrar o outro participante (assumindo conversa entre 2 pessoas)
  const otherParticipantId = conversation.participants.find(id => id !== currentUserId);
  const participantName = otherParticipantId 
    ? conversation.participant_names[otherParticipantId] 
    : 'Usuário desconhecido';
  
  // Atualizar quando a conversa mudar
  useEffect(() => {
    // Rolar para o final da conversa
    scrollToBottom();
    
    // Marcar mensagens como lidas
    if (conversation.id && currentUserId) {
      markMessagesAsRead(conversation.id, currentUserId)
        .catch(error => console.error('Erro ao marcar mensagens como lidas:', error));
    }
  }, [conversation.id, conversation.messages, currentUserId]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async () => {
    const message = newMessage.trim();
    if (!message || !conversation.id || sending) return;
    
    try {
      setSending(true);
      
      await createMessage({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        content: message
      });
      
      setNewMessage('');
      // Não precisamos atualizar manualmente as mensagens, isso será feito quando a conversa for recarregada
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Não foi possível enviar a mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="px-4 py-3 border-b dark:border-gray-700 flex justify-between items-center">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          {participantName}
        </h2>
        
        {conversation.course_title && (
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-full">
            {conversation.course_title}
          </span>
        )}
      </div>
      
      {/* Lista de mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map(message => (
          <MessageItem
            key={message.id}
            message={message}
            isCurrentUser={message.sender_id === currentUserId}
          />
        ))}
        
        {/* Elemento para scroll automático para o final da conversa */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input para nova mensagem */}
      <div className="p-3 border-t dark:border-gray-700">
        <div className="flex space-x-3">
          <textarea
            className="flex-1 border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 resize-none"
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
          />
          <div className="flex-shrink-0 flex items-end">
            <Button
              onClick={handleSendMessage}
              isLoading={sending}
              disabled={sending || !newMessage.trim()}
            >
              Enviar
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Pressione Enter para enviar ou Shift+Enter para quebrar a linha
        </p>
      </div>
    </div>
  );
} 