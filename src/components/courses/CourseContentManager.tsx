'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { VideoPlayer } from '@/components/common/VideoPlayer';

interface VideoContent {
  id: string;
  title: string;
  youtubeUrl: string;
  releaseDate: string;
  releaseTime: string;
  order: number;
}

interface CourseContentManagerProps {
  courseId: string;
  contents: VideoContent[];
  onSave: (contents: VideoContent[]) => Promise<void>;
}

export function CourseContentManager({ courseId, contents, onSave }: CourseContentManagerProps) {
  console.log('CourseContentManager - contents:', contents); // Debug

  const [contentsState, setContents] = useState<VideoContent[]>(contents);
  const [saving, setSaving] = useState(false);
  const [videoErrors, setVideoErrors] = useState<{[key: string]: any}>({});
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
    visible: boolean;
  } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setContents(contents);
    console.log('CourseContentManager - useEffect - Conteúdos atualizados via props:', contents);
    console.log('CourseContentManager - useEffect - Quantidade de conteúdos:', contents.length);
  }, [contents]);

  // Detectar mudanças não salvas
  useEffect(() => {
    // Verificar se o conteúdo atual é diferente do conteúdo original
    if (JSON.stringify(contents) !== JSON.stringify(contentsState)) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [contents, contentsState]);

  // Aviso de confirmação ao sair da página com alterações não salvas
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // Mensagem padrão de confirmação (o texto exato é controlado pelo navegador)
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Efeito para esconder a notificação após 5 segundos
  useEffect(() => {
    if (notification?.visible) {
      const timer = setTimeout(() => {
        setNotification(prev => prev ? { ...prev, visible: false } : null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const addNewContent = () => {
    const newContent: VideoContent = {
      id: `temp_${Date.now()}`,
      title: '',
      youtubeUrl: '',
      releaseDate: '',
      releaseTime: '',
      order: contentsState.length + 1
    };

    setContents([...contentsState, newContent]);
  };

  const updateContent = (index: number, field: keyof VideoContent, value: string) => {
    const updatedContents = [...contentsState];
    updatedContents[index] = {
      ...updatedContents[index],
      [field]: value
    };
    setContents(updatedContents);
  };

  const removeContent = (index: number) => {
    const updatedContents = contentsState.filter((_, i) => i !== index);
    // Reordenar após remoção
    const reorderedContents = updatedContents.map((content, i) => ({
      ...content,
      order: i + 1
    }));
    setContents(reorderedContents);
  };

  const handleSave = async () => {
    // Limpar notificações anteriores
    setNotification(null);
    
    // Verificar se todos os campos estão preenchidos
    const emptyFields = contentsState.some(content => 
      !content.title.trim() || !content.youtubeUrl.trim()
    );
    
    if (emptyFields) {
      setNotification({
        type: 'error',
        message: 'Preencha todos os campos de título e URL do YouTube antes de salvar.',
        visible: true
      });
      return;
    }
    
    console.log('CourseContentManager - handleSave - Iniciando salvamento');
    console.log('CourseContentManager - handleSave - Conteúdos:', contentsState);
    
    setSaving(true);
    try {
      await onSave(contentsState);
      
      // Rolar para o topo para garantir que a notificação seja visível
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Mensagem personalizada baseada na quantidade de vídeos
      let successMessage = '';
      if (contentsState.length === 0) {
        successMessage = 'Todos os vídeos foram removidos com sucesso!';
      } else {
        successMessage = `${contentsState.length} vídeo${contentsState.length !== 1 ? 's' : ''} salvo${contentsState.length !== 1 ? 's' : ''} com sucesso!`;
      }
      
      setNotification({
        type: 'success',
        message: successMessage,
        visible: true
      });
      
      // Marcar como sem alterações não salvas após salvar com sucesso
      setHasUnsavedChanges(false);
      
      console.log('CourseContentManager - handleSave - Salvamento concluído com sucesso');
    } catch (error) {
      console.error('CourseContentManager - handleSave - Erro ao salvar:', error);
      setNotification({
        type: 'error',
        message: 'Erro ao salvar conteúdos. Tente novamente.',
        visible: true
      });
    } finally {
      setSaving(false);
    }
  };

  const handleVideoError = (contentId: string, error: any) => {
    console.error(`Erro no preview do vídeo ${contentId}:`, error);
    setVideoErrors(prev => ({
      ...prev,
      [contentId]: error
    }));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Conteúdo do Curso
        </h3>
        <Button
          onClick={addNewContent}
          variant="secondary"
          className="flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-1" />
          Adicionar Vídeo
        </Button>
      </div>

      {/* Indicador de alterações não salvas */}
      {hasUnsavedChanges && !notification?.visible && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Você tem alterações não salvas. Clique em "Salvar Conteúdo" para salvá-las.</span>
          </div>
        </div>
      )}

      {/* Notificação de sucesso ou erro */}
      {notification?.visible && (
        <div 
          className={`mb-4 p-4 rounded-lg flex items-center justify-between shadow-md ${
            notification.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' 
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}
        >
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Lista de vídeos */}
      <div className="flex-1 -mr-2 pr-2">
        {contentsState.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-3">
              Nenhum vídeo adicionado ainda.
            </p>
            <Button
              onClick={addNewContent}
              variant="secondary"
              className="inline-flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-1" />
              Adicionar Primeiro Vídeo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {contentsState.map((content, index) => (
              <div 
                key={content.id} 
                className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 grid grid-cols-1 gap-4">
                    <Input
                      label="Título do Vídeo"
                      value={content.title}
                      onChange={(e) => updateContent(index, 'title', e.target.value)}
                      required
                    />
                    <Input
                      label="URL do YouTube"
                      value={content.youtubeUrl}
                      onChange={(e) => updateContent(index, 'youtubeUrl', e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      required
                    />
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Disponibilidade
                      </label>
                      <div className="flex items-center space-x-4">
                        <Input
                          type="date"
                          label="Data de Liberação (opcional)"
                          value={content.releaseDate}
                          onChange={(e) => updateContent(index, 'releaseDate', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="time"
                          label="Hora de Liberação (opcional)"
                          value={content.releaseTime}
                          onChange={(e) => updateContent(index, 'releaseTime', e.target.value)}
                          className="flex-1"
                          disabled={!content.releaseDate}
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {!content.releaseDate 
                          ? "Vídeo sempre disponível" 
                          : !content.releaseTime 
                            ? "Disponível a partir do início do dia"
                            : "Disponível a partir do horário especificado"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeContent(index)}
                    className="ml-4 p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Remover vídeo"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Preview do vídeo se URL for válida */}
                {content.youtubeUrl && (
                  <div className="mt-4">
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <VideoPlayer 
                        videoId={content.youtubeUrl}
                        title={content.title || "Preview do vídeo"}
                        onError={(error) => handleVideoError(content.id, error)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {contentsState.length > 0 && (
        <div className="flex justify-end pt-4 mt-4 sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t dark:border-gray-700 shadow-md">
          <Button
            onClick={handleSave}
            isLoading={saving}
            variant={hasUnsavedChanges ? "primary" : "secondary"}
            className={`px-6 ${hasUnsavedChanges ? 'animate-pulse bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800' : ''}`}
          >
            {saving ? 'Salvando...' : hasUnsavedChanges ? '💾 Salvar Alterações' : 'Salvar Conteúdo'}
          </Button>
        </div>
      )}
    </div>
  );
}

// Função auxiliar para extrair o ID do vídeo do YouTube
function getYouTubeVideoId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
} 