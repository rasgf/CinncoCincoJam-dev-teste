'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/common/Button';
import { getAdminStats } from '@/services/admin';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
        
        <div className="flex space-x-3">
          <Link href="/admin/users">
            <Button variant="secondary">Gerenciar Usuários</Button>
          </Link>
          <Link href="/admin/professors/pending">
            <Button>
              Professores Pendentes
              {stats?.pendingProfessors ? (
                <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                  {stats.pendingProfessors}
                </span>
              ) : null}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Usuários"
          value={stats?.totalUsers || 0}
          description="Todos os usuários registrados"
        />
        <StatsCard
          title="Alunos Ativos"
          value={stats?.activeStudents || 0}
          description="Alunos com matrícula ativa"
        />
        <StatsCard
          title="Cursos Publicados"
          value={stats?.totalCourses || 0}
          description="Total de cursos na plataforma"
        />
        <StatsCard
          title="Receita Total"
          value={`R$ ${(stats?.totalRevenue || 0).toFixed(2)}`}
          description="Receita total da plataforma"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="space-y-3">
            <Link href="/admin/courses" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Revisar Novos Cursos
                </span>
              </Button>
            </Link>
            <Link href="/admin/payments" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Gerenciar Pagamentos
                </span>
              </Button>
            </Link>
            <Link href="/admin/reports" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Relatórios
                </span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Configurações do Sistema</h2>
          <div className="space-y-3">
            <Link href="/admin/settings/general" className="block">
              <Button variant="secondary" className="w-full justify-start">
                Configurações Gerais
              </Button>
            </Link>
            <Link href="/admin/settings/payments" className="block">
              <Button variant="secondary" className="w-full justify-start">
                Configurações de Pagamento
              </Button>
            </Link>
            <Link href="/admin/settings/email" className="block">
              <Button variant="secondary" className="w-full justify-start">
                Configurações de Email
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 