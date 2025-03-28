'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircleIcon, XCircleIcon, ClockIcon, PlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';

interface Student {
  id: string;
  name: string;
  instrument: string;
  status: 'confirmed' | 'declined' | 'pending';
  email?: string;
}

interface SessionConfirmationListProps {
  studioName: string;
  sessionDate: Date;
  sessionTime: string;
  students: Student[];
  onAddStudents?: () => void;
  onRemoveStudent?: (studentId: string) => void;
}

export default function SessionConfirmationList({
  studioName,
  sessionDate,
  sessionTime,
  students,
  onAddStudents,
  onRemoveStudent
}: SessionConfirmationListProps) {
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'declined' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);

  // Filtrar alunos com base no status e termo de busca
  const filteredStudents = students.filter(student => {
    const matchesFilter = filter === 'all' || student.status === filter;
    const matchesSearch = 
      (student.name ? student.name.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      (student.instrument ? student.instrument.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      (student.email ? student.email.toLowerCase().includes(searchTerm.toLowerCase()) : false);
    return matchesFilter && matchesSearch;
  });

  // Contar alunos por status
  const confirmedCount = students.filter(s => s.status === 'confirmed').length;
  const declinedCount = students.filter(s => s.status === 'declined').length;
  const pendingCount = students.filter(s => s.status === 'pending').length;

  // Iniciar processo de remoção
  const handleRemoveClick = (studentId: string) => {
    setShowRemoveConfirm(studentId);
  };

  // Confirmar remoção do aluno
  const confirmRemove = (studentId: string) => {
    if (onRemoveStudent) {
      onRemoveStudent(studentId);
    }
    setShowRemoveConfirm(null);
  };

  // Cancelar remoção
  const cancelRemove = () => {
    setShowRemoveConfirm(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Status da Sessão
          </h2>
          
          {onAddStudents && (
            <button 
              onClick={onAddStudents}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              Adicionar Alunos
            </button>
          )}
        </div>
        
        <p className="text-gray-600 dark:text-gray-300">
          <span className="font-medium">Local:</span> {studioName}<br />
          <span className="font-medium">Data:</span> {format(sessionDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}<br />
          <span className="font-medium">Horário:</span> {sessionTime}
        </p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 border-l-4 border-green-500 dark:border-green-400">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Confirmados</h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{confirmedCount}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 border-l-4 border-red-500 dark:border-red-400">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Não Vão Comparecer</h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{declinedCount}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 border-l-4 border-yellow-500 dark:border-yellow-400">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendentes</h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{pendingCount}</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Todos ({students.length})
            </button>
            
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === 'confirmed' 
                  ? 'bg-green-600 text-white dark:bg-green-500'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Confirmados ({confirmedCount})
            </button>
            
            <button
              onClick={() => setFilter('declined')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === 'declined' 
                  ? 'bg-red-600 text-white dark:bg-red-500'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Não Vão ({declinedCount})
            </button>
            
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === 'pending' 
                  ? 'bg-yellow-600 text-white dark:bg-yellow-500'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Pendentes ({pendingCount})
            </button>
          </div>
          
          <div>
            <input
              type="text"
              placeholder="Buscar aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full md:w-auto"
            />
          </div>
        </div>
        
        {filteredStudents.length > 0 ? (
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Aluno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Instrumento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  {onRemoveStudent && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className={showRemoveConfirm === student.id ? "bg-red-50 dark:bg-red-900/20" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-300">
                        {student.instrument || "Não especificado"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        {student.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.status === 'confirmed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Confirmado
                        </span>
                      )}
                      {student.status === 'declined' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Não Vai Comparecer
                        </span>
                      )}
                      {student.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          Aguardando Resposta
                        </span>
                      )}
                    </td>
                    {onRemoveStudent && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {showRemoveConfirm === student.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => confirmRemove(student.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-medium"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={cancelRemove}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRemoveClick(student.id)}
                            className="text-gray-600 hover:text-red-700 dark:text-gray-400 dark:hover:text-red-400 inline-flex items-center"
                          >
                            <UserMinusIcon className="h-5 w-5 mr-1" />
                            Remover
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Nenhum aluno encontrado com os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
} 