'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ImageUpload } from '@/components/common/ImageUpload';
import { CourseContentManager } from './CourseContentManager';
import { getCourseContents, updateCourseContents } from '@/services/firebase-course-contents';
import { EyeIcon, EyeSlashIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { VideoContent, PaymentType, RecurrenceInterval } from '@/types/course';

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
      category?: string;
      level: string;
      status: string;
      thumbnail?: string;
      paymentType?: PaymentType;
      recurrenceInterval?: RecurrenceInterval;
      installments?: boolean;
      installmentCount?: number;
      professor_id?: string;
    };
  };
}

export function EditCourseModal({ isOpen, onClose, onSave, course }: EditCourseModalProps) {
  console.log('EditCourseModal - Inicializando com dados do curso:', course);
  console.log('EditCourseModal - Campos de pagamento do curso:', {
    paymentType: course.fields.paymentType,
    recurrenceInterval: course.fields.recurrenceInterval,
    installments: course.fields.installments,
    installmentCount: course.fields.installmentCount
  });
  
  const [formData, setFormData] = useState({
    title: course.fields.title,
    description: course.fields.description,
    price: course.fields.price.toString(),
    category: course.fields.category || '',
    level: course.fields.level,
    status: course.fields.status,
    paymentType: course.fields.paymentType || 'one_time' as PaymentType,
    recurrenceInterval: course.fields.recurrenceInterval as RecurrenceInterval | undefined,
    installments: course.fields.installments || false,
    installmentCount: course.fields.installmentCount || 2
  });
  
  console.log('EditCourseModal - Estado formData inicializado:', formData);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [contents, setContents] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'content'>('info');

  useEffect(() => {
    // Carregar conteúdos do curso quando o modal for aberto
    if (isOpen) {
      loadCourseContents();
    }
  }, [isOpen, course.id]);

  const loadCourseContents = async () => {
    try {
      console.log('EditCourseModal - loadCourseContents - Carregando conteúdos para o curso:', course.id);
      
      const courseContents = await getCourseContents(course.id);
      console.log('EditCourseModal - loadCourseContents - Conteúdos carregados:', courseContents);
      console.log('EditCourseModal - loadCourseContents - Quantidade de conteúdos:', courseContents.length);
      
      setContents(courseContents);
    } catch (error) {
      console.error('Erro ao carregar conteúdos do curso:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => {
        const newState = { ...prev, [name]: checked };
        console.log(`EditCourseModal - handleChange - Campo ${name} atualizado para:`, checked);
        console.log('EditCourseModal - handleChange - Novo estado:', newState);
        return newState;
      });
    } else {
      setFormData(prev => {
        const newState = { ...prev, [name]: value };
        console.log(`EditCourseModal - handleChange - Campo ${name} atualizado para:`, value);
        console.log('EditCourseModal - handleChange - Novo estado:', newState);
        return newState;
      });
    }
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validar preço
      const priceNumber = Number(formData.price);
      if (isNaN(priceNumber) || priceNumber < 0) {
        throw new Error('Preço inválido');
      }

      console.log('EditCourseModal - handleSubmit - Dados do formulário:', formData);
      console.log('EditCourseModal - handleSubmit - Conteúdos a serem salvos:', contents);

      const courseData = {
        id: course.id,
        title: formData.title,
        description: formData.description,
        price: formData.price.toString(),
        category: formData.category,
        level: formData.level,
        status: formData.status,
        thumbnail: selectedImage,
        professor_id: course.fields.professor_id || '',
        paymentType: formData.paymentType,
        ...(formData.paymentType === 'recurring' ? { 
          recurrenceInterval: formData.recurrenceInterval 
        } : {}),
        ...(formData.paymentType === 'one_time' ? {
          installments: formData.installments,
          installmentCount: formData.installments ? formData.installmentCount : undefined
        } : {})
      };

      console.log('EditCourseModal - handleSubmit - Dados do curso a serem enviados:', courseData);

      // Primeiro, atualizar o curso
      await onSave(courseData);
      console.log('EditCourseModal - handleSubmit - Curso atualizado com sucesso');
      
      // Depois, atualizar os conteúdos do curso
      console.log('EditCourseModal - handleSubmit - Atualizando conteúdos do curso:', contents);
      try {
        await updateCourseContents(course.id, contents);
        console.log('EditCourseModal - handleSubmit - Conteúdos atualizados com sucesso');
      } catch (contentError) {
        console.error('EditCourseModal - handleSubmit - Erro ao atualizar conteúdos:', contentError);
        setError('Curso atualizado, mas houve um erro ao salvar os conteúdos.');
        // Não fechar o modal em caso de erro nos conteúdos
        setLoading(false);
        return;
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
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

  const handleSaveContents = async (newContents: VideoContent[]): Promise<void> => {
    console.log('EditCourseModal - handleSaveContents chamado com:', JSON.stringify(newContents, null, 2));
    console.log('ID do curso:', course.id);
    try {
      await updateCourseContents(course.id, newContents);
      console.log('EditCourseModal - Conteúdos salvos com sucesso');
      
      // Recarregar os conteúdos para garantir que o estado esteja atualizado
      await loadCourseContents();
    } catch (error) {
      console.error('EditCourseModal - Erro ao salvar conteúdos:', error);
      throw error;
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
                Editar Curso
              </Dialog.Title>
            </div>

            {/* Banner de Mentoria */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <div className="flex-1 pr-6">
                <h3 className="text-xl font-bold mb-2">Precisa de apoio na sua jornada?</h3>
                <p className="text-sm mb-4 opacity-80">
                  Solicite o acompanhamento de um mentor especializado para impulsionar seus conteúdos e alcançar melhores resultados na plataforma.
                </p>
                <button 
                  type="button" 
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Solicitar Mentoria
                </button>
              </div>
              <div className="w-1/3 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 200 200" 
                  className="w-full h-auto text-white opacity-20"
                  fill="currentColor"
                >
                  <path d="M100 20a80 80 0 1 0 0 160 80 80 0 1 0 0-160zm0 140a60 60 0 1 1 0-120 60 60 0 1 1 0 120zm-10-85a10 10 0 1 0 20 0 10 10 0 1 0-20 0zm0 50a10 10 0 1 0 20 0 10 10 0 1 0-20 0z"/>
                </svg>
              </div>
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
                            onClick={() => setFormData(prev => ({ ...prev, status }))}
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

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
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
              <div className="w-[450px] border-l dark:border-gray-700 overflow-y-auto">
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