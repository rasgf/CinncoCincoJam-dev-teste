'use client';

import { Message } from '@/types/message';
import { formatDateTime } from '@/utils/dates';

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
}

export function MessageItem({ message, isCurrentUser }: MessageItemProps) {
  // Formatar data da mensagem
  const messageTime = formatDateTime(new Date(message.created_at));
  
  return (
    <div className={`mb-4 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] px-4 py-2 rounded-lg ${
        isCurrentUser 
          ? 'bg-blue-500 text-white rounded-br-none'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
      }`}>
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
        <div className={`text-xs mt-1 text-right ${
          isCurrentUser
            ? 'text-blue-100'
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {messageTime}
          {message.status === 'read' && isCurrentUser && (
            <span className="ml-1">✓</span>
          )}
        </div>
      </div>
    </div>
  );
} 