import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getProfessorByUserId } from '@/services/firebase-professors';
import { createCourse } from '@/services/firebase-courses';

export function CreateCourseModal({ isOpen, onClose }: CreateCourseModalProps) {
  const { airtableUser } = useAuthContext();
  const [professorId, setProfessorId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (airtableUser) {
      loadProfessorId();
    }
  }, [airtableUser]);

  const loadProfessorId = async () => {
    try {
      setLoading(true);
      const professor = await getProfessorByUserId(airtableUser!.id);
      if (professor) {
        setProfessorId(professor.id);
      } else {
        setError('Não foi possível criar seu perfil de professor');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do professor:', error);
      setError('Erro ao carregar dados do professor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professorId) {
      setError('Perfil de professor não encontrado');
      return;
    }

    try {
      setLoading(true);
      // ... resto do código de criação do curso ...
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      setError('Erro ao criar curso');
    } finally {
      setLoading(false);
    }
  };

  // ... resto do componente ...
} 