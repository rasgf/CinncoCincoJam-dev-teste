'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { getUserEnrollments, UserEnrollmentWithCourse } from '@/services/firebase-enrollments';
import { StarRating } from '@/components/common/StarRating';

export default function EnrolledCoursesPage() {
  const router = useRouter();
  const { user, airtableUser } = useAuthContext();
  const [courses, setCourses] = useState<UserEnrollmentWithCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.error('Você precisa estar logado para acessar esta página');
      router.push('/login');
      return;
    }

    if (airtableUser?.fields.role !== 'aluno') {
      router.push('/profile');
      return;
    }

    const loadEnrollments = async () => {
      try {
        setLoading(true);
        const enrollments = await getUserEnrollments(user.uid);
        console.log('Cursos matriculados carregados:', enrollments);
        // Verificando URLs das imagens
        enrollments.forEach(enrollment => {
          console.log(`Curso: ${enrollment.fields.courseName}, URL da imagem: ${enrollment.fields.courseImage}`);
        });
        setCourses(enrollments);
      } catch (error) {
        console.error('Erro ao carregar cursos matriculados:', error);
        toast.error('Não foi possível carregar seus cursos. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadEnrollments();
  }, [user, airtableUser, router]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Cursos Matriculados
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Aqui estão todos os cursos em que você está matriculado.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Você ainda não está matriculado em nenhum curso.
          </p>
          <Link 
            href="/courses" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Explorar Cursos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((enrollment) => (
            <div key={enrollment.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
              <div className="h-48 overflow-hidden relative">
                {enrollment.fields.courseImage ? (
                  <Image
                    src={enrollment.fields.courseImage}
                    alt={enrollment.fields.courseName}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.error(`Erro ao carregar imagem do curso: ${enrollment.fields.courseName}`, enrollment.fields.courseImage);
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/placeholder-course.jpg';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">Sem imagem</span>
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">
                    {enrollment.fields.courseName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Professor: {enrollment.fields.professorName}
                  </p>
                  
                  {/* Exibir avaliações */}
                  {enrollment.fields.rating > 0 && (
                    <div className="flex items-center mb-3">
                      <StarRating initialRating={enrollment.fields.rating} readOnly size="sm" />
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        {enrollment.fields.rating.toFixed(1)} ({enrollment.fields.ratingCount})
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-auto">
                  <div className="mt-2 mb-4">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progresso</span>
                      <span>{enrollment.fields.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${enrollment.fields.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                      enrollment.fields.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {enrollment.fields.status === 'completed' ? 'Concluído' : 'Em andamento'}
                    </span>
                    <Link
                      href={`/learn/courses/${enrollment.fields.course_id}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Continuar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 