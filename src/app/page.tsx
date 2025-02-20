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
        router.push('/profile');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return null; // ou uma tela de loading enquanto verifica
}
