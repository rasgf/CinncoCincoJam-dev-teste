'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { getStudents, Student } from '@/services/firebase-studio-sessions';

interface StudentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedStudents: string[]) => void;
  sessionDate: Date;
  sessionTime: string;
}

export default function StudentSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  sessionDate,
  sessionTime
}: StudentSelectionModalProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar alunos do banco de dados
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setIsLoading(true);
        const studentsData = await getStudents();
        setAllStudents(studentsData);
        setStudents(studentsData);
        setIsLoading(false);
      } catch (err) {
        console.error('Erro ao carregar alunos:', err);
        setError('Não foi possível carregar a lista de alunos. Por favor, tente novamente.');
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadStudents();
    }
  }, [isOpen]);

  // Fechar modal se isOpen for false
  useEffect(() => {
    if (!isOpen) {
      setSelectedStudents([]);
      setSearchTerm('');
    }
  }, [isOpen]);

  // Filtrar alunos com base no termo de pesquisa
  useEffect(() => {
    if (searchTerm) {
      const filteredStudents = allStudents.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.instrument && student.instrument.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setStudents(filteredStudents);
    } else {
      setStudents(allStudents);
    }
  }, [searchTerm, allStudents]);

  // Selecionar/deselecionar um aluno
  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Verificar se um aluno está selecionado
  const isStudentSelected = (studentId: string) => {
    return selectedStudents.includes(studentId);
  };

  // Confirmar a seleção de alunos
  const handleConfirm = () => {
    setIsSubmitting(true);
    // Simulando uma chamada de API
    setTimeout(() => {
      onConfirm(selectedStudents);
      setIsSubmitting(false);
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Selecionar Alunos para a Sessão
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium text-gray-900 dark:text-white">Data e Horário:</span>{' '}
              {format(sessionDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {sessionTime}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Os alunos selecionados receberão uma notificação para confirmar presença.
            </p>
          </div>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar alunos por nome, instrumento ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div className="max-h-80 overflow-y-auto mb-6 border border-gray-200 dark:border-gray-700 rounded-md">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando alunos...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-500 dark:text-red-400">
                <p>{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Tentar novamente
                </button>
              </div>
            ) : students.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {students.map(student => (
                  <li 
                    key={student.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                      isStudentSelected(student.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => toggleStudent(student.id)}
                  >
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full border ${
                      isStudentSelected(student.id) 
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-500 dark:bg-blue-400 text-white' 
                        : 'border-gray-300 dark:border-gray-500'
                    }`}>
                      {isStudentSelected(student.id) && <CheckIcon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 dark:text-white font-medium">{student.name}</h3>
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">{student.instrument || 'Instrumento não especificado'}</span>
                        {student.email && (
                          <span className="ml-2 text-blue-600 dark:text-blue-400">{student.email}</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Nenhum aluno encontrado para o termo de busca.' : 'Nenhum aluno cadastrado.'}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedStudents.length} aluno(s) selecionado(s)
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedStudents.length === 0 || isSubmitting}
                className={`px-4 py-2 rounded-md text-white ${
                  selectedStudents.length === 0 || isSubmitting
                    ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                }`}
              >
                {isSubmitting ? 'Confirmando...' : 'Confirmar Sessão'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 