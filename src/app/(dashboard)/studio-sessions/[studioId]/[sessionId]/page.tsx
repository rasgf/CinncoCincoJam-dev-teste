'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { FullScreenLoading } from '@/components/common/Loading';
import StudioHeader from '@/components/studio-sessions/StudioHeader';
import SessionConfirmationList from '@/components/studio-sessions/SessionConfirmationList';
import { getStudioSession, updateStudentSessionStatus, removeStudentFromSession, cancelStudioSession } from '@/services/firebase-studio-sessions';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { app } from '@/config/firebase';
import { collections } from '@/services/firebase';
import StudentSelectionModal from '@/components/studio-sessions/StudentSelectionModal';
import Link from 'next/link';
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon, UserGroupIcon } from '@heroicons/react/24/outline';

// Dados das unidades
const studios = [
  {
    id: 'barra',
    name: 'School of Rock - Barra da Tijuca',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2558&auto=format&fit=crop',
    address: 'Av. das Américas, 4666 - Barra da Tijuca, Rio de Janeiro - RJ, 22640-102',
    phone: '(21) 3030-4040',
    description: 'Estúdio completo com equipamentos profissionais, sala acústica e instrumentos de alta qualidade.'
  },
  {
    id: 'copacabana',
    name: 'School of Rock - Copacabana',
    image: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?q=80&w=2670&auto=format&fit=crop',
    address: 'Av. Nossa Sra. de Copacabana, 1417 - Copacabana, Rio de Janeiro - RJ, 22070-011',
    phone: '(21) 3030-5050',
    description: 'Ambiente moderno com tecnologia de ponta, isolamento acústico e equipamentos premium.'
  },
  {
    id: 'ipanema',
    name: 'School of Rock - Ipanema',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=2670&auto=format&fit=crop',
    address: 'Rua Visconde de Pirajá, 351 - Ipanema, Rio de Janeiro - RJ, 22410-003',
    phone: '(21) 3030-6060',
    description: 'Studio premium com sala de gravação profissional, equipamentos de última geração e conforto acústico.'
  }
];

// Interface para estudante com status de confirmação
interface StudentWithStatus {
  id: string;
  name: string;
  instrument: string;
  status: 'confirmed' | 'declined' | 'pending';
  email?: string;
}

