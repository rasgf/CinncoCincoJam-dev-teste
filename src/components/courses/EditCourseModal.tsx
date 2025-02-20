'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ImageUpload } from '@/components/common/ImageUpload';
import { CourseContentManager } from './CourseContentManager';
import { getCourseContents, updateCourseContents } from '@/services/courseContents';
import { EyeIcon, EyeSlashIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { VideoContent } from '@/types/course';

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (courseData: any) => Promise<void>;
  course: {
    id: string;
    fields: {
      title: string;
      description: string;
      price: number;
      category: string;
      level: string;
      status: string;
      thumbnail?: string;
    };
  };
}

export function EditCourseModal({ isOpen, onClose, onSave, course }: EditCourseModalProps) {
  const [formData, setFormData] = useState({
    title: course.fields.title,
    description: course.fields.description,
    price: course.fields.price.toString(),
    level: course.fields.level,
    status: course.fields.status,
    thumbnail: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contents, setContents] = useState<VideoContent[]>([]);

  // Carregar conteúdos quando o modal abrir
  useEffect(() => {
    const loadContents = async () => {
      try {
        console.log('Carregando conteúdos para o curso:', course.id); // Debug
        const data = await getCourseContents(course.id);
        console.log('Conteúdos carregados:', data); // Debug
        setContents(data);
      } catch (error) {
        console.error('Erro ao carregar conteúdos:', error);
        setError('Erro ao carregar conteúdos do curso');
      }
    };

    if (isOpen) {
      loadContents();
    }
  }, [isOpen, course.id]);

  const handleSaveContents = async (newContents: VideoContent[]) => {
    try {
      await updateCourseContents(course.id, newContents);
      // setContents(newContents);
      alert('Conteúdo salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar conteúdos:', error);
      throw error;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImageSelect = (file: File) => {
    setFormData(prev => ({
      ...prev,
      thumbnail: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSave({ ...formData, id: course.id });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar curso:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar curso');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'published':
        return {
          icon: EyeIcon,
          text: 'Publicado',
          description: 'O curso está visível para todos',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'draft':
        return {
          icon: EyeSlashIcon,
          text: 'Rascunho',
          description: 'O curso está visível apenas para você',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'archived':
        return {
          icon: ArchiveBoxIcon,
          text: 'Arquivado',
          description: 'O curso está oculto para todos',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-[1200px] bg-white rounded-lg shadow-xl">
            {/* Header */}
            <div className="border-b px-6 py-4">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Editar Curso
              </Dialog.Title>
            </div>

            {/* Content */}
            <div className="flex max-h-[calc(100vh-200px)] overflow-hidden">
              {/* Formulário do Curso */}
              <div className="flex-1 min-w-[400px] p-6 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <Input
                    label="Título do curso"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Descrição
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <Input
                    label="Preço"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />

                  {/* Status do Curso */}
                  <div className="space-y-4">
                    <label className="block text-lg font-medium text-gray-900">
                      Status do Curso
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['draft', 'published', 'archived'].map(status => {
                        const info = getStatusInfo(status);
                        if (!info) return null;
                        const Icon = info.icon;

                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, status }))}
                            className={`p-4 rounded-lg border ${
                              formData.status === status 
                                ? `${info.borderColor} ${info.bgColor} ring-2 ring-blue-500`
                                : 'border-gray-200 hover:border-gray-300'
                            } text-left transition-all`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-5 h-5 ${info.color}`} />
                              <span className={`font-medium ${info.color}`}>
                                {info.text}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              {info.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Thumbnail
                    </label>
                    <ImageUpload
                      currentImage={course.fields.thumbnail}
                      onImageSelect={handleImageSelect}
                      className="w-full aspect-video"
                    />
                  </div>
                </form>
              </div>

              {/* Lista de Vídeos */}
              <div className="w-[450px] border-l overflow-y-auto">
                <div className="p-6">
                  <CourseContentManager
                    courseId={course.id}
                    contents={contents}
                    onSave={handleSaveContents}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => document.querySelector('form')?.requestSubmit()}
                  isLoading={loading}
                >
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
} 