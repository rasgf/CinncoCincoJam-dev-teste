'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentStudioSessions } from '@/services/firebase-studio-sessions';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface GlobalSessionAlertProps {
  studentId: string;
}

// Declarar o nome personalizado do evento
export const SESSION_RESPONSE_EVENT = 'studio-session-response';

export default function GlobalSessionAlert({ studentId }: GlobalSessionAlertProps) {
  const [pendingSessions, setPendingSessions] = useState<number>(0);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  
  // Função para buscar sessões pendentes
  const fetchPendingSessions = async () => {
    try {
      setLoading(true);
      const sessions = await getStudentStudioSessions(studentId);
      
      // Filtrar sessões ativas e pendentes (não confirmadas nem recusadas)
      const pendingSessions = sessions.filter(
        session => 
          (session.status === 'active' || !session.status) && 
          session.students[studentId]?.status === 'pending'
      );
      
      console.log('Sessões pendentes encontradas:', pendingSessions.length);
      setPendingSessions(pendingSessions.length);
    } catch (error) {
      console.error('Erro ao buscar sessões pendentes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Verificar se há alguma sessão pendente para o aluno
  useEffect(() => {
    // Verificar inicialmente e a cada 2 minutos
    fetchPendingSessions();
    const interval = setInterval(fetchPendingSessions, 120000);
    
    return () => clearInterval(interval);
  }, [studentId]);
  
  // Adicionar ouvinte para o evento personalizado de resposta à sessão
  useEffect(() => {
    // Função para atualizar as sessões quando um convite for respondido
    const handleSessionResponse = () => {
      console.log('Evento de resposta à sessão recebido');
      fetchPendingSessions();
    };
    
    // Adicionar ouvinte para o evento personalizado
    window.addEventListener(SESSION_RESPONSE_EVENT, handleSessionResponse);
    
    // Remover ouvinte quando o componente for desmontado
    return () => {
      window.removeEventListener(SESSION_RESPONSE_EVENT, handleSessionResponse);
    };
  }, []);
  
  const handleDismiss = () => {
    setDismissed(true);
    
    // Salvar a preferência de dismissão no localStorage
    try {
      localStorage.setItem('session_alert_dismissed', 'true');
      
      // Voltar a mostrar após 1 hora
      setTimeout(() => {
        localStorage.removeItem('session_alert_dismissed');
        setDismissed(false);
      }, 3600000);
    } catch (error) {
      console.error('Erro ao salvar preferência de alerta:', error);
    }
  };
  
  useEffect(() => {
    // Verificar se o alerta foi dispensado anteriormente
    try {
      const isDismissed = localStorage.getItem('session_alert_dismissed') === 'true';
      setDismissed(isDismissed);
    } catch (error) {
      console.error('Erro ao verificar preferência de alerta:', error);
    }
  }, []);
  
  const handleGoToSessions = () => {
    router.push('/profile#sessions');
  };
  
  if (loading || pendingSessions === 0 || dismissed) {
    return null;
  }
  
  return (
    <div className="fixed top-20 right-4 z-50 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg shadow-lg max-w-xs animate-fade-in">
      <div className="flex justify-between">
        <div className="flex items-center text-yellow-800 dark:text-yellow-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="font-semibold">Convites pendentes</h3>
            <p className="text-sm">
              Você tem {pendingSessions} convite{pendingSessions !== 1 ? 's' : ''} de sessão de estúdio aguardando sua confirmação.
            </p>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 ml-2"
          aria-label="Dispensar notificação"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-3">
        <button
          onClick={handleGoToSessions}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 px-3 rounded-md text-sm font-medium"
        >
          Ver convites
        </button>
      </div>
    </div>
  );
} 