'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuthContext } from '@/contexts/AuthContext';
import { Message } from 'ai/react';
import { Send, X, Maximize2, Minimize2, ExpandIcon, MinimizeIcon } from 'lucide-react';
import { getChatbotInstructions } from '@/services/firebase-settings';

// Nome da plataforma
const PLATFORM_NAME = "CincoCincoJam";

// Componente para exibir sugestões iniciais
const ChatSuggestions = ({ onSuggestionClick }: { onSuggestionClick: (suggestion: string) => void }) => {
  const suggestions = [
    { id: 'courses', text: 'Quais cursos estão disponíveis?' },
    { id: 'payments', text: 'Ver pagamentos pendentes' },
    { id: 'mentor', text: 'Falar com um mentor' },
    { id: 'sell-courses', text: 'Quero vender minhas aulas online' },
    { id: 'stats', text: 'Mostrar estatísticas gerais' }
  ];

  return (
    <div className="flex flex-col space-y-2 p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Como posso ajudar hoje?</p>
      <div className="grid grid-cols-1 gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="text-left px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {suggestion.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export function ChatbotWidget() {
  const { airtableUser } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Log para depuração
  useEffect(() => {
    console.log('ChatbotWidget - Dados do usuário:', airtableUser);
  }, [airtableUser]);
  
  // Carregar instruções personalizadas do banco de dados e localStorage
  useEffect(() => {
    const loadInstructions = async () => {
      setIsLoading(true);
      try {
        // Primeiro tentar carregar do banco de dados
        const settings = await getChatbotInstructions();
        
        if (settings && settings.customInstructions) {
          setCustomInstructions(settings.customInstructions);
          // Também atualizar o localStorage para compatibilidade
          localStorage.setItem('chatbotCustomInstructions', settings.customInstructions);
          console.log('ChatbotWidget - Instruções personalizadas carregadas do banco de dados:', 'Sim');
        } else {
          // Se não houver no banco, tentar carregar do localStorage como fallback
          const savedInstructions = localStorage.getItem('chatbotCustomInstructions') || '';
          setCustomInstructions(savedInstructions);
          console.log('ChatbotWidget - Instruções personalizadas carregadas do localStorage (fallback):', savedInstructions ? 'Sim' : 'Não');
        }
      } catch (error) {
        console.error('Erro ao carregar instruções do chatbot:', error);
        // Em caso de erro, tentar carregar do localStorage
        const savedInstructions = localStorage.getItem('chatbotCustomInstructions') || '';
        setCustomInstructions(savedInstructions);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInstructions();
  }, []);
  
  // Obter o nome do usuário de forma segura
  const userName = airtableUser?.fields?.name || airtableUser?.name || 'Visitante';
  
  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    api: '/api/chat',
    id: 'assistant-chat', // ID único para persistir a conversa
    body: {
      // Passar informações do usuário, da plataforma e instruções personalizadas para a API
      userName: userName,
      platformName: PLATFORM_NAME,
      customInstructions: customInstructions
    },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Olá, ${userName}! Sou o assistente virtual da CincoCincoJam. Como posso ajudar você hoje?`
      }
    ]
  });

  // Rolar para a última mensagem quando novas mensagens são adicionadas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Se o chat estiver fechado e uma nova mensagem for recebida, mostrar indicador
    if (!isOpen && messages.length > 1) {
      setHasNewMessages(true);
    }
  }, [messages, isOpen]);

  // Resetar o indicador de novas mensagens quando o chat for aberto
  useEffect(() => {
    if (isOpen) {
      setHasNewMessages(false);
    }
  }, [isOpen]);

  // Atualizar o chat quando as instruções personalizadas mudarem (evento de storage)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chatbotCustomInstructions') {
        const newInstructions = e.newValue || '';
        console.log('ChatbotWidget - Instruções personalizadas atualizadas via storage:', newInstructions ? 'Sim' : 'Não');
        setCustomInstructions(newInstructions);
        
        // Adicionar mensagem do sistema informando que as instruções foram atualizadas
        setMessages([
          ...messages,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'As instruções do chatbot foram atualizadas. Como posso ajudar você agora?'
          }
        ]);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [messages, setMessages]);

  // Atualizar o chat quando as instruções personalizadas mudarem (evento personalizado)
  useEffect(() => {
    const handleCustomEvent = (e: CustomEvent<{ instructions: string }>) => {
      const newInstructions = e.detail.instructions || '';
      console.log('ChatbotWidget - Instruções personalizadas atualizadas via evento personalizado:', newInstructions ? 'Sim' : 'Não');
      setCustomInstructions(newInstructions);
      
      // Adicionar mensagem do sistema informando que as instruções foram atualizadas
      setMessages([
        ...messages,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'As instruções do chatbot foram atualizadas. Como posso ajudar você agora?'
        }
      ]);
    };
    
    // Adicionar o listener para o evento personalizado
    window.addEventListener('chatbotInstructionsUpdated', handleCustomEvent as EventListener);
    return () => window.removeEventListener('chatbotInstructionsUpdated', handleCustomEvent as EventListener);
  }, [messages, setMessages]);

  // Função para formatar o conteúdo da mensagem
  const formatMessageContent = (content: string) => {
    // Para todas as mensagens, incluindo markdown, apenas quebrar linhas
    // e garantir que o texto seja exibido de forma limpa e legível
    return (
      <div className="whitespace-pre-wrap break-words">
        {content.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < content.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>
    );
  };

  // Determinar as dimensões do chat com base no estado
  const getChatDimensions = () => {
    if (isMinimized) return "h-14";
    if (isExpanded) return "h-[80vh] w-[80vw] max-w-4xl";
    return "h-[500px] w-[350px]";
  };

  // Posição do chat com base no estado expandido
  const getChatPosition = () => {
    if (isExpanded) return "fixed inset-0 m-auto";
    return "fixed bottom-4 right-4";
  };

  // Função para limpar o histórico de conversas
  const clearConversation = () => {
    // Recarregar a página para limpar o estado do chat
    window.location.reload();
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Adiciona a sugestão como mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: suggestion
    };
    
    // Adiciona a mensagem à lista de mensagens
    setMessages([...messages, userMessage]);
    
    // Envia a mensagem diretamente
    const chatRequestOptions = {
      options: {
        body: {
          userName,
          platformName: PLATFORM_NAME,
          customInstructions: customInstructions
        }
      }
    };
    
    handleSubmit(
      { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>,
      chatRequestOptions
    );
  };

  // Alternar entre os modos normal e expandido
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    setIsMinimized(false);
    
    // Rolar para a última mensagem após a expansão
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div 
          className={`${getChatPosition()} ${getChatDimensions()} bg-white dark:bg-gray-900 rounded-lg shadow-lg flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300`}
          style={{ maxHeight: isExpanded ? '80vh' : '500px' }}
        >
          {/* Cabeçalho do chat */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Assistente CincoCincoJam
              {isLoading && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Carregando...)</span>}
            </h3>
            <div className="flex space-x-2">
              {/* Botão de expandir/contrair */}
              <button
                onClick={toggleExpanded}
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                title={isExpanded ? "Contrair chat" : "Expandir chat"}
              >
                {isExpanded ? <MinimizeIcon size={16} /> : <ExpandIcon size={16} />}
              </button>
              
              {/* Botão de minimizar/maximizar */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                title={isMinimized ? "Maximizar" : "Minimizar"}
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              
              {/* Botão de fechar */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                title="Fechar chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          
          {!isMinimized && (
            <>
              {/* Área de mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role !== 'user' && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2">
                        <span className="text-blue-600 dark:text-blue-300 text-xs font-bold">AI</span>
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white rounded-tr-none'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none'
                      } shadow-sm`}
                    >
                      {formatMessageContent(message.content)}
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ml-2">
                        <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
                
                {/* Mostrar sugestões apenas quando não houver mensagens do usuário */}
                {messages.filter(m => m.role === 'user').length === 0 && (
                  <ChatSuggestions onSuggestionClick={handleSuggestionClick} />
                )}
              </div>
              
              {/* Formulário de entrada */}
              <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 py-2 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    disabled={!input.trim() || isLoading}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
            setHasNewMessages(false);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg flex items-center justify-center relative transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          {hasNewMessages && (
            <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-3 h-3 animate-pulse"></span>
          )}
        </button>
      )}
    </div>
  );
} 