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
import { createUser, getUserByUid } from '@/services/airtable';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [airtableUser, setAirtableUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const airtableUserData = await getUserByUid(user.uid);
          setAirtableUser(airtableUserData);
        } catch (error) {
          console.error('Error fetching Airtable user:', error);
        }
      } else {
        setAirtableUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, name?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Criar usuário no Airtable
      await createUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        name,
        role: 'aluno'
      });

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
        const airtableUserData = await getUserByUid(user.uid);
        setAirtableUser(airtableUserData);
      } catch (error) {
        console.error('Error refreshing Airtable user:', error);
        throw error;
      }
    }
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