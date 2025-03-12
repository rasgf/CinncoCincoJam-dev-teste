'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loading } from '@/components/common/Loading';
import { paymentService } from '@/services';
import { Payment } from '@/services/firebase-payments';
import { formatCurrency } from '@/utils/format';

export default function PaymentsPage() {
  const { airtableUser } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    totalReceived: 0,
    totalPending: 0,
    totalOverdue: 0
  });
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        if (!airtableUser?.id) return;
        
        setLoading(true);
        
        // Comentado temporariamente até que o banco de dados seja populado
        // const professorPayments = await paymentService.getProfessorPayments(airtableUser.id);
        // setPayments(professorPayments);
        
        // const paymentStats = await paymentService.getPaymentStats(airtableUser.id);
        // setStats({
        //   totalReceived: paymentStats.totalReceived,
        //   totalPending: paymentStats.totalPending,
        //   totalOverdue: paymentStats.totalOverdue
        // });
        
        // Dados de exemplo para demonstração
        const mockPayments: Payment[] = [
          {
            id: '1',
            course: {
              id: 'course-1',
              title: 'Teoria Musical Avançada',
              price: 1250.00
            },
            student: {
              id: 'student-1',
              name: 'Ana Silva',
              email: 'ana@example.com'
            },
            amount: 1250.00,
            date: '2025-03-10',
            status: 'paid',
            payment_status: 'paid',
            course_id: 'course-1',
            user_id: 'student-1',
            payment_date: '2025-03-10',
            payment_method: 'credit_card'
          },
          {
            id: '2',
            course: {
              id: 'course-2',
              title: 'Jazz Instrumental',
              price: 980.00
            },
            student: {
              id: 'student-2',
              name: 'Carlos Oliveira',
              email: 'carlos@example.com'
            },
            amount: 980.00,
            date: '2025-03-15',
            status: 'paid',
            payment_status: 'paid',
            course_id: 'course-2',
            user_id: 'student-2',
            payment_date: '2025-03-15',
            payment_method: 'pix'
          },
          {
            id: '3',
            course: {
              id: 'course-1',
              title: 'Teoria Musical Avançada',
              price: 750.00
            },
            student: {
              id: 'student-3',
              name: 'Mariana Santos',
              email: 'mariana@example.com'
            },
            amount: 750.00,
            date: '2025-04-10',
            dueDate: '2025-04-10',
            status: 'pending',
            payment_status: 'pending',
            course_id: 'course-1',
            user_id: 'student-3',
            payment_due_date: '2025-04-10'
          },
          {
            id: '4',
            course: {
              id: 'course-2',
              title: 'Jazz Instrumental',
              price: 490.00
            },
            student: {
              id: 'student-4',
              name: 'Pedro Costa',
              email: 'pedro@example.com'
            },
            amount: 490.00,
            date: '2025-04-15',
            dueDate: '2025-04-15',
            status: 'pending',
            payment_status: 'pending',
            course_id: 'course-2',
            user_id: 'student-4',
            payment_due_date: '2025-04-15'
          },
          {
            id: '5',
            course: {
              id: 'course-1',
              title: 'Teoria Musical Avançada',
              price: 500.00
            },
            student: {
              id: 'student-5',
              name: 'Juliana Mendes',
              email: 'juliana@example.com'
            },
            amount: 500.00,
            date: '2025-03-20',
            status: 'processing',
            payment_status: 'processing',
            course_id: 'course-1',
            user_id: 'student-5',
            payment_due_date: '2025-03-20'
          },
          {
            id: '6',
            course: {
              id: 'course-1',
              title: 'Teoria Musical Avançada',
              price: 350.00
            },
            student: {
              id: 'student-6',
              name: 'Roberto Almeida',
              email: 'roberto@example.com'
            },
            amount: 350.00,
            date: '2025-02-05',
            dueDate: '2025-02-05',
            status: 'overdue',
            payment_status: 'overdue',
            course_id: 'course-1',
            user_id: 'student-6',
            payment_due_date: '2025-02-05'
          },
          {
            id: '7',
            course: {
              id: 'course-2',
              title: 'Jazz Instrumental',
              price: 490.00
            },
            student: {
              id: 'student-7',
              name: 'Fernanda Lima',
              email: 'fernanda@example.com'
            },
            amount: 490.00,
            date: '2025-02-10',
            dueDate: '2025-02-10',
            status: 'overdue',
            payment_status: 'overdue',
            course_id: 'course-2',
            user_id: 'student-7',
            payment_due_date: '2025-02-10'
          }
        ];
        
        setPayments(mockPayments);
        
        // Calcular estatísticas com base nos dados de exemplo
        const totalReceived = mockPayments
          .filter(payment => payment.status === 'paid')
          .reduce((sum, payment) => sum + payment.amount, 0);
          
        const totalPending = mockPayments
          .filter(payment => payment.status === 'pending' || payment.status === 'processing')
          .reduce((sum, payment) => sum + payment.amount, 0);
          
        const totalOverdue = mockPayments
          .filter(payment => payment.status === 'overdue')
          .reduce((sum, payment) => sum + payment.amount, 0);
        
        setStats({
          totalReceived,
          totalPending,
          totalOverdue
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar pagamentos:', error);
        setLoading(false);
        
        // Dados de fallback em caso de erro
        setPayments([
          {
            id: '1',
            course: {
              id: 'course-1',
              title: 'Teoria Musical Avançada',
              price: 1250.00
            },
            student: {
              id: 'student-1',
              name: 'Ana Silva',
              email: 'ana@example.com'
            },
            amount: 1250.00,
            date: '10/03/2025',
            status: 'paid',
            payment_status: 'paid',
            course_id: 'course-1',
            user_id: 'student-1'
          },
          {
            id: '2',
            course: {
              id: 'course-2',
              title: 'Jazz Instrumental',
              price: 980.00
            },
            student: {
              id: 'student-2',
              name: 'Carlos Oliveira',
              email: 'carlos@example.com'
            },
            amount: 980.00,
            date: '15/03/2025',
            status: 'paid',
            payment_status: 'paid',
            course_id: 'course-2',
            user_id: 'student-2'
          },
          {
            id: '3',
            course: {
              id: 'course-1',
              title: 'Teoria Musical Avançada',
              price: 750.00
            },
            student: {
              id: 'student-3',
              name: 'Mariana Santos',
              email: 'mariana@example.com'
            },
            amount: 750.00,
            date: '10/04/2025',
            dueDate: '10/04/2025',
            status: 'pending',
            payment_status: 'pending',
            course_id: 'course-1',
            user_id: 'student-3'
          }
        ]);
        
        setStats({
          totalReceived: 2230.00,
          totalPending: 750.00,
          totalOverdue: 0
        });
      }
    };
    
    fetchPayments();
  }, [airtableUser?.id]);

  const filteredPayments = payments.filter(payment => {
    if (activeTab === 'all') return true;
    if (activeTab === 'paid') return payment.status === 'paid';
    if (activeTab === 'pending') return payment.status === 'pending' || payment.status === 'processing';
    if (activeTab === 'overdue') return payment.status === 'overdue';
    return true;
  });

  const handleSendReminder = async (paymentId: string) => {
    try {
      setSendingReminder(paymentId);
      
      // Simular uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Comentado temporariamente até que o banco de dados seja populado
      // await paymentService.sendPaymentReminder(paymentId);
      
      alert('Lembrete enviado com sucesso!');
      setSendingReminder(null);
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
      alert('Erro ao enviar lembrete. Tente novamente.');
      setSendingReminder(null);
    }
  };

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateString;
    }
  };

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
            {formatCurrency(stats.totalReceived)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">A Receber</h2>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(stats.totalPending)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Atrasados</h2>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(stats.totalOverdue)}
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

        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Nenhum pagamento encontrado para esta categoria.
          </div>
        ) : (
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
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{payment.course.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{payment.student.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{payment.student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(payment.date)}
                        {payment.dueDate && payment.status === 'overdue' && (
                          <span className="text-xs text-red-500 block">
                            Vencido em {formatDate(payment.dueDate)}
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
                      {(payment.status === 'overdue' || payment.status === 'pending') && (
                        <button 
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-3"
                          onClick={() => handleSendReminder(payment.id)}
                          disabled={sendingReminder === payment.id}
                        >
                          {sendingReminder === payment.id ? 'Enviando...' : 'Enviar lembrete'}
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
        )}
      </div>
    </div>
  );
} 