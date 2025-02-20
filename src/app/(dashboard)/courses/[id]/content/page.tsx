'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCourseById } from '@/services/courses';
import { getCourseContents } from '@/services/courseContents';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VideoContent {
  id: string;
  title: string;
  youtubeUrl: string;
  releaseDate: string;
  releaseTime: string;
  order: number;
}

export default function CourseContentPage() {
  const params = useParams();
  const [course, setCourse] = useState<any>(null);
  const [contents, setContents] = useState<VideoContent[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, [params.id]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const courseData = await getCourseById(params.id as string);
      const courseContents = await getCourseContents(params.id as string);
      
      setCourse(courseData);
      setContents(courseContents);
      
      // Selecionar o primeiro vídeo disponível
      const availableVideos = courseContents.filter(video => isVideoAvailable(video));
      if (availableVideos.length > 0) {
        setSelectedVideo(availableVideos[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar curso:', error);
    } finally {
      setLoading(false);
    }
  };

  const isVideoAvailable = (video: VideoContent) => {
    if (!video.releaseDate) return true;
    
    const now = new Date();
    const releaseDate = new Date(`${video.releaseDate}T${video.releaseTime || '00:00'}`);
    return now >= releaseDate;
  };

  const getVideoStatus = (video: VideoContent) => {
    if (!video.releaseDate) return 'available';
    
    const now = new Date();
    const releaseDate = new Date(`${video.releaseDate}T${video.releaseTime || '00:00'}`);
    
    if (now >= releaseDate) return 'available';
    return 'scheduled';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Cabeçalho do Curso */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {course?.fields.title}
          </h1>
          <p className="text-gray-600">
            {course?.fields.description}
          </p>
        </div>

        <div className="flex gap-6">
          {/* Lista de Vídeos */}
          <div className="w-1/3 bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Conteúdo do Curso</h2>
            <div className="space-y-2">
              {contents.map((video) => {
                const status = getVideoStatus(video);
                return (
                  <button
                    key={video.id}
                    onClick={() => status === 'available' && setSelectedVideo(video)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedVideo?.id === video.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    } ${
                      status === 'scheduled' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{video.title}</h3>
                        {status === 'scheduled' && video.releaseDate && (
                          <p className="text-sm text-gray-500">
                            Disponível em {format(
                              new Date(`${video.releaseDate}T${video.releaseTime || '00:00'}`),
                              "dd 'de' MMMM 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player de Vídeo */}
          <div className="flex-1">
            {selectedVideo ? (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-4">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedVideo.youtubeUrl)}`}
                    title={selectedVideo.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedVideo.title}
                </h2>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">
                  Selecione um vídeo para começar a assistir
                </p>
              </div>
            )}
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