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

  useEffect(() => {
    setContents(contents);
  }, [contents]);

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
    try {
      setSaving(true);
      await onSave(contentsState);
    } catch (error) {
      console.error('Erro ao salvar conteúdos:', error);
      alert('Erro ao salvar conteúdos. Tente novamente.');
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
        <h3 className="text-lg font-medium text-gray-900">
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

      {/* Lista de vídeos */}
      <div className="flex-1 -mr-2 pr-2">
        <div className="space-y-4">
          {contentsState.map((content, index) => (
            <div 
              key={content.id} 
              className="bg-gray-50 p-4 rounded-lg border border-gray-200"
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
                    <label className="block text-sm font-medium text-gray-700">
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
                    <p className="text-sm text-gray-500">
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
                  className="ml-4 p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                  title="Remover vídeo"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Preview do vídeo se URL for válida */}
              {content.youtubeUrl && (
                <div className="mt-4">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
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
      </div>

      {contentsState.length > 0 && (
        <div className="flex justify-end pt-4 mt-4">
          <Button
            onClick={handleSave}
            isLoading={saving}
          >
            Salvar Conteúdo
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