'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/common/Button';
import { CourseModal } from '@/components/courses/CourseModal';
import { getUserCourses, createCourse, updateCourse, deleteCourse } from '@/services/courses';
import { EditCourseModal } from '@/components/courses/EditCourseModal';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

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

  const handleCreateCourse = async (courseData: any) => {
    if (!airtableUser) return;
    
    try {
      await createCourse({
        ...courseData,
        professor_id: airtableUser.id
      });
      await loadCourses(); // Recarrega a lista após criar
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar curso:', error);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Meus Cursos</h1>
        
        <Button onClick={() => setIsModalOpen(true)}>
          Novo Curso
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Você ainda não criou nenhum curso.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div 
              key={course.id} 
              className="relative group"
            >
              <CourseCard
                title={course.fields.title}
                description={course.fields.description}
                thumbnail={course.fields.thumbnail}
                price={course.fields.price}
                level={course.fields.level}
              />

              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  course.fields.status === 'published' 
                    ? 'bg-green-100 text-green-800'
                    : course.fields.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {course.fields.status === 'published' ? 'Publicado' : 
                   course.fields.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 left-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {/* Edit Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCourseClick(course);
                  }}
                  className="p-2 bg-white rounded-full shadow hover:bg-blue-50 text-blue-600 hover:text-blue-700"
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
                  className={`p-2 bg-white rounded-full shadow
                    hover:bg-red-50 ${
                      deletingCourseId === course.id 
                        ? 'cursor-not-allowed opacity-50' 
                        : 'text-red-600 hover:text-red-700'
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