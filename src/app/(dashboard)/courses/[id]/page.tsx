'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { getCourseById } from '@/services/firebase-courses';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { Course } from '@/types/course';
import { ProxyImage } from '@/components/common/ProxyImage';

interface CourseFields {
  title: string;
  description: string;
  thumbnail?: string;
  what_will_learn?: string | string[];
  price?: number;
  status?: string;
  level?: string;
  professor?: string;
  requirements?: string | string[];
}

interface Course {
  id: string;
  fields: CourseFields;
}

export default function CoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const { airtableUser } = useAuthContext();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  // Função auxiliar para converter what_will_learn em array
  const getWhatWillLearn = (items?: string | string[]): string[] => {
    if (!items) return [];
    if (typeof items === 'string') return items.split(',');
    return items;
  };

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const data = await getCourseById(id as string);
      // Precisamos fazer um cast ou transformação dos dados
      setCourse({
        id: data.id,
        fields: {
          title: data.fields.title as string,
          description: data.fields.description as string,
          thumbnail: data.fields.thumbnail as string | undefined,
          what_will_learn: data.fields.what_will_learn,
          price: data.fields.price as number | undefined,
          status: data.fields.status as string | undefined,
          level: data.fields.level as string | undefined,
          professor: data.fields.professor as string | undefined,
          requirements: data.fields.requirements as string | string[] | undefined
        }
      });
    } catch (error) {
      console.error('Erro ao carregar curso:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCourse = () => {
    router.push(`/learn/courses/${id}`);
  };

  if (loading) {
    return <Loading />;
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Curso não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {course.fields.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            {course.fields.description}
          </p>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                O que você vai aprender
              </h2>
              <ul className="space-y-2">
                {getWhatWillLearn(course.fields.what_will_learn).map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg 
                      className="w-5 h-5 text-green-500 dark:text-green-400 mt-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M5 13l4 4L19 7" 
                      />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {course.fields.requirements && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Pré-requisitos
                </h2>
                <ul className="space-y-2">
                  {getWhatWillLearn(course.fields.requirements).map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg 
                        className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-1" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2" 
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nível do curso</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {course.fields.level}
                  </p>
                </div>
                {course.fields.price !== undefined && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Investimento</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {course.fields.price === 0 
                        ? 'Grátis' 
                        : `R$ ${course.fields.price.toFixed(2)}`
                      }
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleStartCourse}
                className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                Começar Curso
              </Button>
            </div>
          </div>
        </div>

        <div>
          {course.fields.thumbnail ? (
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
              <ProxyImage
                src={course.fields.thumbnail}
                alt={course.fields.title}
                width={800}
                height={450}
                className="w-full h-full object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
            </div>
          ) : (
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 dark:text-gray-500">
                Imagem não disponível
              </span>
            </div>
          )}

          {course.fields.professor && (
            <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Professor
              </h3>
              <p className="mt-1 text-lg font-medium text-gray-900 dark:text-gray-100">
                {course.fields.professor}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 