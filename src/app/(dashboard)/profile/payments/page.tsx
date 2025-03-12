'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loading } from '@/components/common/Loading';

interface Payment {
  id: string;
  course: string;
  amount: number;
  date: string;
  dueDate?: string; // Data de vencimento para identificar atrasados
  status: 'paid' | 'pending' | 'processing' | 'overdue';
  students: number;
  studentName: string; // Nome do aluno adicionado
}

export default function PaymentsPage() {
  const { airtableUser } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  useEffect(() => {
    // Simulando carregamento de dados
    const timer = setTimeout(() => {
      // Dados fictícios de pagamentos com nomes de alunos
      const mockPayments: Payment[] = [
        {
          id: '1',
          course: 'Teoria Musical Avançada',
          amount: 1250.00,
          date: '10/03/2025',
          status: 'paid',
          students: 5,
          studentName: 'Ana Silva'
        },
        {
          id: '2',
          course: 'Jazz Instrumental',
          amount: 980.00,
          date: '15/03/2025',
          status: 'paid',
          students: 4,
          studentName: 'Carlos Oliveira'
        },
        {
          id: '3',
          course: 'Teoria Musical Avançada',
          amount: 750.00,
          date: '10/04/2025',
          dueDate: '10/04/2025',
          status: 'pending',
          students: 3,
          studentName: 'Mariana Santos'
        },
        {
          id: '4',
          course: 'Jazz Instrumental',
          amount: 490.00,
          date: '15/04/2025',
          dueDate: '15/04/2025',
          status: 'pending',
          students: 2,
          studentName: 'Pedro Costa'
        },
        {
          id: '5',
          course: 'Teoria Musical Avançada',
          amount: 500.00,
          date: '20/03/2025',
          status: 'processing',
          students: 2,
          studentName: 'Juliana Mendes'
        },
        {
          id: '6',
          course: 'Teoria Musical Avançada',
          amount: 350.00,
          date: '05/02/2025',
          dueDate: '05/02/2025',
          status: 'overdue',
          students: 1,
          studentName: 'Roberto Almeida'
        },
        {
          id: '7',
          course: 'Jazz Instrumental',
          amount: 490.00,
          date: '10/02/2025',
          dueDate: '10/02/2025',
          status: 'overdue',
          students: 1,
          studentName: 'Fernanda Lima'
        }
      ];

      setPayments(mockPayments);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const filteredPayments = payments.filter(payment => {
    if (activeTab === 'all') return true;
    if (activeTab === 'paid') return payment.status === 'paid';
    if (activeTab === 'pending') return payment.status === 'pending' || payment.status === 'processing';
    if (activeTab === 'overdue') return payment.status === 'overdue';
    return true;
  });

  const totalReceived = payments
    .filter(payment => payment.status === 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const totalPending = payments
    .filter(payment => payment.status === 'pending' || payment.status === 'processing')
    .reduce((sum, payment) => sum + payment.amount, 0);
    
  const totalOverdue = payments
    .filter(payment => payment.status === 'overdue')
    .reduce((sum, payment) => sum + payment.amount, 0);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meus Recebimentos</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Acompanhe os pagamentos recebidos e futuros
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Recebido</h2>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            R$ {totalReceived.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">A Receber</h2>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
            R$ {totalPending.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Atrasados</h2>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
            R$ {totalOverdue.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'all'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'paid'
                  ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Recebidos
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'pending'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              A Receber
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'overdue'
                  ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Atrasados
            </button>
          </nav>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Curso
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Aluno
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{payment.course}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{payment.studentName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      R$ {payment.amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {payment.date}
                      {payment.dueDate && payment.status === 'overdue' && (
                        <span className="text-xs text-red-500 block">
                          Vencido em {payment.dueDate}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.status === 'paid' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : payment.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : payment.status === 'overdue'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {payment.status === 'paid' 
                        ? 'Pago' 
                        : payment.status === 'processing' 
                          ? 'Em processamento' 
                        : payment.status === 'overdue'
                          ? 'Atrasado'
                          : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payment.status === 'overdue' && (
                      <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-3">
                        Enviar lembrete
                      </button>
                    )}
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 