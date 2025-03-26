'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { getCourseById } from '@/services/firebase-courses';
import { getCourseContents, updateCourseContents } from '@/services/firebase-course-contents';
import { CourseContentManager } from '@/components/courses/CourseContentManager';
import { RatingComments } from '@/components/courses/RatingComments';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface VideoContent {
  id: string;
  title: string;
  youtubeUrl: string;
  releaseDate: string;
  releaseTime: string;
  order: number;
}

export default function CourseContentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { airtableUser } = useAuthContext();
  
  const [course, setCourse] = useState<any>(null);
  const [contents, setContents] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (airtableUser) {
      loadCourseAndContents();
    }
  }, [id, airtableUser]);

  const loadCourseAndContents = async () => {
    try {
      setLoading(true);
      const courseData = await getCourseById(id as string);
      setCourse(courseData);
      
      // Verificar se o usuário é o professor do curso ou um admin
      const isTeacher = airtableUser?.id === courseData.fields.professor_id;
      const isAdmin = airtableUser?.fields.role === 'admin';
      
      if (!isTeacher && !isAdmin) {
        setError('Você não tem permissão para gerenciar este curso');
        return;
      }
      
      const contentsData = await getCourseContents(id as string);
      console.log('Conteúdos carregados:', contentsData);
      
      // Organizar por ordem
      const sortedContents = [...contentsData].sort((a, b) => a.order - b.order);
      setContents(sortedContents);
    } catch (error) {
      console.error('Erro ao carregar curso:', error);
      setError('Ocorreu um erro ao carregar o curso. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContents = async (updatedContents: VideoContent[]) => {
    try {
      await updateCourseContents(id as string, updatedContents);
      // Recarregar conteúdos após salvar
      const contentsData = await getCourseContents(id as string);
      const sortedContents = [...contentsData].sort((a, b) => a.order - b.order);
      setContents(sortedContents);
      return true;
    } catch (error) {
      console.error('Erro ao salvar conteúdos:', error);
      toast.error('Erro ao salvar conteúdos. Tente novamente.');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-lg text-red-700 dark:text-red-300">
        <p>{error}</p>
        <Link href="/profile/courses" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
          Voltar para Meus Cursos
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Curso não encontrado.</p>
        <Link href="/profile/courses" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
          Voltar para Meus Cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Link 
            href={`/profile/courses/course/${id}`}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Gerenciar Conteúdo
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {course.fields.title}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <CourseContentManager 
                courseId={id as string} 
                contents={contents}
                onSave={handleSaveContents}
              />
            </div>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Sobre o Gerenciamento
                </h2>
                <div className="text-gray-600 dark:text-gray-400 space-y-2">
                  <p>
                    Adicione ou edite os vídeos do seu curso. A ordem dos vídeos será mantida 
                    conforme exibido aqui.
                  </p>
                  <p>
                    Use links do YouTube para os vídeos. Apenas URLs válidas do YouTube são aceitas.
                  </p>
                </div>
              </div>
            </Card>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Comentários dos Alunos
              </h2>
              <RatingComments courseId={id as string} showExpanded={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 