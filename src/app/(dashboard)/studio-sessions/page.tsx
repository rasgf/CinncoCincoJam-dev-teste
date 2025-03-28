'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { FullScreenLoading } from '@/components/common/Loading';
import StudiosGrid from '@/components/studio-sessions/StudiosGrid';
import StudioNotFoundMessage from '@/components/studio-sessions/StudioNotFoundMessage';
import Link from 'next/link';
import Image from 'next/image';

export default function StudioSessionsPage() {
  const router = useRouter();
  const { user, loading, airtableUser } = useAuthContext();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }

    // Verificar se o usuário é o professor específico ou um administrador
    if (airtableUser) {
      const isTargetProfessor = airtableUser.fields.email === 'professor@4tuna.com.br';
      const isAdmin = airtableUser.fields.role === 'admin';
      
      setIsAuthorized(isTargetProfessor || isAdmin);
    }
  }, [user, loading, router, airtableUser]);

  if (loading) {
    return <FullScreenLoading />;
  }

  if (!isAuthorized) {
    return <StudioNotFoundMessage />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Estúdios Disponíveis
          </h1>
          <p className="text-md text-gray-600 dark:text-gray-400">
            Selecione um estúdio para agendar uma sessão
          </p>
        </div>
        <Link
          href="/studio-sessions/minhas-sessoes"
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Minhas Sessões
        </Link>
      </div>
      
      <StudiosGrid />
    </div>
  );
} 