'use client';

import { useState } from 'react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { SelectInput } from '@/components/common/SelectInput';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Course } from '@/types/course';
import Image from 'next/image';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (courseData: any) => Promise<void>;
  initialData?: Course | null;
}

export function CourseModal({ isOpen, onClose, onSubmit, initialData }: CourseModalProps) {
  const [formData, setFormData] = useState({
    title: initialData?.fields.title || '',
    description: initialData?.fields.description || '',
    price: initialData?.fields.price ? initialData.fields.price.toString() : '0',
    level: initialData?.fields.level || 'beginner',
    status: initialData?.fields.status || 'draft',
    what_will_learn: initialData?.fields.what_will_learn || '',
    requirements: initialData?.fields.requirements || ''
  });
  
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData?.fields.thumbnail || null
  );
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnail(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const courseData = {
        ...formData,
        price: parseFloat(formData.price),
        thumbnail
      };
      
      await onSubmit(courseData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar curso:', error);
      setError(error instanceof Error ? error.message : 'Ocorreu um erro ao salvar o curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialData ? 'Editar Curso' : 'Adicionar Curso'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Título do Curso"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Preço (R$)"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                required
              />

              <SelectInput
                label="Nível"
                name="level"
                value={formData.level}
                onChange={handleChange}
                options={[
                  { value: 'beginner', label: 'Iniciante' },
                  { value: 'intermediate', label: 'Intermediário' },
                  { value: 'advanced', label: 'Avançado' }
                ]}
              />
            </div>

            <SelectInput
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'draft', label: 'Rascunho' },
                { value: 'review', label: 'Em Revisão' },
                { value: 'published', label: 'Publicado' },
                { value: 'archived', label: 'Arquivado' }
              ]}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                O que irá aprender
              </label>
              <textarea
                name="what_will_learn"
                value={formData.what_will_learn}
                onChange={handleChange}
                rows={3}
                placeholder="Separe os itens por vírgula"
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Separe os itens por vírgula</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pré-requisitos
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={3}
                placeholder="Separe os itens por vírgula"
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Separe os itens por vírgula</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagem de Capa
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              
              {thumbnailPreview && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Preview:</p>
                  <div className="relative h-40 w-full max-w-md">
                    <Image 
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={loading}
            >
              {initialData ? 'Atualizar' : 'Criar'} Curso
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 