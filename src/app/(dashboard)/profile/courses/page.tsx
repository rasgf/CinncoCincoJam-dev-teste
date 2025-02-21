'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/common/Button';
import { CourseModal } from '@/components/courses/CourseModal';
import { getUserCourses, createCourse, updateCourse, deleteCourse } from '@/services/courses';
import { EditCourseModal } from '@/components/courses/EditCourseModal';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import type { CreateCourseData } from '@/types/course';

interface Course {
  id: string;
  fields: {
    title: string;
    description: string;
    price: number;
    category: string;
    level: string;
    status: string;
    thumbnail?: string;
  };
}

export default function ManageCoursesPage() {
  const { airtableUser } = useAuthContext();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourses();
  }, [airtableUser]);

  const loadCourses = async () => {
    if (!airtableUser) return;
    
    try {
      setLoading(true);
      const data = await getUserCourses(airtableUser.id);
      setCourses(data);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (courseData: CreateCourseData) => {
    try {
      await createCourse(courseData);
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('Erro ao criar curso:', error);
      setError('Erro ao criar curso. Tente novamente.');
    }
  };

  const handleEditCourse = async (courseData: any) => {
    if (!airtableUser) return;
    
    try {
      await updateCourse(courseData.id, {
        ...courseData,
        professor_id: airtableUser.id
      });
      await loadCourses();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
    }
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setIsEditModalOpen(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Tem certeza que deseja remover este curso? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setDeletingCourseId(courseId);
      await deleteCourse(courseId);
      await loadCourses(); // Recarrega a lista
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Erro ao remover curso. Tente novamente.');
      }
    } finally {
      setDeletingCourseId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meus Cursos</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie seus cursos e conteúdos
          </p>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)}>
          Novo Curso
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-8 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Você ainda não criou nenhum curso.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              Criar meu primeiro curso
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div 
              key={course.id} 
              className="relative group transform hover:scale-[1.02] transition-all duration-200"
            >
              <CourseCard
                title={course.fields.title}
                description={course.fields.description}
                thumbnail={course.fields.thumbnail}
                price={course.fields.price}
                level={course.fields.level}
              />

              {/* Status Badge */}
              <div className="absolute top-2 right-2 z-10">
                <span className={`px-2 py-1 text-xs font-medium rounded-full shadow-sm ${
                  course.fields.status === 'published' 
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                    : course.fields.status === 'draft'
                    ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  {course.fields.status === 'published' ? 'Publicado' : 
                   course.fields.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 left-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                {/* Edit Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCourseClick(course);
                  }}
                  className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl hover:bg-blue-50 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transform hover:scale-105 transition-all duration-200"
                  title="Editar curso"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCourse(course.id);
                  }}
                  disabled={deletingCourseId === course.id}
                  className={`p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl
                    hover:bg-red-50 dark:hover:bg-red-900/50 transform hover:scale-105 transition-all duration-200 ${
                      deletingCourseId === course.id 
                        ? 'cursor-not-allowed opacity-50' 
                        : 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300'
                    }`}
                  title="Remover curso"
                >
                  <TrashIcon className={`w-5 h-5 ${
                    deletingCourseId === course.id ? 'animate-pulse' : ''
                  }`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateCourse}
      />

      {selectedCourse && (
        <EditCourseModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCourse(null);
          }}
          onSave={handleEditCourse}
          course={selectedCourse}
        />
      )}
    </div>
  );
} 