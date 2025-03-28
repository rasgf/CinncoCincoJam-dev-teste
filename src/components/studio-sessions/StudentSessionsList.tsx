'use client';

import React, { useState, useEffect } from 'react';
import { getStudentStudioSessions, StudioSession } from '@/services/firebase-studio-sessions';
import StudioSessionNotification from './StudioSessionNotification';
import { ClockIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuthContext } from '@/contexts/AuthContext';

interface StudentSessionsListProps {
  studentId: string;
}

export default function StudentSessionsList({ studentId }: StudentSessionsListProps) {
  const { user } = useAuthContext();
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchSessions = async () => {
      if (!user?.uid) return;

      try {
        setIsLoading(true);
        setError(null);
        const studentSessions = await getStudentStudioSessions(user.uid);
        
        if (isMounted) {
          setSessions(studentSessions);
        }
      } catch (err: any) {
        console.error('Erro ao buscar sessões:', err);
        if (isMounted) {
          setError('Não foi possível carregar suas sessões. Tente novamente mais tarde.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSessions();

    return () => {
      isMounted = false;
    };
  }, [user, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Organizar sessões pelo status (pendentes primeiro) e depois por data
  const sortedSessions = [...sessions]
    // Filtrar para excluir sessões canceladas da exibição
    .filter(session => session.status !== 'canceled')
    .sort((a, b) => {
      // Verificar o status do aluno atual
      const statusA = a.students[studentId]?.status || 'pending';
      const statusB = b.students[studentId]?.status || 'pending';
      
      // Sessões pendentes vêm primeiro
      if (statusA === 'pending' && statusB !== 'pending') return -1;
      if (statusA !== 'pending' && statusB === 'pending') return 1;
      
      // Em seguida, ordenar por data (mais recente primeiro)
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    })
    // Garantir que todas as sessões tenham createdAt
    .map(session => {
      // Se não tiver createdAt, adiciona um valor padrão
      if (!session.createdAt) {
        return {
          ...session,
          createdAt: session.date // Usa a data da sessão como fallback
        };
      }
      return session;
    });

  // Contagem de sessões por status
  const pendingCount = sessions.filter(
    s => s.status === 'active' && s.students[studentId]?.status === 'pending'
  ).length;
  
  const confirmedCount = sessions.filter(
    s => s.status === 'active' && s.students[studentId]?.status === 'confirmed'
  ).length;
  
  const declinedCount = sessions.filter(
    s => s.status === 'active' && s.students[studentId]?.status === 'declined'
  ).length;
  
  const canceledCount = sessions.filter(
    s => s.status === 'canceled'
  ).length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg">
        <p>{error}</p>
        <button 
          onClick={handleRefresh}
          className="mt-2 text-blue-600 dark:text-blue-400 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>Você não tem convites de sessão de estúdio no momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Suas Sessões de Estúdio
        </h2>
        
        <button 
          onClick={handleRefresh}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar
        </button>
      </div>
      
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 border-l-4 border-blue-500 dark:border-blue-400">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendentes</h3>
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-1" />
            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
              {pendingCount}
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 border-l-4 border-green-500 dark:border-green-400">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Confirmadas</h3>
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-1" />
            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
              {confirmedCount}
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 border-l-4 border-red-500 dark:border-red-400">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Recusadas</h3>
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mr-1" />
            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
              {declinedCount}
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 border-l-4 border-gray-500 dark:border-gray-400">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Canceladas</h3>
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-1" />
            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
              {canceledCount}
            </p>
          </div>
        </div>
      </div>
      
      {sortedSessions.map((session) => {
        // Garantir que a sessão tem um createdAt válido
        const createdAtValue = session.createdAt || session.date;
        
        return (
          <StudioSessionNotification
            key={session.id}
            sessionId={session.id}
            studentId={studentId}
            studioName={session.studioName}
            professorName={session.professorName}
            date={new Date(session.date)}
            time={session.time}
            initialStatus={session.students[studentId]?.status || 'pending'}
            sessionStatus={session.status || 'active'}
            cancelReason={session.cancelReason}
            onStatusChange={handleRefresh}
            createdAt={createdAtValue}
          />
        );
      })}
    </div>
  );
} 