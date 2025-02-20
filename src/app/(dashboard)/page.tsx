'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { CourseCard } from '@/components/courses/CourseCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { getUserCourses, getProfessorStats } from '@/services/courses';

export default function DashboardPage() {
  const { user, airtableUser } = useAuthContext();
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isTeacher = airtableUser?.fields.role === 'professor';

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (isTeacher) {
          const [coursesData, statsData] = await Promise.all([
            getUserCourses(airtableUser.id),
            getProfessorStats(airtableUser.id)
          ]);
          setCourses(coursesData);
          setStats(statsData);
        } else {
          const coursesData = await getUserCourses(airtableUser.id);
          setCourses(coursesData);
        }
      } catch (err) {
        setError('Erro ao carregar dados do dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (airtableUser) {
      loadDashboardData();
    }
  }, [airtableUser, isTeacher]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isTeacher ? 'Dashboard do Professor' : 'Meus Cursos'}
      </h1>

      {isTeacher && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total de Alunos"
            value={stats.totalStudents}
            trend={stats.studentsTrend}
          />
          <StatsCard
            title="Cursos Ativos"
            value={stats.activeCourses}
          />
          <StatsCard
            title="Rendimentos (Mês)"
            value={`R$ ${stats.monthlyRevenue.toFixed(2)}`}
            trend={stats.revenueTrend}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            title={course.fields.title}
            description={course.fields.description}
            thumbnail={course.fields.thumbnail?.[0]?.url}
            progress={!isTeacher ? course.fields.progress : undefined}
            professor={!isTeacher ? course.fields.professor_name : undefined}
            price={isTeacher ? course.fields.price : undefined}
          />
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {isTeacher 
              ? 'Você ainda não criou nenhum curso.' 
              : 'Você ainda não está matriculado em nenhum curso.'}
          </p>
        </div>
      )}
    </div>
  );
} 