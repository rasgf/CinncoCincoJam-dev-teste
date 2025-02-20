'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { VideoUpload } from './VideoUpload';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lessonData: any) => Promise<void>;
  courseId: string;
  initialData?: {
    id?: string;
    title: string;
    description: string;
    video_url?: string;
    duration?: number;
    order: number;
  };
}

export function LessonModal({ isOpen, onClose, onSave, courseId, initialData }: LessonModalProps) {
  const [formData, setFormData] = useState(initialData || {
    title: '',
    description: '',
    video_url: '',
    duration: 0,
    order: 0
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleVideoUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      video_url: url
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl w-full bg-white rounded-lg shadow-xl">
          <div className="p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              {initialData ? 'Editar Aula' : 'Nova Aula'}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Título"
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
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              <Input
                label="Duração (minutos)"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleChange}
                required
              />

              <Input
                label="Ordem"
                name="order"
                type="number"
                value={formData.order}
                onChange={handleChange}
                required
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Vídeo
                </label>
                {formData.video_url ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Vídeo carregado</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, video_url: '' }))}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <VideoUpload
                    courseId={courseId}
                    onUploadComplete={handleVideoUpload}
                  />
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" isLoading={loading}>
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 