'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { getCourseById } from '@/services/courses';
import { Button } from '@/components/common/Button';

export default function CourseLandingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { airtableUser } = useAuthContext();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      console.log('Carregando curso com ID:', id);
      const data = await getCourseById(id as string);
      console.log('Dados do curso:', data);
      setCourse(data);
    } catch (error) {
      console.error('Erro ao carregar curso:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCourse = () => {
    if (!airtableUser) {
      router.push(`/auth/login?redirect=/learn/courses/${id}`);
      return;
    }
    router.push(`/learn/courses/${id}`);
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
        <p className="text-gray-500">Curso não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {course.fields.title}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            {course.fields.description}
          </p>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">O que você vai aprender</h2>
              <ul className="space-y-2">
                {course.fields.what_will_learn?.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={handleStartCourse}
              className="w-full"
            >
              Começar Curso
            </Button>
          </div>
        </div>

        <div>
          {course.fields.thumbnail ? (
            <img
              src={course.fields.thumbnail}
              alt={course.fields.title}
              className="w-full rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-full aspect-video bg-gray-200 rounded-lg" />
          )}
        </div>
      </div>
    </div>
  );
} 