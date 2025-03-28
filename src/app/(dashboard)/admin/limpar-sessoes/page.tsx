'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { clearAllStudioSessions } from '@/services/firebase-studio-sessions';
import { FullScreenLoading } from '@/components/common/Loading';
import Link from 'next/link';
import { Button } from '@/components/common/Button';

export default function LimparSessoesPage() {
  const router = useRouter();
  const { user, loading, airtableUser } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  // Verificar se o usuário é administrador
  const isAdmin = airtableUser?.fields?.role === 'admin';

  if (loading) {
    return <FullScreenLoading />;
  }

  if (!isAdmin) {
    router.push('/dashboard');
    return null;
  }

  const handleClearSessions = async () => {
    if (window.confirm('Tem certeza que deseja limpar todas as sessões de estúdio? Esta ação não pode ser desfeita.')) {
      try {
        setIsSubmitting(true);
        const result = await clearAllStudioSessions();
        setMessage(result.message);
      } catch (error: any) {
        setMessage(`Erro: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleUpdateOldSessions = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/update-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ forceUpdate: false })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUpdateMessage(result.message);
      } else {
        setUpdateMessage(`Erro: ${result.message}`);
      }
    } catch (error: any) {
      setUpdateMessage(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceUpdateAllSessions = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/update-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ forceUpdate: true })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUpdateMessage(result.message);
      } else {
        setUpdateMessage(`Erro: ${result.message}`);
      }
    } catch (error: any) {
      setUpdateMessage(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <Link href="/admin" className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white">
                  Admin
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">Limpar Sessões</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Manutenção de Sessões de Estúdio</h1>
        
        <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Atualizar Sessões Antigas</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Essa ação irá adicionar o campo <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">createdAt</code> a todas as sessões antigas que não possuem esse campo.
            O campo será preenchido com a data da sessão ou com a data atual.
          </p>
          
          {updateMessage && (
            <div className={`p-4 mb-4 rounded-lg ${updateMessage.includes('Erro') ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'}`}>
              {updateMessage}
            </div>
          )}
          
          <Button 
            onClick={handleUpdateOldSessions} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Atualizando...' : 'Atualizar Sessões Antigas'}
          </Button>
          
          <Button 
            onClick={handleForceUpdateAllSessions} 
            disabled={isSubmitting}
            className="ml-4 bg-amber-600 hover:bg-amber-700"
          >
            {isSubmitting ? 'Atualizando...' : 'Forçar Atualização de Todas Sessões'}
          </Button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">Limpar Todas as Sessões</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            <strong className="text-red-600 dark:text-red-400">CUIDADO:</strong> Essa ação irá remover permanentemente todas as sessões de estúdio do banco de dados.
            Use apenas para fins de teste ou limpeza do ambiente.
          </p>
          
          {message && (
            <div className={`p-4 mb-4 rounded-lg ${message.includes('Erro') ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'}`}>
              {message}
            </div>
          )}
          
          <button
            onClick={handleClearSessions}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isSubmitting 
                ? 'bg-red-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isSubmitting ? 'Limpando...' : 'Limpar Todas Sessões'}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href="/admin"
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-md"
        >
          Voltar para Admin
        </Link>
      </div>
    </div>
  );
} 