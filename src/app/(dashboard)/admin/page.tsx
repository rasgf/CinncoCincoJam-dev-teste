'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/common/Button';
import { getAdminStats } from '@/services/firebase-admin';
import { UsersIcon, BookOpenIcon, CurrencyDollarIcon, AcademicCapIcon, ChartBarIcon, UserGroupIcon, TrashIcon } from '@heroicons/react/24/outline';

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
            className={stats?.pendingProfessors > 0 ? "border-2 border-orange-500 dark:border-orange-400" : ""}
            action={
              stats?.pendingProfessors > 0 ? (
                <Link href="/admin/professors/pending">
                  <Button size="sm" className="mt-2 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700">
                    Revisar Solicitações
                  </Button>
                </Link>
              ) : null
            }
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

            <Link href="/admin/enrollments" className="block">
              <Button 
                variant="secondary" 
                className="w-full justify-start bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="flex items-center text-gray-700 dark:text-gray-200">
                  <AcademicCapIcon className="w-5 h-5 mr-2" />
                  Liberar Cursos Gratuitos
                </span>
              </Button>
            </Link>

            <a href="https://cincocincodash.a4tunados.com.br" target="_blank" rel="noopener noreferrer" className="block">
              <Button 
                variant="secondary" 
                className="w-full justify-start bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="flex items-center text-gray-700 dark:text-gray-200">
                  <ChartBarIcon className="w-5 h-5 mr-2" />
                  Relatórios
                </span>
              </Button>
            </a>
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
            
            <Link href="/admin/limpar-sessoes" className="block">
              <Button 
                variant="secondary" 
                className="w-full justify-start bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  Limpar Sessões de Teste
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminCard
          title="Gerenciar Usuários"
          icon={<UserGroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />}
          description="Visualize e gerencie todos os usuários do sistema."
          linkText="Gerenciar Usuários"
          href="/admin/users"
        />
        
        <AdminCard
          title="Limpar Sessões"
          icon={<TrashIcon className="h-8 w-8 text-red-600 dark:text-red-400" />}
          description="Limpe todas as sessões de estúdio ou atualize sessões antigas."
          linkText="Manutenção de Sessões"
          href="/admin/limpar-sessoes"
        />
      </div>
    </div>
  );
} 