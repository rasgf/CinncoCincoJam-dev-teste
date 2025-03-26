'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCourseById } from '@/services/firebase-courses';
import { getCourseContents } from '@/services/firebase-course-contents';
import { checkEnrollment } from '@/services/firebase-enrollments';
import { Card } from '@/components/common/Card';
import { Course, VideoContent } from '@/types/course';
import { VideoPlayer } from '@/components/common/VideoPlayer';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';

export default function CoursePlayerPage() {
  const { id } = useParams();
  const router = useRouter();
  const { airtableUser } = useAuthContext();
  const [course, setCourse] = useState<Course | null>(null);
  const [contents, setContents] = useState<VideoContent[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecking, setAccessChecking] = useState(true);

  useEffect(() => {
    if (airtableUser) {
      loadCourseAndContents();
    }
  }, [id, airtableUser]);

  const loadCourseAndContents = async () => {
    try {
      setLoading(true);
      
      // Carregar o curso primeiro
      const courseData = await getCourseById(id as string);
      setCourse(courseData);
      
      // Verificar se o usuário tem acesso ao curso (é professor do curso ou está matriculado)
      const isTeacher = airtableUser?.fields.role === 'professor' && 
                        courseData.fields.professor_id === airtableUser.id;
      const isAdmin = airtableUser?.fields.role === 'admin';
      
      // Se não for professor do curso nem admin, verificar matrícula
      if (!isTeacher && !isAdmin) {
        const enrollmentCheck = await checkEnrollment(airtableUser?.id || '', id as string);
        setHasAccess(enrollmentCheck);
      } else {
        // Professores do curso e admins têm acesso automático
        setHasAccess(true);
      }
      
      setAccessChecking(false);
      
      // Se tem acesso, carrega o conteúdo do curso
      if (isTeacher || isAdmin || enrollmentCheck) {
        const contentsData = await getCourseContents(id as string);
        setContents(contentsData);
        
        // Selecionar o primeiro vídeo disponível
        if (contentsData.length > 0) {
          setSelectedVideo(contentsData[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar curso:', error);
      setAccessChecking(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoError = (error: any) => {
    console.error('Erro no player de vídeo:', error);
    setVideoError(error);
  };

  if (loading || accessChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Curso não encontrado.</p>
      </div>
    );
  }

  // Se não tem acesso, mostrar mensagem e botão para retornar à página de cursos
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Acesso Não Autorizado
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Você não tem acesso a este curso. Para acessar o conteúdo, você precisa estar matriculado.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => router.push('/courses')}
              className="w-auto"
            >
              Ver Outros Cursos
            </Button>
            <Button
              onClick={() => router.push(`/courses/${id}`)}
              variant="outline"
              className="w-auto"
            >
              Saiba Mais Sobre Este Curso
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar com lista de aulas */}
          <div className="w-full md:w-80 flex-shrink-0">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {course.fields.title}
              </h2>
              <div className="space-y-2">
                {contents.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => {
                      setSelectedVideo(video);
                      setVideoError(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedVideo?.id === video.id
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <h3 className="font-medium">{video.title}</h3>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Área principal com o player de vídeo */}
          <div className="flex-1">
            <Card>
              {selectedVideo ? (
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <VideoPlayer 
                      videoId={selectedVideo.youtubeUrl}
                      title={selectedVideo.title}
                      onError={handleVideoError}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {selectedVideo.title}
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      {course.fields.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    Selecione uma aula para começar
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Função auxiliar para extrair o ID do vídeo do YouTube
function getYouTubeVideoId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
} 