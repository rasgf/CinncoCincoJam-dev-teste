'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { Conversation, ConversationWithMessages } from '@/types/message';
import { getUserConversations, getConversationWithMessages } from '@/services/firebase-messages';
import { ConversationItem } from '@/components/messages/ConversationItem';
import { MessagePanel } from '@/components/messages/MessagePanel';
import { EmptyMessageState } from '@/components/messages/EmptyMessageState';
import { NewMessageDialog } from '@/components/messages/NewMessageDialog';
import { toast } from 'react-hot-toast';

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, airtableUser } = useAuthContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  
  // Verificar papel do usuário
  const isTeacher = airtableUser?.fields.role === 'professor';
  
  // Se há um parâmetro conversationId na URL, selecionar essa conversa
  const conversationId = searchParams.get('id');
  
  useEffect(() => {
    if (user) {
      loadConversations();
      
      // Configurar intervalo para atualizar conversas a cada 30 segundos
      const intervalId = setInterval(loadConversations, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [user]);
  
  useEffect(() => {
    if (conversationId) {
      selectConversation(conversationId);
    }
  }, [conversationId, conversations]);
  
  const loadConversations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userConversations = await getUserConversations(user.uid);
      setConversations(userConversations);
      
      // Se não há uma conversa selecionada e há conversas disponíveis, selecionar a primeira
      if (!selectedConversation && userConversations.length > 0 && !conversationId) {
        selectConversation(userConversations[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      toast.error('Não foi possível carregar suas conversas. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  const selectConversation = async (id: string) => {
    try {
      setLoadingConversation(true);
      
      // Atualizar a URL sem recarregar a página
      router.push(`/messages?id=${id}`, { scroll: false });
      
      const conversation = await getConversationWithMessages(id);
      if (conversation) {
        setSelectedConversation(conversation);
      } else {
        toast.error('Conversa não encontrada');
      }
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
      toast.error('Não foi possível carregar a conversa. Tente novamente mais tarde.');
    } finally {
      setLoadingConversation(false);
    }
  };
  
  const handleConversationClick = (id: string) => {
    if (selectedConversation?.id !== id) {
      selectConversation(id);
    }
  };

  const handleOpenNewMessageDialog = () => {
    setShowNewMessageDialog(true);
  };

  const handleCloseNewMessageDialog = () => {
    setShowNewMessageDialog(false);
  };
  
  if (!user || !airtableUser) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Você precisa estar logado para acessar suas mensagens.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Mensagens
        </h1>
        <button
          onClick={handleOpenNewMessageDialog}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 5a1 1 0 012 0v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H6a1 1 0 110-2h5V5z" />
          </svg>
          <span>Nova Mensagem</span>
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-700/20 rounded-lg overflow-hidden min-h-[70vh]">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-[70vh]">
          {/* Lista de conversas */}
          <div className="border-r dark:border-gray-700 overflow-y-auto">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                Conversas
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {conversations.length} {conversations.length === 1 ? 'conversa' : 'conversas'}
              </span>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p>Nenhuma conversa encontrada.</p>
                <p className="text-sm mt-2">
                  Clique em "Nova Mensagem" para iniciar uma conversa.
                </p>
              </div>
            ) : (
              <div className="p-2">
                {conversations.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    currentUserId={user.uid}
                    isSelected={selectedConversation?.id === conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Painel de mensagens */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 h-full flex flex-col">
            {selectedConversation ? (
              loadingConversation ? (
                <div className="flex-1 flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <MessagePanel
                  conversation={selectedConversation}
                  currentUserId={user.uid}
                />
              )
            ) : (
              <div className="flex-1 flex justify-center items-center">
                <EmptyMessageState
                  title="Nenhuma conversa selecionada"
                  message={
                    conversations.length > 0
                      ? "Selecione uma conversa para visualizar as mensagens"
                      : "Você ainda não tem nenhuma conversa. Clique em 'Nova Mensagem' para iniciar."
                  }
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  }
                  action={
                    conversations.length === 0
                      ? { label: "Nova Mensagem", onClick: handleOpenNewMessageDialog }
                      : undefined
                  }
                  isTeacher={isTeacher}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diálogo para nova mensagem */}
      <NewMessageDialog
        isOpen={showNewMessageDialog}
        onClose={handleCloseNewMessageDialog}
        userId={user.uid}
        userName={airtableUser.fields.name || user.email || ''}
        isTeacher={isTeacher}
      />
    </div>
  );
} 