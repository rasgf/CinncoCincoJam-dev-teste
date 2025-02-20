'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserByUid } from '@/services/airtable';

const AuthContext = createContext<ReturnType<typeof useAuth> | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  const refreshUser = async () => {
    if (auth.user) {
      console.log('Iniciando refresh do usuário...');
      try {
        console.log('Buscando dados do usuário:', auth.user.uid);
        const airtableUserData = await getUserByUid(auth.user.uid);
        console.log('Dados recebidos do Airtable:', airtableUserData);
        auth.setAirtableUser(airtableUserData);
        console.log('Dados do usuário atualizados no contexto');
      } catch (error) {
        console.error('Erro ao atualizar dados do usuário:', error);
      }
    } else {
      console.log('Nenhum usuário autenticado para atualizar');
    }
  };

  const value = {
    ...auth,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
} 