'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCourseById } from '@/services/courses';
import { getCourseContents } from '@/services/courseContents';
import { Card } from '@/components/common/Card';

interface VideoContent {
  id: string;
  title: string;
  youtubeUrl: string;
  releaseDate: string;
  releaseTime: string;
  order: number;
}

interface Course {
  id: string;
  fields: {
    title: string;
    description: string;
    thumbnail?: string;
  };
}

export default function CoursePlayerPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [contents, setContents] = useState<VideoContent[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseAndContents();
  }, [id]);

  const loadCourseAndContents = async () => {
    try {
      setLoading(true);
      const [courseData, contentsData] = await Promise.all([
        getCourseById(id as string),
        getCourseContents(id as string)
      ]);
      
      setCourse(courseData);
      setContents(contentsData);
      
      // Selecionar o primeiro vídeo disponível
      if (contentsData.length > 0) {
        setSelectedVideo(contentsData[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar curso:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar com lista de aulas */}
          <div className="w-80 flex-shrink-0">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {course.fields.title}
              </h2>
              <div className="space-y-2">
                {contents.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
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
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedVideo.youtubeUrl)}`}
                      title={selectedVideo.title}
                      className="w-full h-full"
                      allowFullScreen
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