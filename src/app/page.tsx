'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard/profile');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

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
