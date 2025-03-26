'use client';

import { useState, useEffect } from 'react';
import { Professor } from '@/types/course';
import { getProfessors } from '@/services/firebase-professors';
import { getUsersByRole } from '@/services/firebase';
import { createConversation, findConversationBetweenUsers } from '@/services/firebase-messages';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface NewMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  isTeacher: boolean;
}

interface Recipient {
  id: string;
  name: string;
  email?: string;
  courseId?: string;
  courseTitle?: string;
}

export function NewMessageDialog({ 
  isOpen, 
  onClose, 
  userId,
  userName,
  isTeacher
}: NewMessageDialogProps) {
  const router = useRouter();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      loadRecipients();
    }
  }, [isOpen, isTeacher]);
  
  const loadRecipients = async () => {
    try {
      setLoadingRecipients(true);
      
      // Se for professor, carregar alunos
      // Se for aluno, carregar professores
      if (isTeacher) {
        const students = await getUsersByRole('aluno');
        setRecipients(students.map(student => ({
          id: student.id,
          name: student.fields.name || student.fields.email || 'Aluno',
          email: student.fields.email
        })));
      } else {
        const professors = await getProfessors();
        setRecipients(professors.map(professor => ({
          id: professor.id,
          name: professor.fields.name || professor.fields.email || 'Professor',
          email: professor.fields.email
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar destinatários:', error);
      toast.error('Não foi possível carregar a lista de destinatários.');
    } finally {
      setLoadingRecipients(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!selectedRecipient || !message.trim()) {
      toast.error('Selecione um destinatário e digite uma mensagem');
      return;
    }
    
    try {
      setLoading(true);
      
      const recipient = recipients.find(r => r.id === selectedRecipient);
      if (!recipient) {
        throw new Error('Destinatário não encontrado');
      }
      
      // Verificar se já existe uma conversa entre os usuários
      const existingConversation = await findConversationBetweenUsers([userId, recipient.id]);
      
      if (existingConversation) {
        router.push(`/messages?id=${existingConversation.id}`);
        onClose();
        return;
      }
      
      // Criar uma nova conversa
      const conversation = await createConversation({
        participants: [userId, recipient.id],
        participant_names: {
          [userId]: userName,
          [recipient.id]: recipient.name
        },
        course_id: recipient.courseId,
        course_title: recipient.courseTitle,
        initial_message: message
      });
      
      toast.success('Mensagem enviada com sucesso!');
      router.push(`/messages?id=${conversation.id}`);
      
      // Resetar formulário
      setSelectedRecipient('');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Não foi possível enviar a mensagem. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Nova Mensagem"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isTeacher ? 'Aluno' : 'Professor'}
          </label>
          {loadingRecipients ? (
            <div className="h-10 flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">
                Carregando...
              </span>
            </div>
          ) : recipients.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Nenhum {isTeacher ? 'aluno' : 'professor'} encontrado.
            </p>
          ) : (
            <select
              id="recipient"
              className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={selectedRecipient}
              onChange={(e) => setSelectedRecipient(e.target.value)}
            >
              <option value="">Selecione um {isTeacher ? 'aluno' : 'professor'}</option>
              {recipients.map((recipient) => (
                <option key={recipient.id} value={recipient.id}>
                  {recipient.name}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mensagem
          </label>
          <textarea
            id="message"
            rows={4}
            className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSendMessage}
            isLoading={loading}
            disabled={loading || !selectedRecipient || !message.trim()}
          >
            Enviar
          </Button>
        </div>
      </div>
    </Modal>
  );
} 