export default function SessionDetailsPage({ params }: { params: { studioId: string, sessionId: string } }) {
  const router = useRouter();
  const { user, loading, airtableUser } = useAuthContext();
  const [studio, setStudio] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [invitedStudents, setInvitedStudents] = useState<StudentWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingStudents, setIsAddingStudents] = useState(false);
  const [addStudentsMessage, setAddStudentsMessage] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);
  
  // Extrair os parâmetros da URL
  const resolvedParams = use(params);
  const studioId = resolvedParams.studioId;
  const sessionId = resolvedParams.sessionId;
  
  // Carregar dados do estúdio
  useEffect(() => {
    const studioData = studios.find(s => s.id === studioId);
    setStudio(studioData);
  }, [studioId]);
  
  // Verificar autenticação e autorização
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Verificar se o usuário é o professor específico ou um administrador
    if (airtableUser) {
      const isTargetProfessor = airtableUser.fields.email === 'professor@4tuna.com.br';
      const isAdmin = airtableUser.fields.role === 'admin';
      
      setIsAuthorized(isTargetProfessor || isAdmin);
    }
  }, [user, loading, router, airtableUser]);

  // Carregar dados da sessão
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId || !user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const sessionData = await getStudioSession(sessionId);
        if (!sessionData) {
          setError('Sessão não encontrada');
          setIsLoading(false);
          return;
        }
        
        // Verificar se o usuário é o professor que criou a sessão
        if (sessionData.professorId !== user.uid) {
          const isAdmin = airtableUser?.fields?.role === 'admin';
          if (!isAdmin) {
            setError('Você não tem permissão para acessar esta sessão');
            setIsLoading(false);
            return;
          }
        }
        
        setSession(sessionData);
        
        // Preparar lista de alunos para exibição
        if (sessionData.students) {
          const studentsArray: StudentWithStatus[] = Object.entries(sessionData.students).map(
            ([id, data]: [string, any]) => ({
              id,
              name: data.name,
              instrument: data.instrument || '',
              status: data.status,
              email: data.email
            })
          );
          
          setInvitedStudents(studentsArray);
        }
        
      } catch (err: any) {
        console.error('Erro ao carregar dados da sessão:', err);
        setError('Erro ao carregar dados da sessão. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading && user) {
      fetchSessionData();
    }
  }, [sessionId, user, loading, airtableUser]);
  
  // Configurar listener em tempo real para atualizações de status dos alunos
  useEffect(() => {
    if (sessionId) {
      const db = getDatabase(app);
      const sessionRef = ref(db, `${collections.studio_sessions}/${sessionId}/students`);
      
      // Função que será chamada sempre que houver uma atualização no banco
      const handleStudentsStatusChanges = (snapshot: any) => {
        if (snapshot.exists()) {
          const studentsData = snapshot.val();
          
          // Mapear para o formato StudentWithStatus[]
          const updatedStudents: StudentWithStatus[] = Object.entries(studentsData).map(
            ([id, data]: [string, any]) => ({
              id,
              name: data.name,
              instrument: data.instrument || '',
              status: data.status,
              email: data.email
            })
          );
          
          // Atualizar o estado com os novos dados
          setInvitedStudents(updatedStudents);
        }
      };
      
      // Registrar o listener
      onValue(sessionRef, handleStudentsStatusChanges);
      
      // Limpar o listener quando o componente for desmontado
      return () => {
        off(sessionRef, 'value', handleStudentsStatusChanges);
      };
    }
  }, [sessionId]);
  
  // Abrir modal para adicionar novos alunos
  const handleAddStudents = () => {
    setIsAddingStudents(true);
    setIsModalOpen(true);
  };
  
  // Remover um aluno da sessão
  const handleRemoveStudent = async (studentId: string) => {
    try {
      if (!sessionId) {
        throw new Error('ID da sessão não encontrado');
      }
      
      // Remover o aluno da sessão no banco de dados
      await removeStudentFromSession(sessionId, studentId);
      
      // Atualizar o estado local (não é mais necessário pelo listener em tempo real)
      // setInvitedStudents(prevStudents => prevStudents.filter(student => student.id !== studentId));
      
      // Mostrar mensagem de sucesso
      setAddStudentsMessage('Aluno removido da sessão com sucesso.');
      setTimeout(() => {
        setAddStudentsMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Erro ao remover aluno da sessão:', err);
      setError(err.message || 'Erro ao remover aluno da sessão');
    }
  };
  
  // Lidar com a confirmação de novos alunos selecionados
  const handleConfirmBooking = async (selectedStudentIds: string[]) => {
    // Esta funcionalidade seria implementada quando adicionarmos a funcionalidade de adicionar mais alunos
    setIsModalOpen(false);
  };
  
  // Fechar o modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsAddingStudents(false);
  };

  // Cancelar a sessão
  const handleCancelSession = async () => {
    try {
      setIsCanceling(true);
      
      await cancelStudioSession(sessionId, cancelReason);
      
      // Atualizar o estado local
      setSession(prev => ({
        ...prev,
        status: 'canceled',
        cancelReason
      }));
      
      setShowCancelModal(false);
      setAddStudentsMessage('Sessão cancelada com sucesso. Os alunos foram notificados.');
      setTimeout(() => {
        setAddStudentsMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Erro ao cancelar sessão:', err);
      setError('Não foi possível cancelar a sessão. Tente novamente mais tarde.');
    } finally {
      setIsCanceling(false);
    }
  };

  if (loading || isLoading) {
    return <FullScreenLoading />;
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Acesso não autorizado
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Você não tem permissão para acessar esta página.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
          >
            Voltar para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Erro
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error}
          </p>
          <button
            onClick={() => router.push('/studio-sessions/minhas-sessoes')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
          >
            Voltar para Minhas Sessões
          </button>
        </div>
      </div>
    );
  }

  if (!session || !studio) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Sessão não encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            A sessão que você está procurando não existe ou não está disponível.
          </p>
          <button
            onClick={() => router.push('/studio-sessions/minhas-sessoes')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
          >
            Voltar para Minhas Sessões
          </button>
        </div>
      </div>
    );
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
            <li>
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <Link href="/studio-sessions/minhas-sessoes" className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white">
                  Minhas Sessões
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">Detalhes da Sessão</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>
      
      {addStudentsMessage && (
        <div className="fixed top-4 right-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in-out">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{addStudentsMessage}</span>
          </div>
        </div>
      )}
      
      <StudioHeader studio={studio} />
      
      <div className="mt-8">
        {/* Cabeçalho da sessão */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {session.status === 'canceled' ? 'Sessão Cancelada' : 'Sessão Agendada'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {session.status === 'canceled' 
                  ? `A sessão que estava agendada para ${format(parseISO(session.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às ${session.time} foi cancelada.`
                  : `Sua sessão está agendada para ${format(parseISO(session.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às ${session.time}.`
                }
              </p>
              {session.status === 'canceled' && session.cancelReason && (
                <p className="mt-2 text-red-600 dark:text-red-400">
                  <span className="font-medium">Motivo do cancelamento:</span> {session.cancelReason}
                </p>
              )}
              {session.createdAt && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Sessão criada em {format(parseISO(session.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </p>
              )}
            </div>
            
            {session.status !== 'canceled' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="mt-2 md:mt-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Cancelar Sessão
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <CalendarIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{format(parseISO(session.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              </div>
              
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <ClockIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{session.time}</span>
              </div>
              
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <MapPinIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{studio.name}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <UserIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>Agendado por: {session.professorName}</span>
              </div>
              
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <UserGroupIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{Object.keys(session.students).length} aluno(s) convidado(s)</span>
              </div>
            </div>
          </div>
        </div>
        
        <SessionConfirmationList 
          studioName={studio.name}
          sessionDate={parseISO(session.date)}
          sessionTime={session.time}
          students={invitedStudents}
          onAddStudents={session.status !== 'canceled' ? handleAddStudents : undefined}
          onRemoveStudent={session.status !== 'canceled' ? handleRemoveStudent : undefined}
        />
        
        {session.status !== 'canceled' && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Prévia da notificação para os alunos
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                
                <div className="ml-3 flex-1">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white">
                    Convite para Sessão de Estúdio
                  </h3>
                  
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Você foi convidado(a) para a sessão no estúdio dia {format(parseISO(session.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {session.time} no {studio.name} pelo professor(a) {session.professorName}!
                  </p>
                  
                  {session.createdAt && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Convite enviado em {format(parseISO(session.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                  
                  <div className="mt-3 flex space-x-3">
                    <button
                      className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 hover:bg-green-700 text-white"
                    >
                      Confirmar Presença
                    </button>
                    
                    <button
                      className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                    >
                      Não Vou Comparecer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <Link
            href="/studio-sessions/minhas-sessoes"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md inline-flex items-center"
          >
            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para Minhas Sessões
          </Link>
        </div>
      </div>
      
      {/* Modal para selecionar alunos */}
      {isModalOpen && (
        <StudentSelectionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmBooking}
          sessionDate={parseISO(session.date)}
          sessionTime={session.time}
        />
      )}
      
      {/* Modal para cancelar sessão */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Cancelar Sessão
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Tem certeza que deseja cancelar esta sessão? Todos os alunos convidados serão notificados.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivo do cancelamento (opcional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                rows={3}
                placeholder="Informe um motivo para o cancelamento..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-md"
                disabled={isCanceling}
              >
                Não, manter sessão
              </button>
              <button
                onClick={handleCancelSession}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md flex items-center"
                disabled={isCanceling}
              >
                {isCanceling ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cancelando...
                  </>
                ) : (
                  'Sim, cancelar sessão'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 