'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed?: boolean;
}

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  professor_name: string;
  price: number;
  lessons: Lesson[];
  totalStudents?: number;
  revenue?: number;
}

export default function CourseDetailsPage() {
  const params = useParams();
  const { airtableUser } = useAuthContext();
  const isTeacher = airtableUser?.fields.role === 'professor';
  const [activeTab, setActiveTab] = useState<'content' | 'stats'>('content');
  const [course, setCourse] = useState<CourseDetails>({
    id: '1',
    title: 'Desenvolvimento Web com React',
    description: 'Aprenda React do zero ao avançado, incluindo hooks, context e muito mais',
    professor_name: 'João Silva',
    price: 297.00,
    lessons: [
      { id: '1', title: 'Introdução ao React', duration: '15:00', completed: true },
      { id: '2', title: 'Componentes e Props', duration: '25:00', completed: true },
      { id: '3', title: 'Estado e Ciclo de Vida', duration: '30:00', completed: false },
      { id: '4', title: 'Hooks Básicos', duration: '45:00', completed: false },
    ],
    totalStudents: 150,
    revenue: 44550.00,
  });

  const progress = course.lessons.filter(lesson => lesson.completed).length / course.lessons.length * 100;

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Curso */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="h-48 bg-gray-200 relative">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-400">Sem imagem</span>
            </div>
          )}
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          <p className="mt-2 text-gray-600">{course.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Professor: {course.professor_name}
            </div>
            {!isTeacher && (
              <Button className="w-auto">
                Começar Curso
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      {isTeacher && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('content')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Conteúdo
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Estatísticas
            </button>
          </nav>
        </div>
      )}

      {/* Conteúdo */}
      <div className="space-y-6">
        {(!isTeacher || activeTab === 'content') && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Aulas</h2>
              {isTeacher && (
                <Button className="w-auto">
                  Adicionar Aula
                </Button>
              )}
            </div>

            {!isTeacher && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progresso</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              {course.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    {!isTeacher && (
                      <input
                        type="checkbox"
                        checked={lesson.completed}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
                        readOnly
                      />
                    )}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {lesson.title}
                      </h3>
                      <p className="text-sm text-gray-500">{lesson.duration}</p>
                    </div>
                  </div>
                  {isTeacher && (
                    <Button variant="secondary" className="w-auto">
                      Editar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isTeacher && activeTab === 'stats' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Estatísticas do Curso</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Total de Alunos</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {course.totalStudents}
                </dd>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Receita Total</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  R$ {course.revenue?.toFixed(2)}
                </dd>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 