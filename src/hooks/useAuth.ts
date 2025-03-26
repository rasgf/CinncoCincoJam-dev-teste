'use client';

import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { createUser, getUserByUid } from '@/services/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [airtableUser, setAirtableUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const firebaseUserData = await getUserByUid(user.uid);
          setAirtableUser(firebaseUserData);
        } catch (error) {
          console.error('Error fetching Firebase user:', error);
        }
      } else {
        setAirtableUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, name?: string, isProfessor: boolean = false) => {
    try {
      console.log('Signup - Iniciando registro com:', { email, isProfessor, name });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Criar usuário no Firebase
      const createdUser = await createUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        name,
        role: isProfessor ? 'professor' : 'aluno'
      });
      
      console.log('Signup - Usuário criado no Firebase:', createdUser);
      
      // Se for um professor, criar o registro de professor
      if (isProfessor) {
        console.log('Signup - Criando registro de professor');
        try {
          const { createProfessor } = await import('@/services/firebase-professors');
          const professor = await createProfessor({
            user_id: userCredential.user.uid,
            name: name || '',
            email: userCredential.user.email!,
            status: 'pending' // Professores começam com status pendente
          });
          
          console.log('Signup - Registro de professor criado:', professor);
        } catch (professorError) {
          console.error('Signup - Erro ao criar registro de professor:', professorError);
        }
      }
      
      // Atualizar os dados do usuário localmente
      const firebaseUserData = await getUserByUid(userCredential.user.uid);
      setAirtableUser(firebaseUserData);
      console.log('Signup - Dados do usuário atualizados localmente:', firebaseUserData);
      
      return userCredential;
    } catch (error) {
      console.error('Error in signup:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    setAirtableUser(null);
    return signOut(auth);
  };

  const refreshUser = async () => {
    if (user) {
      try {
        console.log('Atualizando dados do usuário Firebase:', user.uid);
        const firebaseUserData = await getUserByUid(user.uid);
        
        if (!firebaseUserData) {
          console.warn('Dados do usuário não encontrados no Firebase. Verificar se o usuário foi criado corretamente.');
          return null;
        }
        
        console.log('Dados atualizados recebidos:', firebaseUserData);
        setAirtableUser(firebaseUserData);
        return firebaseUserData;
      } catch (error) {
        console.error('Error refreshing Firebase user:', error);
        throw error;
      }
    }
    return null;
  };

  return {
    user,
    airtableUser,
    loading,
    signup,
    login,
    logout,
    setAirtableUser,
    refreshUser,
  };
}

export type AuthHookReturn = ReturnType<typeof useAuth>; 