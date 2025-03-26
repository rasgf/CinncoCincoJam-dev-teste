'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CourseCard from '@/components/courses/CourseCard';
import { getAllPublishedCourses } from '@/services/firebase-courses';
import { getCourseAverageRating } from '@/services/firebase-ratings';
import { StarRating } from '@/components/common/StarRating';
import { Course } from '@/types/course';

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesWithRatings, setCoursesWithRatings] = useState<(Course & { rating?: number, ratingCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await getAllPublishedCourses();
      setCourses(data);
      
      // Buscar avaliações para cada curso
      const coursesWithRatingPromises = data.map(async (course) => {
        try {
          const ratingData = await getCourseAverageRating(course.id);
          return {
            ...course,
            rating: ratingData.average,
            ratingCount: ratingData.count
          };
        } catch (error) {
          console.error(`Erro ao carregar avaliações para o curso ${course.id}:`, error);
          return course;
        }
      });
      
      const enrichedCourses = await Promise.all(coursesWithRatingPromises);
      setCoursesWithRatings(enrichedCourses);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (id: string) => {
    console.log('Clicou no curso:', id);
    router.push(`/courses/${id}`);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cursos Disponíveis</h1>
        
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-1">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded ${
              view === 'grid' 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title="Visualização em grade"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/>
            </svg>
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded ${
              view === 'list' 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title="Visualização em lista"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/>
            </svg>
          </button>
        </div>
      </div>

      {coursesWithRatings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Nenhum curso disponível no momento.
          </p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesWithRatings.map((course) => (
            <div 
              key={course.id}
              onClick={() => handleCourseClick(course.id)}
              className="cursor-pointer"
            >
              <CourseCard
                title={course.fields.title}
                description={course.fields.description}
                thumbnail={course.fields.thumbnail}
                price={course.fields.price}
                level={course.fields.level}
                rating={course.rating}
                ratingCount={course.ratingCount}
                paymentType={course.fields.paymentType}
                recurrenceInterval={course.fields.recurrenceInterval}
                installments={course.fields.installments}
                installmentCount={course.fields.installmentCount}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
          {coursesWithRatings.map((course) => (
            <div 
              key={course.id}
              className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => handleCourseClick(course.id)}
            >
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {course.fields.title}
                </h3>
                {course.rating > 0 && (
                  <div className="flex items-center mt-1 mb-1">
                    <StarRating initialRating={course.rating} readOnly size="sm" />
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {course.rating.toFixed(1)} ({course.ratingCount})
                    </span>
                  </div>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                  {course.fields.description}
                </p>
              </div>
              <div className="ml-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                {course.fields.price ? (
                  <>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(course.fields.price)}
                    {course.fields.paymentType === 'recurring' && course.fields.recurrenceInterval && (
                      <span className="ml-1 text-xs text-gray-500">
                        /{course.fields.recurrenceInterval === 'monthly' ? 'mês' : 
                          course.fields.recurrenceInterval === 'quarterly' ? 'trimestre' :
                          course.fields.recurrenceInterval === 'biannual' ? 'semestre' : 'ano'}
                      </span>
                    )}
                    {course.fields.paymentType === 'one_time' && course.fields.installments && course.fields.installmentCount && (
                      <span className="ml-1 text-xs text-gray-500">
                        em até {course.fields.installmentCount}x
                      </span>
                    )}
                  </>
                ) : (
                  'Gratuito'
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 