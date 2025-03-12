'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    // Se não estiver carregando, podemos tomar a decisão de redirecionamento
    if (!loading) {
      if (user) {
        // Usuário autenticado, redireciona para o perfil
        router.push('/dashboard/profile');
      } else {
        // Sem usuário, redireciona sempre para login
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Para evitar redirecionamentos incorretos, vamos iniciar o redirecionamento 
  // para login se a página raiz for carregada
  useEffect(() => {
    // Redirecionamento de segurança: se a página principal for acessada diretamente,
    // redireciona para login após um breve tempo, mesmo durante o carregamento
    const timeout = setTimeout(() => {
      if (window.location.pathname === '/') {
        router.push('/login');
      }
    }, 300); // Um pequeno atraso para dar tempo do Firebase auth inicializar

    return () => clearTimeout(timeout);
  }, [router]);

  // Exibir um indicador de carregamento enquanto verifica a autenticação
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">CincoCincoJam</h1>
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}
