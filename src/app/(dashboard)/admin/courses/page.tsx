'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { CourseModal } from '@/components/admin/CourseModal';
import { getAllCourses, createCourse, updateCourse, deleteCourse } from '@/services/firebase-courses';
import { TrashIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Course } from '@/types/course';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/utils/format';

export default function AdminCoursesPage() {
  const { airtableUser } = useAuthContext();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await getAllCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (courseData: any) => {
    try {
      // Adicionar o ID do usuário administrador como professor temporário
      // Na produção, seria melhor ter um seletor de professor
      courseData.professor_id = airtableUser?.id || 'admin';
      
      await createCourse(courseData);
      await loadCourses();
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      throw error;
    }
  };

  const handleUpdateCourse = async (courseData: any) => {
    if (!editingCourse) return;
    
    try {
      // Manter o professor original
      courseData.professor_id = editingCourse.fields.professor_id;
      
      await updateCourse(editingCourse.id, courseData);
      await loadCourses();
      setEditingCourse(null);
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      throw error;
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setDeletingCourseId(courseId);
      await deleteCourse(courseId);
      await loadCourses();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao excluir curso');
      console.error('Erro ao excluir curso:', error);
    } finally {
      setDeletingCourseId(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'Publicado';
      case 'draft':
        return 'Rascunho';
      case 'review':
        return 'Em Revisão';
      case 'archived':
        return 'Arquivado';
      default:
        return status;
    }
  };

  if (!airtableUser || airtableUser.fields.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Acesso não autorizado.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cursos</h1>
        
        <Button onClick={() => {
          setEditingCourse(null);
          setIsModalOpen(true);
        }}>
          Adicionar Curso
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500">Nenhum curso encontrado.</p>
          <Button 
            onClick={() => {
              setEditingCourse(null);
              setIsModalOpen(true);
            }}
            className="mt-4"
          >
            Criar Primeiro Curso
          </Button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nível
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Professor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-16 flex-shrink-0 mr-4 relative overflow-hidden rounded-md">
                        {course.fields.thumbnail ? (
                          <Image
                            src={course.fields.thumbnail}
                            alt={course.fields.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            className="rounded-md"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Sem imagem</span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {course.fields.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(course.fields.price)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {course.fields.level === 'beginner' && 'Iniciante'}
                      {course.fields.level === 'intermediate' && 'Intermediário'}
                      {course.fields.level === 'advanced' && 'Avançado'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(course.fields.status)}`}>
                      {getStatusLabel(course.fields.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {course.fields.professor_id || 'Sem professor atribuído'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingCourse(course);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      
                      <Link 
                        href={`/courses/${course.id}`}
                        target="_blank"
                        className="text-green-600 hover:text-green-900"
                        title="Visualizar"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir"
                        disabled={deletingCourseId === course.id}
                      >
                        <TrashIcon className={`h-5 w-5 ${deletingCourseId === course.id ? 'opacity-50' : ''}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para adicionar/editar cursos */}
      <CourseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCourse(null);
        }}
        onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}
        initialData={editingCourse}
      />
    </div>
  );
} 