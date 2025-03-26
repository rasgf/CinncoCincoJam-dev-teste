'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { getCourseById, updateCourse } from '@/services/firebase-courses';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ProxyImage } from '@/components/common/ProxyImage';
import { RatingComments } from '@/components/courses/RatingComments';
import { getCourseAverageRating } from '@/services/firebase-ratings';
import { StarRating } from '@/components/common/StarRating';
import { Course } from '@/types/course';
import Link from 'next/link';
import { ChevronLeftIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/common/Input';
import { toast } from 'react-hot-toast';

export default function CourseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { airtableUser } = useAuthContext();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [courseRating, setCourseRating] = useState({ average: 0, count: 0 });
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseDate, setReleaseDate] = useState("");
  const [releaseTime, setReleaseTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!airtableUser) return;
    
    const loadCourse = async () => {
      try {
        setLoading(true);
        const courseData = await getCourseById(id as string);
        
        // Verificar se o curso pertence ao professor atual
        if (courseData.fields.professor_id !== airtableUser.id && airtableUser?.fields.role !== 'admin') {
          // Redirecionar se não for o dono do curso
          router.push('/profile/courses');
          return;
        }
        
        setCourse(courseData);
        
        // Carregar avaliações
        const ratingData = await getCourseAverageRating(id as string);
        setCourseRating(ratingData);
      } catch (error) {
        console.error('Erro ao carregar curso:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [id, airtableUser, router]);

  const getWhatWillLearn = (items?: string | string[]): string[] => {
    if (!items) return [];
    if (typeof items === 'string') return items.split(',');
    return items;
  };

  const handleShowReleaseModal = () => {
    if (course) {
      setReleaseDate(course.fields.releaseDate || "");
      setReleaseTime(course.fields.releaseTime || "");
    }
    setShowReleaseModal(true);
  };

  const handleSaveRelease = async () => {
    if (!course) return;
    
    try {
      setSaving(true);
      
      // Preparar os dados a serem atualizados
      const updateData = {
        releaseDate,
        releaseTime
      };
      
      // Atualizar o curso
      await updateCourse(id as string, updateData);
      
      // Atualizar o curso local
      setCourse({
        ...course,
        fields: {
          ...course.fields,
          releaseDate,
          releaseTime
        }
      });
      
      setShowReleaseModal(false);
      toast.success("Programação de lançamento salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar programação:", error);
      toast.error("Erro ao salvar programação. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearRelease = async () => {
    if (!course) return;
    
    try {
      setSaving(true);
      
      // Preparar os dados a serem atualizados
      const updateData = {
        releaseDate: "",
        releaseTime: ""
      };
      
      // Atualizar o curso
      await updateCourse(id as string, updateData);
      
      // Atualizar o curso local
      setCourse({
        ...course,
        fields: {
          ...course.fields,
          releaseDate: "",
          releaseTime: ""
        }
      });
      
      setReleaseDate("");
      setReleaseTime("");
      setShowReleaseModal(false);
      toast.success("Programação de lançamento removida com sucesso!");
    } catch (error) {
      console.error("Erro ao remover programação:", error);
      toast.error("Erro ao remover programação. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
        <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2"></div>
        <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6 mb-6"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          </div>
          <div>
            <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">Curso não encontrado.</p>
        <Link href="/profile/courses" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          Voltar para meus cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link 
          href="/profile/courses" 
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Voltar para meus cursos
        </Link>
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {course.fields.title}
        </h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <StarRating initialRating={courseRating.average} readOnly size="sm" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {courseRating.average.toFixed(1)} ({courseRating.count} {courseRating.count === 1 ? 'avaliação' : 'avaliações'})
            </span>
          </div>
          <span className="text-gray-500 dark:text-gray-400">|</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Status: <span className="font-medium">{course.fields.status === 'published' ? 'Publicado' : 'Rascunho'}</span>
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Detalhes do Curso
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">{course.fields.description}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">O que os alunos aprenderão</h3>
                  <ul className="mt-1 space-y-1">
                    {getWhatWillLearn(course.fields.what_will_learn).map((item, index) => (
                      <li key={index} className="flex text-gray-600 dark:text-gray-400">
                        <span className="mr-2">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {course.fields.requirements && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Pré-requisitos</h3>
                    <ul className="mt-1 space-y-1">
                      {getWhatWillLearn(course.fields.requirements).map((item, index) => (
                        <li key={index} className="flex text-gray-600 dark:text-gray-400">
                          <span className="mr-2">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Conteúdo do Curso
              </h2>
              <div className="flex justify-between items-center">
                <div className="text-gray-600 dark:text-gray-400">
                  Gerencie as aulas do seu curso
                </div>
                <Link href={`/profile/courses/content/${id}`}>
                  <Button size="sm">
                    Editar Curso
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Programação de Lançamento
              </h2>
              <div className="space-y-4">
                {course?.fields.releaseDate ? (
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-blue-700 dark:text-blue-300 font-medium">
                        Lançamento programado para: {new Date(`${course.fields.releaseDate}T${course.fields.releaseTime || '00:00'}`).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      O curso só estará disponível para os alunos matriculados a partir desta data.
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    Seu curso está disponível imediatamente para alunos matriculados.
                  </p>
                )}
                
                <Button 
                  onClick={handleShowReleaseModal}
                  variant="outline"
                  size="sm"
                >
                  {course?.fields.releaseDate ? "Alterar programação" : "Programar lançamento"}
                </Button>
              </div>
            </div>
          </Card>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Avaliações e Comentários
            </h2>
            <RatingComments courseId={id as string} showExpanded={true} />
          </div>
        </div>
        
        <div>
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Informações do Curso
              </h2>
              <div className="space-y-4">
                <div>
                  {course.fields.thumbnail ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <ProxyImage
                        src={course.fields.thumbnail}
                        alt={course.fields.title}
                        width={400}
                        height={225}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500">Sem imagem</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-sm text-gray-500 dark:text-gray-400">Preço</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {course.fields.price ? `R$ ${course.fields.price.toFixed(2)}` : 'Gratuito'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="block text-sm text-gray-500 dark:text-gray-400">Nível</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {course.fields.level || 'Não especificado'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col space-y-2">
                <Link href={`/courses/${id}`} target="_blank">
                  <Button variant="outline" className="w-full">
                    Ver Página do Curso
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Modal de programação de lançamento */}
      {showReleaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Programar Lançamento
              </h2>
              <button 
                onClick={() => setShowReleaseModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Defina quando seu curso estará disponível para os alunos matriculados. 
                Até esta data, os alunos poderão ver a página do curso, mas não terão acesso ao conteúdo.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    type="date"
                    label="Data de Lançamento"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} // Data mínima é hoje
                  />
                </div>
                <div>
                  <Input
                    type="time"
                    label="Horário"
                    value={releaseTime}
                    onChange={(e) => setReleaseTime(e.target.value)}
                    disabled={!releaseDate}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleSaveRelease}
                isLoading={saving}
                disabled={saving || !releaseDate}
                className="flex-1"
              >
                Salvar
              </Button>
              
              {course?.fields.releaseDate && (
                <Button
                  onClick={handleClearRelease}
                  isLoading={saving}
                  disabled={saving}
                  variant="outline"
                  className="flex-1"
                >
                  Remover Programação
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}