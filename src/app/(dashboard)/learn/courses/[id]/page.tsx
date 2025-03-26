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
import { VideoRatingCard } from '@/components/courses/VideoRatingCard';
import { NewConversationButton } from '@/components/messages/NewConversationButton';

export default function CoursePlayerPage() {
  const { id } = useParams();
  const router = useRouter();
  const { airtableUser, user } = useAuthContext();
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

  const isValidDate = (dateString: string, timeString: string = '00:00'): boolean => {
    if (!dateString) return false;
    
    try {
      const date = new Date(`${dateString}T${timeString || '00:00'}`);
      return !isNaN(date.getTime());
    } catch (e) {
      console.error('Erro ao validar data:', e);
      return false;
    }
  };

  const loadCourseAndContents = async () => {
    try {
      setLoading(true);
      
      // Carregar o curso primeiro
      const courseData = await getCourseById(id as string);
      setCourse(courseData);
      
      console.log('Dados do curso carregados:', courseData);
      
      // Verificar se o usuário tem acesso ao curso (é professor do curso ou está matriculado)
      const isTeacher = airtableUser?.fields.role === 'professor' && 
                        courseData.fields.professor_id === airtableUser.id;
      const isAdmin = airtableUser?.fields.role === 'admin';
      
      // Definir a variável fora do bloco condicional
      let enrollmentCheck = false;
      
      // Se não for professor do curso nem admin, verificar matrícula
      if (!isTeacher && !isAdmin) {
        enrollmentCheck = await checkEnrollment(airtableUser?.id || '', id as string);
        console.log('Status da matrícula:', enrollmentCheck);
        
        // Verificar se o curso tem data de lançamento programada
        if (enrollmentCheck && courseData.fields.releaseDate) {
          // Validar o formato da data antes de criar o objeto Date
          if (isValidDate(courseData.fields.releaseDate, courseData.fields.releaseTime)) {
            const releaseDateTime = new Date(`${courseData.fields.releaseDate}T${courseData.fields.releaseTime || '00:00'}`);
            const now = new Date();
            
            console.log('Data de lançamento do curso:', releaseDateTime);
            console.log('Data atual:', now);
            
            // Se a data atual for anterior à data de lançamento, não permitir acesso
            if (now < releaseDateTime) {
              setHasAccess(false);
              setVideoError({
                message: `Este curso será liberado em ${releaseDateTime.toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit' 
                })}`
              });
              setAccessChecking(false);
              setLoading(false);
              return;
            }
          } else {
            console.warn('Data de lançamento do curso inválida:', courseData.fields.releaseDate, courseData.fields.releaseTime);
          }
        }
        
        setHasAccess(enrollmentCheck);
      } else {
        // Professores do curso e admins têm acesso automático
        setHasAccess(true);
      }
      
      setAccessChecking(false);
      
      // Se tem acesso, carrega o conteúdo do curso
      if (isTeacher || isAdmin || enrollmentCheck) {
        const contentsData = await getCourseContents(id as string);
        console.log('Conteúdos do curso carregados:', contentsData);
        
        // Para alunos comuns, filtrar vídeos baseado nas datas de lançamento individuais
        if (!isTeacher && !isAdmin) {
          const now = new Date();
          const filteredContents = contentsData.map(video => {
            // Verifica se o vídeo tem data de lançamento definida
            const hasReleaseDate = video.releaseDate && video.releaseTime && 
                                  isValidDate(video.releaseDate, video.releaseTime);
            
            // Adicionar propriedade para indicar se está disponível
            let isLocked = false;
            let releaseDate = null;
            
            if (hasReleaseDate) {
              releaseDate = new Date(`${video.releaseDate}T${video.releaseTime || '00:00'}`);
              isLocked = now < releaseDate;
              
              console.log(`Vídeo ${video.title}:`, {
                releaseDate: video.releaseDate,
                releaseTime: video.releaseTime,
                releaseDateTime: releaseDate,
                isLocked
              });
            }
            
            return {
              ...video,
              isLocked,
              lockedMessage: isLocked ? 
                `Disponível em ${releaseDate?.toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit' 
                })}` : ''
            };
          });
          
          setContents(filteredContents);
        } else {
          // Professores e admins veem todos os vídeos
          setContents(contentsData);
        }
        
        // Selecionar o primeiro vídeo disponível para alunos comuns
        if (contentsData.length > 0) {
          if (!isTeacher && !isAdmin) {
            const now = new Date();
            const firstAvailableVideo = contentsData.find(video => {
              // Se não tem data de lançamento, está disponível
              if (!video.releaseDate || !video.releaseTime) return true;
              
              // Validar o formato da data
              if (!isValidDate(video.releaseDate, video.releaseTime)) return true;
              
              // Se tem data, verificar se está disponível
              const releaseDateTime = new Date(`${video.releaseDate}T${video.releaseTime || '00:00'}`);
              return now >= releaseDateTime;
            }) || null;
            
            setSelectedVideo(firstAvailableVideo);
          } else {
            // Professores e admins veem o primeiro vídeo
            setSelectedVideo(contentsData[0]);
          }
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

  const handleVideoSelection = (video: any) => {
    // Para professores e admins, permitir qualquer vídeo
    const isTeacher = airtableUser?.fields.role === 'professor' && 
                      course?.fields.professor_id === airtableUser.id;
    const isAdmin = airtableUser?.fields.role === 'admin';
    
    if (isTeacher || isAdmin) {
      setSelectedVideo(video);
      setVideoError(null);
      return;
    }
    
    // Verificar novamente a disponibilidade do vídeo
    const now = new Date();
    
    // Verificar se o vídeo tem data de lançamento válida
    if (video.releaseDate && video.releaseTime && isValidDate(video.releaseDate, video.releaseTime)) {
      const releaseDateTime = new Date(`${video.releaseDate}T${video.releaseTime || '00:00'}`);
      
      // Verificar se ainda está bloqueado
      if (now < releaseDateTime) {
        const formattedDate = releaseDateTime.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit' 
        });
        
        setVideoError({
          message: `Este vídeo será liberado em ${formattedDate}`
        });
        return;
      }
    }
    
    // Se o vídeo estiver disponível, exibi-lo
    setSelectedVideo(video);
    setVideoError(null);
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
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {course.fields.title}
                </h2>
                
                {/* Botão de mensagem para o professor */}
                {course.fields.professor_id && user && user.uid !== course.fields.professor_id && (
                  <NewConversationButton
                    userId={user.uid}
                    userName={airtableUser?.fields.name || user.email || 'Aluno'}
                    recipientId={course.fields.professor_id}
                    recipientName={course.fields.professor_name || 'Professor'}
                    courseId={id as string}
                    courseTitle={course.fields.title}
                    buttonText=""
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    variant="ghost"
                    size="sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                    </svg>
                  </NewConversationButton>
                )}
              </div>
              <div className="space-y-2 p-2">
                {contents.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => handleVideoSelection(video)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedVideo?.id === video.id
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : video.isLocked
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{video.title}</h3>
                      {video.isLocked && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Área principal com o player de vídeo */}
          <div className="flex-1">
            <div className="space-y-6">
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
                ) : videoError ? (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      Conteúdo bloqueado
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      {videoError.message}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      Selecione uma aula para começar
                    </p>
                  </div>
                )}
              </Card>

              {/* Componente de Avaliação */}
              {selectedVideo && user && (
                <VideoRatingCard
                  userId={user.uid}
                  courseId={id as string}
                  videoId={selectedVideo.id}
                  videoTitle={selectedVideo.title}
                />
              )}
            </div>
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