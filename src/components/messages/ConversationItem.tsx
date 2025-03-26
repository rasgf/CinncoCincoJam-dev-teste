'use client';

import { useState, useEffect } from 'react';
import { Conversation } from '@/types/message';
import { formatRelativeTime } from '@/utils/dates';

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationItem({ 
  conversation, 
  currentUserId, 
  isSelected, 
  onClick 
}: ConversationItemProps) {
  // Encontrar o outro participante (assumindo conversa entre 2 pessoas)
  const otherParticipantId = conversation.participants.find(id => id !== currentUserId);
  const participantName = otherParticipantId 
    ? conversation.participant_names[otherParticipantId] 
    : 'Usuário desconhecido';
  
  // Verificar se há mensagens não lidas para o usuário atual
  const unreadCount = conversation.unread_count?.[currentUserId] || 0;
  
  // Verificar se a mensagem mais recente é do usuário atual
  const isLastMessageFromCurrentUser = conversation.last_message?.sender_id === currentUserId;
  
  // Formatar data relativa (ex: "há 5 minutos", "há 2 horas")
  const lastMessageTime = conversation.last_message?.created_at 
    ? formatRelativeTime(new Date(conversation.last_message.created_at))
    : '';
  
  return (
    <div 
      className={`p-3 mb-1 rounded-md cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-blue-50 dark:bg-blue-900/30' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
          {participantName}
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
          {lastMessageTime}
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <p className={`text-sm truncate ${
          unreadCount > 0 && !isLastMessageFromCurrentUser
            ? 'font-semibold text-gray-900 dark:text-gray-100'
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          {isLastMessageFromCurrentUser && (
            <span className="text-gray-400 dark:text-gray-500 font-normal mr-1">Você: </span>
          )}
          {conversation.last_message?.content || 'Nenhuma mensagem'}
        </p>
        
        {unreadCount > 0 && (
          <div className="ml-2 shrink-0 bg-blue-500 text-white text-xs font-semibold h-5 min-w-5 rounded-full flex items-center justify-center px-1.5">
            {unreadCount}
          </div>
        )}
      </div>
      
      {conversation.course_title && (
        <div className="mt-1">
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full">
            {conversation.course_title}
          </span>
        </div>
      )}
    </div>
  );
} 