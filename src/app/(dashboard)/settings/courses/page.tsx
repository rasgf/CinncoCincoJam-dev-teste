'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/common/Button';
import { CourseModal } from '@/components/courses/CourseModal';
import { getUserCourses, createCourse } from '@/services/courses';
import { CourseLevel, CourseStatus } from '@/types/course';

interface Course {
  id: string;
  fields: {
    title: string;
    description: string;
    price: number;
    level: string;
    status: string;
    thumbnail?: string;
    professor_id: string;
    what_will_learn: string[];
    requirements: string[];
  };
}

interface CreateCourseData {
  title: string;
  description: string;
  price: number;
  level: CourseLevel;
  status: CourseStatus;
  thumbnail?: File | null;
  what_will_learn: string[];
  requirements: string[];
  professor_id: string;
}

export default function ManageCoursesPage() {
  const { airtableUser } = useAuthContext();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cursos</h1>
        
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
            <div key={course.id} className="relative">
              <CourseCard
                title={course.fields.title}
                description={course.fields.description}
                thumbnail={course.fields.thumbnail}
                price={course.fields.price}
                level={course.fields.level}
                status={course.fields.status}
                what_will_learn={course.fields.what_will_learn}
                requirements={course.fields.requirements}
              />
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
            </div>
          ))}
        </div>
      )}

      <CourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateCourse}
      />
    </div>
  );
} 