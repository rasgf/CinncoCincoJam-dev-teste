'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { updateStudentSessionStatus } from '@/services/firebase-studio-sessions';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface StudioSessionNotificationProps {
  sessionId: string;
  studentId: string;
  studioName: string;
  professorName: string;
  date: Date;
  time: string;
  initialStatus?: 'pending' | 'confirmed' | 'declined';
  onStatusChange?: (sessionId: string, status: 'confirmed' | 'declined') => void;
}

export default function StudioSessionNotification({
  sessionId,
  studentId,
  studioName,
  professorName,
  date,
  time,
  initialStatus = 'pending',
  onStatusChange
}: StudioSessionNotificationProps) {
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'declined'>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (response: 'confirmed' | 'declined') => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Atualizar status no banco de dados
      await updateStudentSessionStatus(sessionId, studentId, response);
      
      // Atualizar estado local
      setStatus(response);
      
      // Notificar componente pai, se necessário
      if (onStatusChange) {
        onStatusChange(sessionId, response);
      }
    } catch (err: any) {
      console.error('Erro ao atualizar status da sessão:', err);
      setError('Falha ao atualizar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-start">
        <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
          status === 'confirmed' 
            ? 'bg-green-500 dark:bg-green-400' 
            : status === 'declined' 
              ? 'bg-red-500 dark:bg-red-400' 
              : 'bg-blue-500 dark:bg-blue-400'
        }`} />
        
        <div className="ml-3 flex-1">
          <h3 className="text-md font-medium text-gray-900 dark:text-white">
            Convite para Sessão de Estúdio
          </h3>
          
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Você foi convidado(a) para a sessão no estúdio dia {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {time} no {studioName} pelo professor(a) {professorName}!
          </p>
          
          {error && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          
          {status === 'pending' ? (
            <div className="mt-3 flex space-x-3">
              <button
                onClick={() => handleConfirm('confirmed')}
                disabled={isLoading}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  isLoading
                    ? 'bg-green-400 text-white cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isLoading ? 'Confirmando...' : 'Confirmar Presença'}
              </button>
              
              <button
                onClick={() => handleConfirm('declined')}
                disabled={isLoading}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  isLoading
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                }`}
              >
                {isLoading ? 'Processando...' : 'Não Vou Comparecer'}
              </button>
            </div>
          ) : (
            <div className="mt-3">
              {status === 'confirmed' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Presença Confirmada
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  <XCircleIcon className="w-4 h-4 mr-1" />
                  Não Vou Comparecer
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 