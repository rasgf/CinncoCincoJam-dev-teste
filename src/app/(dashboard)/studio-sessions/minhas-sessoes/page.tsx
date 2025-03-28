'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { FullScreenLoading } from '@/components/common/Loading';
import { getProfessorStudioSessions, StudioSession } from '@/services/firebase-studio-sessions';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserGroupIcon, 
  MapPinIcon,
  ArrowRightIcon,
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon as ClockIconOutline
} from '@heroicons/react/24/outline';

export default function MinhasSessoesPage() {
  const router = useRouter();
  const { user, loading, airtableUser } = useAuthContext();
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    const fetchSessions = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const professorSessions = await getProfessorStudioSessions(user.uid);
        
        // Filtrar sessões canceladas
        const activeSessions = professorSessions.filter(session => session.status !== 'canceled');
        
        // Ordenar sessões por data (mais recentes primeiro)
        const sortedSessions = [...activeSessions].sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        
        setSessions(sortedSessions);
      } catch (err: any) {
        console.error('Erro ao buscar sessões:', err);
        setError('Não foi possível carregar suas sessões. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading && user) {
      fetchSessions();
    }
  }, [user, loading, router, refreshKey]);

  // Calcular estatísticas para cada sessão
  const getSessionStats = (session: StudioSession) => {
    const students = Object.values(session.students || {});
    const confirmedCount = students.filter(s => s.status === 'confirmed').length;
    const declinedCount = students.filter(s => s.status === 'declined').length;
    const pendingCount = students.filter(s => s.status === 'pending').length;
    const totalCount = students.length;
    
    return { confirmedCount, declinedCount, pendingCount, totalCount };
  };

  // Função para determinar se a sessão é passada, atual ou futura
  const getSessionStatus = (sessionDate: string, sessionTime: string) => {
    const now = new Date();
    const [hour, minute] = sessionTime.split(':').map(Number);
    
    const sessionDateTime = new Date(sessionDate);
    sessionDateTime.setHours(hour, minute, 0, 0);
    
    // Sessão é no passado
    if (sessionDateTime < now) {
      return 'past';
    }
    
    // Sessão é hoje
    if (
      sessionDateTime.getDate() === now.getDate() &&
      sessionDateTime.getMonth() === now.getMonth() &&
      sessionDateTime.getFullYear() === now.getFullYear()
    ) {
      return 'today';
    }
    
    // Sessão é no futuro
    return 'future';
  };

  if (loading || isLoading) {
    return <FullScreenLoading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                <svg className="w-3 h-3 mr-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                </svg>
                Dashboard
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <Link href="/studio-sessions" className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white">
                  Estúdios
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">Minhas Sessões</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Minhas Sessões de Estúdio
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Visualize e gerencie todas as sessões que você agendou
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => router.push('/studio-sessions')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Agendar Nova Sessão
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-6 py-4 rounded-lg">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="mt-2 text-blue-600 dark:text-blue-400 underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <CalendarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma sessão agendada
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você ainda não agendou nenhuma sessão de estúdio.
          </p>
          <button
            onClick={() => router.push('/studio-sessions')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Agendar Primeira Sessão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const { confirmedCount, declinedCount, pendingCount, totalCount } = getSessionStats(session);
            const sessionStatus = getSessionStatus(session.date, session.time);
            
            return (
              <div 
                key={session.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-t-4 ${
                  sessionStatus === 'past' 
                    ? 'border-gray-400 dark:border-gray-600' 
                    : sessionStatus === 'today' 
                      ? 'border-green-500 dark:border-green-400' 
                      : 'border-blue-500 dark:border-blue-400'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-[70%]">
                      {session.studioName}
                    </h2>
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sessionStatus === 'past' 
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' 
                          : sessionStatus === 'today' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}
                    >
                      {sessionStatus === 'past' ? 'Passada' : sessionStatus === 'today' ? 'Hoje' : 'Futura'}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <CalendarIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span>{format(parseISO(session.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <ClockIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span>{session.time}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPinIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span className="truncate">{session.studioName}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <UserGroupIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span>{totalCount} aluno{totalCount !== 1 ? 's' : ''} convidado{totalCount !== 1 ? 's' : ''}</span>
                    </div>
                    
                    {session.createdAt && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Criada em {format(parseISO(session.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="bg-green-50 dark:bg-green-900/10 p-2 rounded-lg text-center">
                      <div className="flex items-center justify-center mb-1">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 dark:text-green-400 mr-1" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">{confirmedCount}</span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400">Confirmados</p>
                    </div>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded-lg text-center">
                      <div className="flex items-center justify-center mb-1">
                        <ClockIconOutline className="h-4 w-4 text-yellow-500 dark:text-yellow-400 mr-1" />
                        <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">{pendingCount}</span>
                      </div>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">Pendentes</p>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded-lg text-center">
                      <div className="flex items-center justify-center mb-1">
                        <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-400 mr-1" />
                        <span className="text-sm font-medium text-red-700 dark:text-red-400">{declinedCount}</span>
                      </div>
                      <p className="text-xs text-red-600 dark:text-red-400">Recusados</p>
                    </div>
                  </div>
                  
                  <Link
                    href={`/studio-sessions/${session.studioId}/${session.id}`}
                    className="flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Visualizar Detalhes
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 