'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getAdminStats } from '@/services/firebase-admin';
import { getProfessorStats } from '@/services/firebase-courses';
import { getStudentStats } from '@/services/firebase-enrollments';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { 
  AcademicCapIcon, 
  UsersIcon, 
  BookOpenIcon,
  ClockIcon,
  ChartBarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  activeStudents: number;
  pendingProfessors: number;
}

interface ProfessorStats {
  totalStudents: number;
  activeCourses: number;
  monthlyRevenue: number;
  studentsTrend: { value: number; isPositive: boolean };
  revenueTrend: { value: number; isPositive: boolean };
}

interface StudentStats {
  enrolledCourses: number;
  completedCourses: number;
  totalHoursStudied: number;
  currentProgress: number;
  nextLesson?: {
    title: string;
    courseTitle: string;
    duration: number;
  };
}

export default function DashboardPage() {
  const { user, airtableUser: firebaseUser } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [professorStats, setProfessorStats] = useState<ProfessorStats | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);

  useEffect(() => {
    loadStats();
  }, [firebaseUser]);

  const loadStats = async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      
      switch (firebaseUser.fields.role) {
        case 'admin':
          const adminData = await getAdminStats();
          setAdminStats(adminData);
          break;
        case 'professor':
          const professorData = await getProfessorStats(firebaseUser.id);
          setProfessorStats(professorData);
          break;
        case 'aluno':
          const studentData = await getStudentStats(firebaseUser.id);
          setStudentStats(studentData);
          break;
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Usuário não encontrado.</p>
      </div>
    );
  }

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Painel Administrativo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats?.totalUsers}</p>
            </div>
            <UsersIcon className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cursos Ativos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats?.totalCourses}</p>
            </div>
            <BookOpenIcon className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                R$ {adminStats?.totalRevenue.toFixed(2)}
              </p>
            </div>
            <CurrencyDollarIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alunos Ativos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats?.activeStudents}</p>
            </div>
            <AcademicCapIcon className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Professores Pendentes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats?.pendingProfessors}</p>
              {adminStats && adminStats.pendingProfessors > 0 && (
                <Button
                  variant="text"
                  className="mt-2 text-sm"
                  onClick={() => window.location.href = '/admin/professors'}
                >
                  Ver solicitações
                </Button>
              )}
            </div>
            <UsersIcon className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>
    </div>
  );

  const renderProfessorDashboard = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Painel do Professor</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Alunos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{professorStats?.totalStudents}</p>
              <div className={`flex items-center mt-2 text-sm ${
                professorStats?.studentsTrend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                <span>{professorStats?.studentsTrend.value}% este mês</span>
              </div>
            </div>
            <UsersIcon className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cursos Ativos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{professorStats?.activeCourses}</p>
            </div>
            <BookOpenIcon className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receita Mensal</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                R$ {professorStats?.monthlyRevenue.toFixed(2)}
              </p>
              <div className={`flex items-center mt-2 text-sm ${
                professorStats?.revenueTrend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                <span>{professorStats?.revenueTrend.value}% este mês</span>
              </div>
            </div>
            <ChartBarIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => window.location.href = '/profile/courses'}>
          Gerenciar Cursos
        </Button>
      </div>
    </div>
  );

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meu Painel de Estudos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cursos Matriculados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{studentStats?.enrolledCourses}</p>
            </div>
            <BookOpenIcon className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cursos Concluídos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{studentStats?.completedCourses}</p>
            </div>
            <AcademicCapIcon className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Horas Estudadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{studentStats?.totalHoursStudied}h</p>
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {studentStats?.nextLesson && (
        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Continuar Estudando</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{studentStats.nextLesson.courseTitle}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{studentStats.nextLesson.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Duração: {studentStats.nextLesson.duration}min</p>
              </div>
              <Button>Continuar</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="p-6">
      {firebaseUser.fields.role === 'admin' && renderAdminDashboard()}
      {firebaseUser.fields.role === 'professor' && renderProfessorDashboard()}
      {firebaseUser.fields.role === 'aluno' && renderStudentDashboard()}
    </div>
  );
} 