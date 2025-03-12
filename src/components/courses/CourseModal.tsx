'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ImageUpload } from '@/components/common/ImageUpload';
import { useAuthContext } from '@/contexts/AuthContext';
import { CreateCourseData, CourseLevel, CourseStatus, VideoContent, PaymentType, RecurrenceInterval } from '@/types/course';
import { CourseContentManager } from './CourseContentManager';
import { EyeIcon, EyeSlashIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { getCourseContents, updateCourseContents } from '@/services/firebase-course-contents';

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
    price: '0',
    category: '',
    level: 'beginner',
    status: 'draft',
    paymentType: 'one_time' as PaymentType,
    recurrenceInterval: undefined as RecurrenceInterval | undefined,
    installments: false,
    installmentCount: 2
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [contents, setContents] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'content'>('info');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
  };

  const handleSaveContents = async (newContents: VideoContent[]) => {
    console.log('CourseModal - handleSaveContents - Conteúdos recebidos:', JSON.stringify(newContents, null, 2));
    setContents(newContents);
    console.log('CourseModal - handleSaveContents - Conteúdos atualizados no estado');
    return Promise.resolve(); // Será salvo junto com o curso
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log('CourseModal - handleSubmit - Iniciando criação de curso');
    console.log('CourseModal - handleSubmit - Conteúdos a serem incluídos:', JSON.stringify(contents, null, 2));
    
    if (!airtableUser) {
      setError('Usuário não autenticado');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      const price = formData.get('price') as string;
      const paymentType = formData.get('paymentType') as PaymentType;
      const recurrenceInterval = formData.get('recurrenceInterval') as RecurrenceInterval | null;
      const installments = formData.get('installments') === 'on';
      const installmentCount = formData.get('installmentCount') ? Number(formData.get('installmentCount')) : undefined;

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
        level: formData.get('level') as string,
        status: formData.get('status') as string,
        category: formData.get('category') as string,
        thumbnail: selectedImage,
        what_will_learn: whatWillLearn,
        requirements: requirements,
        professor_id: airtableUser.id,
        contents: contents, // Incluir os conteúdos de vídeo
        paymentType,
        // Incluir campos condicionalmente com base no tipo de pagamento
        ...(paymentType === 'recurring' ? { 
          recurrenceInterval: recurrenceInterval || undefined
        } : {}),
        ...(paymentType === 'one_time' ? {
          installments,
          installmentCount: installments ? installmentCount : undefined
        } : {})
      };

      console.log('CourseModal - handleSubmit - Dados do curso a serem enviados:', {
        ...courseData,
        thumbnail: courseData.thumbnail ? 'File object' : null,
        contents: courseData.contents ? `${courseData.contents.length} conteúdos` : 'nenhum conteúdo'
      });

      await onSave(courseData);
      console.log('CourseModal - handleSubmit - Curso criado com sucesso');
      
      onClose();
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      setError(error instanceof Error ? error.message : 'Erro ao criar curso');
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
          <Dialog.Panel className="w-full max-w-[1200px] bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            {/* Header */}
            <div className="border-b dark:border-gray-700 px-6 py-4">
              <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Novo Curso
              </Dialog.Title>
            </div>

            {/* Content */}
            <div className="flex max-h-[calc(100vh-200px)] overflow-hidden">
              {/* Formulário do Curso */}
              <div className="flex-1 min-w-[400px] p-6 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Descrição
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>

                  {/* Preço e Opções de Pagamento */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <Input
                          label="Preço"
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={handleChange}
                          required
                          className="w-full"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          Tipo de Pagamento
                        </label>
                        <select
                          name="paymentType"
                          value={formData.paymentType}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          required
                        >
                          <option value="one_time">Pagamento Único</option>
                          <option value="recurring">Pagamento Recorrente</option>
                        </select>
                      </div>
                    </div>

                    {/* Opções condicionais baseadas no tipo de pagamento */}
                    {formData.paymentType === 'recurring' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          Intervalo de Recorrência
                        </label>
                        <select
                          name="recurrenceInterval"
                          value={formData.recurrenceInterval || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          required
                        >
                          <option value="">Selecione um intervalo</option>
                          <option value="monthly">Mensal</option>
                          <option value="quarterly">Trimestral</option>
                          <option value="biannual">Semestral</option>
                          <option value="annual">Anual</option>
                        </select>
                      </div>
                    )}

                    {formData.paymentType === 'one_time' && (
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="installments"
                            name="installments"
                            checked={formData.installments}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="installments" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                            Permitir parcelamento
                          </label>
                        </div>

                        {formData.installments && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                              Número de Parcelas
                            </label>
                            <select
                              name="installmentCount"
                              value={formData.installmentCount}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              required
                            >
                              {Array.from({ length: 17 }, (_, i) => i + 2).map(num => (
                                <option key={num} value={num}>{num}x</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Input
                    label="Categoria"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="Ex: Programação, Design, Marketing, etc."
                  />

                  {/* Status do Curso */}
                  <div className="space-y-4">
                    <label className="block text-lg font-medium text-gray-900 dark:text-gray-100">
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
                            onClick={() => setFormData(prev => ({ ...prev, status: status as CourseStatus }))}
                            className={`p-4 rounded-lg border ${
                              formData.status === status 
                                ? `${info.borderColor} ${info.bgColor} dark:bg-opacity-10 ring-2 ring-blue-500`
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            } text-left transition-all`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-5 h-5 ${info.color}`} />
                              <span className={`font-medium ${info.color}`}>
                                {info.text}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {info.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      O que vai aprender
                    </label>
                    <textarea
                      name="what_will_learn"
                      rows={4}
                      placeholder="Digite cada item em uma linha"
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Pré-requisitos
                    </label>
                    <textarea
                      name="requirements"
                      rows={4}
                      placeholder="Digite cada item em uma linha"
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Thumbnail
                    </label>
                    <ImageUpload
                      onImageSelect={handleImageSelect}
                      className="w-full aspect-video"
                    />
                  </div>
                </form>
              </div>

              {/* Lista de Vídeos */}
              <div className="w-[450px] border-l dark:border-gray-700 overflow-y-auto">
                <div className="p-6">
                  <CourseContentManager
                    courseId="new"
                    contents={contents}
                    onSave={handleSaveContents}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800">
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
                  Criar Curso
                </Button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
} 