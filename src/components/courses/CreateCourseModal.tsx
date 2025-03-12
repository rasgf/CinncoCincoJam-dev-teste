import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getProfessorByUserId } from '@/services/firebase-professors';
import { createCourse } from '@/services/firebase-courses';
import { Dialog } from '@headlessui/react';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            {/* Header */}
            <div className="border-b dark:border-gray-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Criar Curso</h2>
            </div>

            {/* Banner de Mentoria */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-[0.6rem] px-6 flex items-center justify-between">
              <div className="flex-1 pr-6">
                <h3 className="text-xl font-bold mb-2">Precisa de apoio na sua jornada?</h3>
                <p className="text-sm mb-4 opacity-80">
                  Solicite o acompanhamento de um mentor especializado para impulsionar seus conteúdos e alcançar melhores resultados na plataforma.
                </p>
                <button 
                  type="button" 
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Solicitar Mentoria
                </button>
              </div>
              <div className="w-1/3 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 200 200" 
                  className="w-full h-auto text-white opacity-20"
                  fill="currentColor"
                >
                  <path d="M100 20a80 80 0 1 0 0 160 80 80 0 1 0 0-160zm0 140a60 60 0 1 1 0-120 60 60 0 1 1 0 120zm-10-85a10 10 0 1 0 20 0 10 10 0 1 0-20 0zm0 50a10 10 0 1 0 20 0 10 10 0 1 0-20 0z"/>
                </svg>
              </div>
            </div>

            {/* Resto do conteúdo do modal (formulário, etc.) */}
            {/* ... */}
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
} 