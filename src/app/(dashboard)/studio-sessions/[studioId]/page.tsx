'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { FullScreenLoading } from '@/components/common/Loading';
import StudioHeader from '@/components/studio-sessions/StudioHeader';
import StudioScheduler from '@/components/studio-sessions/StudioScheduler';
import StudentSelectionModal from '@/components/studio-sessions/StudentSelectionModal';
import StudioNotFoundMessage from '@/components/studio-sessions/StudioNotFoundMessage';
import SessionConfirmationList from '@/components/studio-sessions/SessionConfirmationList';
import { createStudioSession, updateStudentSessionStatus, getStudents, Student, removeStudentFromSession } from '@/services/firebase-studio-sessions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { app } from '@/config/firebase';
import { collections } from '@/services/firebase';
import Link from 'next/link';

// Dados das unidades (normalmente viriam de um serviço ou API)
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

// Interface para a sessão selecionada
interface SelectedSession {
  date: Date;
  time: string;
}

// Interface para estudante com status de confirmação
interface StudentWithStatus {
  id: string;
  name: string;
  instrument: string;
  status: 'confirmed' | 'declined' | 'pending';
  email?: string;
}

export default function StudioSessionPage({ params }: { params: { studioId: string } }) {
  const router = useRouter();
  const { user, loading, airtableUser } = useAuthContext();
  const [studio, setStudio] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SelectedSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionConfirmed, setSessionConfirmed] = useState(false);
  const [invitedStudents, setInvitedStudents] = useState<StudentWithStatus[]>([]);
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingStudents, setIsAddingStudents] = useState(false);
  const [addStudentsMessage, setAddStudentsMessage] = useState<string | null>(null);
  const [schedulerKey, setSchedulerKey] = useState(0);
  
  // Extrair o studioId do objeto params usando React.use()
  const resolvedParams = use(params);
  const studioId = resolvedParams.studioId;
  
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
    
    // Buscar informações do estúdio selecionado
    const studioData = studios.find(s => s.id === studioId);
    setStudio(studioData);
  }, [user, loading, router, airtableUser, studioId]);

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

  if (loading) {
    return <FullScreenLoading />;
  }

  if (!isAuthorized) {
    return <StudioNotFoundMessage />;
  }

  if (!studio) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Estúdio não encontrado
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            O estúdio que você está procurando não existe ou não está disponível.
          </p>
          <button
            onClick={() => router.push('/studio-sessions')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
          >
            Voltar para a lista de estúdios
          </button>
        </div>
      </div>
    );
  }

  const handleTimeSelect = (date: Date, time: string) => {
    setSelectedSession({ date, time });
    setIsModalOpen(true);
    setIsAddingStudents(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsAddingStudents(false);
  };

  const handleConfirmBooking = async (selectedStudentIds: string[]) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!user || !airtableUser || !selectedSession) {
        throw new Error('Dados incompletos para criar a sessão.');
      }
      
      // Se estamos adicionando alunos a uma sessão existente
      if (isAddingStudents && sessionId) {
        // Obter dados dos alunos selecionados
        const allStudents = await getStudents();
        const newStudents: StudentWithStatus[] = [];
        
        for (const studentId of selectedStudentIds) {
          // Verificar se o aluno já está na sessão
          const existingStudent = invitedStudents.find(s => s.id === studentId);
          if (existingStudent) continue;
          
          // Buscar dados do aluno
          const studentData = allStudents.find(s => s.id === studentId);
          if (studentData) {
            // Adicionar aluno na sessão do banco de dados
            await updateStudentSessionStatus(sessionId, studentId, 'pending');
            
            // Adicionar à lista local
            newStudents.push({
              id: studentId,
              name: studentData.name,
              instrument: studentData.instrument || '',
              email: studentData.email,
              status: 'pending'
            });
          }
        }
        
        // Atualizar a lista local com os novos alunos
        setInvitedStudents(prev => [...prev, ...newStudents]);
        setAddStudentsMessage(`${newStudents.length} novo(s) aluno(s) adicionado(s) à sessão.`);
        setTimeout(() => {
          setAddStudentsMessage(null);
        }, 3000);
        
        setIsModalOpen(false);
        setIsAddingStudents(false);
        setIsSubmitting(false);
        return;
      }
      
      // Criação de uma nova sessão
      // Obter dados dos alunos selecionados
      const allStudents = await getStudents();
      const students: Record<string, any> = {};
      
      // Preparar objeto com os alunos convidados
      selectedStudentIds.forEach(id => {
        const studentData = allStudents.find(s => s.id === id);
        if (studentData) {
          students[id] = {
            id,
            name: studentData.name,
            instrument: studentData.instrument || '',
            email: studentData.email,
            status: 'pending'
          };
        }
      });
      
      // Formata dados para salvar no banco
      const sessionData = {
        studioId: studio.id,
        studioName: studio.name,
        date: selectedSession.date.toISOString(),
        time: selectedSession.time,
        professorId: user.uid,
        professorName: airtableUser.fields.name || 'Professor',
        students
      };
      
      // Salva no banco de dados
      const createdSession = await createStudioSession(sessionData);
      setSessionId(createdSession.sessionId);
      
      // Cria a lista de alunos para exibição
      const studentsWithStatus: StudentWithStatus[] = selectedStudentIds
        .map(id => {
          const studentData = students[id];
          if (studentData) {
            return {
              id,
              name: studentData.name,
              instrument: studentData.instrument || '',
              status: 'pending' as const,
              email: studentData.email
            };
          }
          return null;
        })
        .filter((s): s is StudentWithStatus => s !== null);
      
      setInvitedStudents(studentsWithStatus);
      setSessionConfirmed(true);
      setIsModalOpen(false);
      setShowConfirmationMessage(true);
      
      // Esconder a mensagem de confirmação após 3 segundos
      setTimeout(() => {
        setShowConfirmationMessage(false);
      }, 3000);
      
      // Forçar recarga do componente StudioScheduler para atualizar os horários ocupados
      setSchedulerKey(prev => prev + 1);
      
      // Aqui seria implementada a lógica para enviar notificações aos alunos
      console.log('Sessão de estúdio criada com sucesso:', createdSession.sessionId);
    } catch (err: any) {
      console.error('Erro ao criar sessão de estúdio:', err);
      setError(err.message || 'Erro ao criar sessão de estúdio');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lidar com a resposta de um aluno
  const handleStudentResponse = async (studentId: string, status: 'confirmed' | 'declined') => {
    try {
      if (!sessionId) {
        throw new Error('ID da sessão não encontrado');
      }
      
      // Atualiza o status no banco de dados
      await updateStudentSessionStatus(sessionId, studentId, status);
      
      // Não é mais necessário atualizar manualmente a lista de alunos aqui
      // O listener em tempo real já irá atualizar o estado automaticamente
    } catch (err: any) {
      console.error('Erro ao atualizar status do aluno:', err);
      alert(`Erro ao atualizar status: ${err.message}`);
    }
  };
  
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
      
      // Atualizar o estado local
      setInvitedStudents(prevStudents => 
        prevStudents.filter(student => student.id !== studentId)
      );
      
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.push('/studio-sessions')}
          className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Voltar para a lista de estúdios
        </button>

        <Link
          href="/studio-sessions/minhas-sessoes"
          className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Minhas Sessões
        </Link>
      </div>
      
      {showConfirmationMessage && (
        <div className="fixed top-4 right-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in-out">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Sessão marcada com sucesso! Os alunos foram notificados.</span>
          </div>
        </div>
      )}
      
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
      
      {error && (
        <div className="mb-6 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-6 py-4 rounded-lg">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
      
      <StudioHeader studio={studio} />
      
      {!sessionConfirmed ? (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Agende uma Sessão
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Selecione um dia e horário disponível para agendar sua sessão no estúdio.
          </p>
          
          <StudioScheduler 
            key={schedulerKey} 
            onTimeSelect={handleTimeSelect} 
            studioId={studioId} 
          />
        </div>
      ) : (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Sessão Agendada
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Sua sessão foi agendada para {format(selectedSession!.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {selectedSession!.time}.
            Abaixo você pode acompanhar a confirmação dos alunos.
          </p>
          
          <SessionConfirmationList 
            studioName={studio.name}
            sessionDate={selectedSession!.date}
            sessionTime={selectedSession!.time}
            students={invitedStudents}
            onAddStudents={handleAddStudents}
            onRemoveStudent={handleRemoveStudent}
          />
          
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
                    Você foi convidado(a) para a sessão no estúdio dia {format(selectedSession!.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {selectedSession!.time} no {studio.name} pelo professor(a) {airtableUser?.fields.name || "Professor"}!
                  </p>
                  
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
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                setSessionConfirmed(false);
                // Forçar recarga do componente StudioScheduler para atualizar os horários ocupados
                setSchedulerKey(prev => prev + 1);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
            >
              Agendar Nova Sessão
            </button>
          </div>
        </div>
      )}
      
      {isModalOpen && selectedSession && (
        <StudentSelectionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmBooking}
          sessionDate={selectedSession.date}
          sessionTime={selectedSession.time}
        />
      )}
    </div>
  );
} 