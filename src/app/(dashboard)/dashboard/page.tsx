'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getAdminStats } from '@/services/admin';
import { getProfessorStats } from '@/services/courses';
import { getStudentStats } from '@/services/enrollments';
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
  const { airtableUser } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [professorStats, setProfessorStats] = useState<ProfessorStats | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);

  useEffect(() => {
    loadStats();
  }, [airtableUser]);

  const loadStats = async () => {
    if (!airtableUser) return;

    try {
      setLoading(true);
      
      switch (airtableUser.fields.role) {
        case 'admin':
          const adminData = await getAdminStats();
          setAdminStats(adminData);
          break;
        case 'professor':
          const professorData = await getProfessorStats(airtableUser.id);
          setProfessorStats(professorData);
          break;
        case 'aluno':
          const studentData = await getStudentStats(airtableUser.id);
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

  if (!airtableUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Usuário não encontrado.</p>
      </div>
    );
  }

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{adminStats?.totalUsers}</p>
            </div>
            <UsersIcon className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cursos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{adminStats?.totalCourses}</p>
            </div>
            <BookOpenIcon className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {adminStats?.totalRevenue.toFixed(2)}
              </p>
            </div>
            <CurrencyDollarIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alunos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{adminStats?.activeStudents}</p>
            </div>
            <AcademicCapIcon className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Professores Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{adminStats?.pendingProfessors}</p>
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
      <h1 className="text-2xl font-bold text-gray-900">Painel do Professor</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Alunos</p>
              <p className="text-2xl font-bold text-gray-900">{professorStats?.totalStudents}</p>
              <div className={`flex items-center mt-2 text-sm ${
                professorStats?.studentsTrend.isPositive ? 'text-green-600' : 'text-red-600'
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
              <p className="text-sm font-medium text-gray-600">Cursos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{professorStats?.activeCourses}</p>
            </div>
            <BookOpenIcon className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {professorStats?.monthlyRevenue.toFixed(2)}
              </p>
              <div className={`flex items-center mt-2 text-sm ${
                professorStats?.revenueTrend.isPositive ? 'text-green-600' : 'text-red-600'
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
      <h1 className="text-2xl font-bold text-gray-900">Meu Painel de Estudos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cursos Matriculados</p>
              <p className="text-2xl font-bold text-gray-900">{studentStats?.enrolledCourses}</p>
            </div>
            <BookOpenIcon className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cursos Concluídos</p>
              <p className="text-2xl font-bold text-gray-900">{studentStats?.completedCourses}</p>
            </div>
            <AcademicCapIcon className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Horas Estudadas</p>
              <p className="text-2xl font-bold text-gray-900">{studentStats?.totalHoursStudied}h</p>
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {studentStats?.nextLesson && (
        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Continuar Estudando</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{studentStats.nextLesson.courseTitle}</p>
                <p className="text-sm text-gray-600">{studentStats.nextLesson.title}</p>
                <p className="text-sm text-gray-500">Duração: {studentStats.nextLesson.duration}min</p>
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
      {airtableUser.fields.role === 'admin' && renderAdminDashboard()}
      {airtableUser.fields.role === 'professor' && renderProfessorDashboard()}
      {airtableUser.fields.role === 'aluno' && renderStudentDashboard()}
    </div>
  );
} 