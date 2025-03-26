'use client';

import { useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { toast } from 'react-hot-toast';
import { createConversation, findConversationBetweenUsers } from '@/services/firebase-messages';
import { Modal } from '@/components/common/Modal';

interface NewConversationButtonProps {
  userId: string;
  userName: string;
  recipientId: string;
  recipientName: string;
  courseId?: string;
  courseTitle?: string;
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

export function NewConversationButton({
  userId,
  userName,
  recipientId,
  recipientName,
  courseId,
  courseTitle,
  buttonText = 'Enviar Mensagem',
  className,
  variant = 'default',
  size,
  children,
}: NewConversationButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setInitialMessage('');
  };
  
  const handleSendMessage = async () => {
    if (!initialMessage.trim()) {
      toast.error('Por favor, digite uma mensagem');
      return;
    }
    
    try {
      setLoading(true);
      
      // Verificar se já existe uma conversa entre os usuários
      const existingConversation = await findConversationBetweenUsers([userId, recipientId]);
      
      if (existingConversation) {
        // Se já existe, adicionar a mensagem à conversa existente
        router.push(`/messages?id=${existingConversation.id}`);
        handleCloseModal();
        return;
      }
      
      // Criar a conversa
      const conversation = await createConversation({
        participants: [userId, recipientId],
        participant_names: {
          [userId]: userName,
          [recipientId]: recipientName
        },
        course_id: courseId,
        course_title: courseTitle,
        initial_message: initialMessage
      });
      
      toast.success('Mensagem enviada com sucesso!');
      router.push(`/messages?id=${conversation.id}`);
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      toast.error('Não foi possível enviar a mensagem. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Button 
        onClick={handleOpenModal} 
        className={className}
        variant={variant}
        size={size}
      >
        {children || buttonText}
      </Button>
      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Mensagem para ${recipientName}`}>
        <div className="space-y-4">
          {courseTitle && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Curso: <span className="font-medium text-gray-900 dark:text-gray-200">{courseTitle}</span>
              </p>
            </div>
          )}
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mensagem
            </label>
            <textarea
              id="message"
              rows={4}
              className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Digite sua mensagem..."
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-3">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendMessage}
              isLoading={loading}
              disabled={loading || !initialMessage.trim()}
            >
              Enviar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
} 