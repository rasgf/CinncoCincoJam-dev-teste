'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import Link from 'next/link';
import { UserIcon, BookOpenIcon, ClockIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function DashboardClient() {
  const { user, airtableUser } = useAuthContext();
  const [loading, setLoading] = useState(true);

  // Verificar se o usuário atual é um professor
  const isProfessor = airtableUser?.fields?.role === 'professor';

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Dashboard
      </h1>
      
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Bem-vindo, {airtableUser?.fields?.name || user?.email || 'Usuário'}</h2>
            <p className="text-gray-600">Aqui está uma visão geral da sua conta.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/profile"
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center hover:shadow-lg transition-shadow"
            >
              <UserIcon className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Meu Perfil</h2>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Gerencie suas informações pessoais e preferências
              </p>
            </Link>
            
            <Link
              href="/courses"
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center hover:shadow-lg transition-shadow"
            >
              <BookOpenIcon className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Cursos</h2>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Explore cursos disponíveis para aprender e evoluir
              </p>
            </Link>
            
            {isProfessor && (
              <Link
                href="/studio-sessions/minhas-sessoes"
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center hover:shadow-lg transition-shadow"
              >
                <ClockIcon className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Minhas Sessões</h2>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Gerencie sessões de estúdio agendadas e seus alunos
                </p>
              </Link>
            )}
            
            <Link
              href="/messages"
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center hover:shadow-lg transition-shadow"
            >
              <EnvelopeIcon className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mensagens</h2>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Converse com professores e outros alunos
              </p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 