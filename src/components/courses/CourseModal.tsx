'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ImageUpload } from '@/components/common/ImageUpload';
import { useAuthContext } from '@/contexts/AuthContext';
import { CreateCourseData, CourseLevel, CourseStatus } from '@/types/course';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (courseData: CreateCourseData) => Promise<void>;
}

const levelOptions = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' }
];

const statusOptions = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'published', label: 'Publicado' },
  { value: 'archived', label: 'Arquivado' }
];

export function CourseModal({ isOpen, onClose, onSave }: CourseModalProps) {
  const { airtableUser } = useAuthContext();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    level: 'beginner' as CourseLevel,
    status: 'draft' as CourseStatus,
    thumbnail: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!airtableUser) {
      setError('Usuário não autenticado');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      const price = formData.get('price') as string;

      // Validar preço
      const priceNumber = Number(price);
      if (isNaN(priceNumber) || priceNumber < 0) {
        throw new Error('Preço inválido');
      }

      // Pegar os valores dos campos de texto e dividir por linha
      const whatWillLearn = (formData.get('what_will_learn') as string || '')
        .split('\n')
        .filter(item => item.trim())
        .map(item => item.trim());

      const requirements = (formData.get('requirements') as string || '')
        .split('\n')
        .filter(item => item.trim())
        .map(item => item.trim());

      // Validar campos obrigatórios
      if (whatWillLearn.length === 0) {
        throw new Error('Adicione pelo menos um item em "O que vai aprender"');
      }

      if (requirements.length === 0) {
        throw new Error('Adicione pelo menos um pré-requisito');
      }

      const courseData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        price: priceNumber,
        level: formData.get('level') as CourseLevel,
        status: 'draft' as CourseStatus,
        thumbnail: formData.get('thumbnail') as File | null,
        what_will_learn: whatWillLearn,
        requirements: requirements,
        professor_id: airtableUser.id
      };

      await onSave(courseData);
      onClose();
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      setError(error instanceof Error ? error.message : 'Erro ao criar curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl my-8">
          <div className="p-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900 mb-6">
              Novo Curso
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
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
                </div>

                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Nível
                    </label>
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    >
                      {levelOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Thumbnail
                    </label>
                    <ImageUpload
                      onImageSelect={handleImageSelect}
                      className="w-full aspect-video"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    O que vai aprender
                  </label>
                  <textarea
                    name="what_will_learn"
                    rows={4}
                    placeholder="Digite cada item em uma linha"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Pré-requisitos
                  </label>
                  <textarea
                    name="requirements"
                    rows={4}
                    placeholder="Digite cada item em uma linha"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" isLoading={loading}>
                  Criar Curso
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 