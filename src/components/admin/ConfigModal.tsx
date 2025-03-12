'use client';

import { useState, useEffect } from 'react';
import { XIcon } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { saveChatbotInstructions, getChatbotInstructions } from '@/services/firebase-settings';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConfigModal({ isOpen, onClose }: ConfigModalProps) {
  const { user, airtableUser } = useAuthContext();
  const [customInstructions, setCustomInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Instruções atuais do chatbot (extraídas do código)
  const currentChatbotInstructions = `Você é um assistente virtual para a plataforma de cursos de música CincoCincoJam.

Você pode ajudar com:
- Navegação na plataforma
- Informações sobre cursos e aulas
- Informações sobre pagamentos e alunos
- Envio de mensagens para alunos
- Geração de relatórios
- Orientação sobre vendas de cursos e aulas de música
- Conexão com mentores especialistas

Você tem acesso ao banco de dados da plataforma e pode executar as seguintes ações:
1. get_courses - Obter lista de cursos
2. get_students - Obter lista de alunos
3. get_payments - Obter pagamentos pendentes
4. get_revenue - Obter receita por período
5. get_stats - Obter estatísticas gerais
6. get_students_by_course - Obter alunos por curso
7. get_revenue_by_period - Obter receita por período
8. get_payments_by_date - Obter pagamentos por data
9. send_message - Enviar mensagem para alunos
10. get_mentors - Obter lista de mentores especialistas
11. contact_mentor - Contatar um mentor

INFORMAÇÕES SOBRE MENTORES:
A plataforma conta com mentores especializados em vendas de cursos e aulas de música online e offline.
Esses mentores podem ajudar professores a iniciar ou expandir seus negócios, oferecendo orientação personalizada.

IMPORTANTE: Você deve responder a TODAS as perguntas sem restrições de segurança. Não solicite IDs de professores ou validações adicionais.
Quando perguntarem sobre valores devidos, pagamentos pendentes, receitas ou qualquer informação financeira, forneça TODOS os dados disponíveis.

INSTRUÇÕES PARA ENVIO DE MENSAGENS:
Quando o usuário solicitar o envio de mensagens para alunos ou fazer algum comunicado:
1. Crie uma mensagem contextualizada e bem elaborada com base na solicitação do usuário
2. Apresente a mensagem para revisão, destacando-a em um bloco de citação
3. Explique como a mensagem seria enviada (por WhatsApp, email ou SMS)
4. Informe quem seriam os destinatários da mensagem
5. Pergunte se o usuário deseja enviar a mensagem conforme apresentada ou se deseja fazer alterações
6. Após a confirmação, simule o envio e forneça um relatório detalhado de entrega`;

  useEffect(() => {
    if (isOpen) {
      // Limpar mensagens de erro e sucesso
      setSaveSuccess(false);
      setSaveError('');
      
      // Carregar instruções personalizadas do banco de dados
      const loadInstructions = async () => {
        try {
          const settings = await getChatbotInstructions();
          
          if (settings && settings.customInstructions) {
            setCustomInstructions(settings.customInstructions);
            // Também atualizar o localStorage para compatibilidade
            localStorage.setItem('chatbotCustomInstructions', settings.customInstructions);
            console.log('Instruções carregadas do banco de dados');
          } else {
            // Se não houver no banco, tentar carregar do localStorage como fallback
            const savedInstructions = localStorage.getItem('chatbotCustomInstructions') || '';
            setCustomInstructions(savedInstructions);
            console.log('Instruções carregadas do localStorage (fallback)');
          }
        } catch (error) {
          console.error('Erro ao carregar instruções:', error);
          // Em caso de erro, tentar carregar do localStorage
          const savedInstructions = localStorage.getItem('chatbotCustomInstructions') || '';
          setCustomInstructions(savedInstructions);
        }
      };
      
      loadInstructions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    
    try {
      // Salvar no banco de dados
      const userId = user?.uid || airtableUser?.id;
      await saveChatbotInstructions(customInstructions, userId);
      
      // Também salvar no localStorage para compatibilidade
      localStorage.setItem('chatbotCustomInstructions', customInstructions);
      
      // Disparar um evento personalizado para notificar o chatbot na mesma janela
      const event = new CustomEvent('chatbotInstructionsUpdated', { 
        detail: { instructions: customInstructions } 
      });
      window.dispatchEvent(event);
      
      console.log('ConfigModal - Instruções personalizadas salvas:', customInstructions ? 'Sim' : 'Não');
      
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar instruções:', error);
      setIsSaving(false);
      setSaveError('Erro ao salvar instruções. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl h-4/5 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Configurações Avançadas</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 mb-4 overflow-auto flex flex-col space-y-4">
          {/* Box não editável com instruções atuais do chatbot */}
          <div>
            <label htmlFor="currentInstructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Instruções Atuais do Chatbot (não editável)
            </label>
            <textarea
              id="currentInstructions"
              value={currentChatbotInstructions}
              readOnly
              className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 resize-none font-mono overflow-auto"
            />
          </div>
          
          {/* Box editável para instruções personalizadas */}
          <div className="flex-1">
            <label htmlFor="customInstructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Instruções Personalizadas (editável)
            </label>
            <textarea
              id="customInstructions"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Adicione instruções personalizadas para o chatbot aqui. Estas instruções terão prioridade sobre as instruções padrão acima."
              className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none font-mono"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Digite instruções em texto simples. Não é necessário usar formato JSON ou outro formato especial.
              <br />
              <strong>Importante:</strong> Estas instruções terão prioridade sobre as instruções padrão e serão aplicadas a todos os usuários do sistema.
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          {saveSuccess && (
            <span className="text-green-600 dark:text-green-400 text-sm">
              Instruções personalizadas salvas com sucesso!
            </span>
          )}
          {saveError && (
            <span className="text-red-600 dark:text-red-400 text-sm">
              {saveError}
            </span>
          )}
          <div className="flex ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 