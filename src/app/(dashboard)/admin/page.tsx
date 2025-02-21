'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/common/Button';
import { getAdminStats } from '@/services/admin';
import { UsersIcon, BookOpenIcon, CurrencyDollarIcon, AcademicCapIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  activeStudents: number;
  pendingProfessors: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (error) {
        console.error('Error loading admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Seção de Estatísticas */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Painel Administrativo
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard
            title="Total de Usuários"
            value={stats?.totalUsers || 0}
            icon={<UsersIcon className="w-8 h-8 text-blue-500" />}
          />

          <StatsCard
            title="Cursos Ativos"
            value={stats?.totalCourses || 0}
            icon={<BookOpenIcon className="w-8 h-8 text-green-500" />}
          />

          <StatsCard
            title="Receita Total"
            value={`R$ ${stats?.totalRevenue.toFixed(2) || '0.00'}`}
            icon={<CurrencyDollarIcon className="w-8 h-8 text-yellow-500" />}
          />

          <StatsCard
            title="Alunos Ativos"
            value={stats?.activeStudents || 0}
            icon={<AcademicCapIcon className="w-8 h-8 text-purple-500" />}
          />

          <StatsCard
            title="Professores Pendentes"
            value={stats?.pendingProfessors || 0}
            icon={<UsersIcon className="w-8 h-8 text-orange-500" />}
          />
        </div>
      </div>

      {/* Seção de Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Gerenciamento
          </h2>
          <div className="space-y-3">
            <Link href="/admin/users" className="block">
              <Button 
                variant="secondary" 
                className="w-full justify-start bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="flex items-center text-gray-700 dark:text-gray-200">
                  <UsersIcon className="w-5 h-5 mr-2" />
                  Gerenciar Usuários
                </span>
              </Button>
            </Link>

            <Link href="/admin/professors/pending" className="block">
              <Button 
                variant="secondary" 
                className="w-full justify-start bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="flex items-center text-gray-700 dark:text-gray-200">
                  <AcademicCapIcon className="w-5 h-5 mr-2" />
                  Professores Pendentes
                </span>
              </Button>
            </Link>

            <Link href="/admin/courses" className="block">
              <Button 
                variant="secondary" 
                className="w-full justify-start bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="flex items-center text-gray-700 dark:text-gray-200">
                  <BookOpenIcon className="w-5 h-5 mr-2" />
                  Gerenciar Cursos
                </span>
              </Button>
            </Link>

            <Link href="/admin/payments" className="block">
              <Button 
                variant="secondary" 
                className="w-full justify-start bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="flex items-center text-gray-700 dark:text-gray-200">
                  <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                  Gerenciar Pagamentos
                </span>
              </Button>
            </Link>

            <Link href="/admin/reports" className="block">
              <Button 
                variant="secondary" 
                className="w-full justify-start bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="flex items-center text-gray-700 dark:text-gray-200">
                  <ChartBarIcon className="w-5 h-5 mr-2" />
                  Relatórios
                </span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Configurações do Sistema
          </h2>
          <div className="space-y-3">
            <Link href="/admin/settings/general" className="block">
              <Button 
                variant="secondary" 
                className="w-full justify-start bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="text-gray-700 dark:text-gray-200">
                  Configurações Gerais
                </span>
              </Button>
            </Link>

            <Link href="/admin/settings/payments" className="block">
              <Button 
                variant="secondary" 
                className="w-full justify-start bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="text-gray-700 dark:text-gray-200">
                  Configurações de Pagamento
                </span>
              </Button>
            </Link>

            <Link href="/admin/settings/email" className="block">
              <Button 
                variant="secondary" 
                className="w-full justify-start bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="text-gray-700 dark:text-gray-200">
                  Configurações de Email
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 