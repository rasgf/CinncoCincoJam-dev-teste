'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loading } from '@/components/common/Loading';
import { paymentService } from '@/services';
import { Payment } from '@/services/firebase-payments';
import { formatCurrency } from '@/utils/format';
import { 
  CalendarIcon, 
  ChevronDownIcon, 
  FunnelIcon as FilterIcon, 
  UserIcon, 
  BookOpenIcon, 
  CurrencyDollarIcon, 
  XMarkIcon as XIcon 
} from '@heroicons/react/24/outline';

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
  
  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<{
    month?: number;
    year?: number;
    day?: number;
  }>({});
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [studentFilter, setStudentFilter] = useState<string>('');
  const [minAmountFilter, setMinAmountFilter] = useState<number | ''>('');
  const [maxAmountFilter, setMaxAmountFilter] = useState<number | ''>('');
  const [filtersApplied, setFiltersApplied] = useState(false);

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
        
        // Dados de exemplo para demonstração - Expandido com mais cursos e alunos
        const mockPayments: Payment[] = [
          // Pagamentos recebidos
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
            id: '8',
            course: {
              id: 'course-3',
              title: 'Composição Musical',
              price: 1500.00
            },
            student: {
              id: 'student-8',
              name: 'Lucas Mendonça',
              email: 'lucas@example.com'
            },
            amount: 1500.00,
            date: '2025-01-20',
            status: 'paid',
            payment_status: 'paid',
            course_id: 'course-3',
            user_id: 'student-8',
            payment_date: '2025-01-20',
            payment_method: 'credit_card'
          },
          {
            id: '9',
            course: {
              id: 'course-4',
              title: 'Violão Clássico',
              price: 850.00
            },
            student: {
              id: 'student-9',
              name: 'Carolina Souza',
              email: 'carolina@example.com'
            },
            amount: 850.00,
            date: '2025-02-28',
            status: 'paid',
            payment_status: 'paid',
            course_id: 'course-4',
            user_id: 'student-9',
            payment_date: '2025-02-28',
            payment_method: 'bank_transfer'
          },
          {
            id: '10',
            course: {
              id: 'course-5',
              title: 'Piano para Iniciantes',
              price: 750.00
            },
            student: {
              id: 'student-10',
              name: 'Gabriel Costa',
              email: 'gabriel@example.com'
            },
            amount: 750.00,
            date: '2025-03-05',
            status: 'paid',
            payment_status: 'paid',
            course_id: 'course-5',
            user_id: 'student-10',
            payment_date: '2025-03-05',
            payment_method: 'pix'
          },
          
          // Pagamentos pendentes
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
            id: '11',
            course: {
              id: 'course-3',
              title: 'Composição Musical',
              price: 850.00
            },
            student: {
              id: 'student-11',
              name: 'Amanda Ribeiro',
              email: 'amanda@example.com'
            },
            amount: 850.00,
            date: '2025-04-20',
            dueDate: '2025-04-20',
            status: 'pending',
            payment_status: 'pending',
            course_id: 'course-3',
            user_id: 'student-11',
            payment_due_date: '2025-04-20'
          },
          {
            id: '12',
            course: {
              id: 'course-4',
              title: 'Violão Clássico',
              price: 680.00
            },
            student: {
              id: 'student-12',
              name: 'Ricardo Oliveira',
              email: 'ricardo@example.com'
            },
            amount: 680.00,
            date: '2025-04-25',
            dueDate: '2025-04-25',
            status: 'pending',
            payment_status: 'pending',
            course_id: 'course-4',
            user_id: 'student-12',
            payment_due_date: '2025-04-25'
          },
          
          // Em processamento
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
            id: '13',
            course: {
              id: 'course-5',
              title: 'Piano para Iniciantes',
              price: 480.00
            },
            student: {
              id: 'student-13',
              name: 'Larissa Melo',
              email: 'larissa@example.com'
            },
            amount: 480.00,
            date: '2025-03-25',
            status: 'processing',
            payment_status: 'processing',
            course_id: 'course-5',
            user_id: 'student-13',
            payment_due_date: '2025-03-25'
          },
          
          // Pagamentos atrasados
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
          },
          {
            id: '14',
            course: {
              id: 'course-3',
              title: 'Composição Musical',
              price: 580.00
            },
            student: {
              id: 'student-14',
              name: 'Renato Barros',
              email: 'renato@example.com'
            },
            amount: 580.00,
            date: '2025-01-15',
            dueDate: '2025-01-15',
            status: 'overdue',
            payment_status: 'overdue',
            course_id: 'course-3',
            user_id: 'student-14',
            payment_due_date: '2025-01-15'
          },
          {
            id: '15',
            course: {
              id: 'course-4',
              title: 'Violão Clássico',
              price: 420.00
            },
            student: {
              id: 'student-15',
              name: 'Camila Torres',
              email: 'camila@example.com'
            },
            amount: 420.00,
            date: '2025-02-20',
            dueDate: '2025-02-20',
            status: 'overdue',
            payment_status: 'overdue',
            course_id: 'course-4',
            user_id: 'student-15',
            payment_due_date: '2025-02-20'
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

  // Extrair valores únicos para os filtros
  const uniqueCourses = [...new Set(payments.map(p => p.course.title))].sort();
  const uniqueStudents = [...new Set(payments.map(p => p.student.name))].sort();
  
  // Extrair anos e meses únicos para filtro de data
  const dates = payments.map(p => new Date(p.date));
  const uniqueYears = [...new Set(dates.map(d => d.getFullYear()))].sort();
  const uniqueMonths = [...new Set(dates.map(d => d.getMonth()))].sort();
  
  // Função para filtrar pagamentos com todos os filtros aplicados
  const getFilteredPayments = () => {
    return payments.filter(payment => {
      // Filtro por aba (status)
      const statusFilterPass = 
        activeTab === 'all' ? true :
        activeTab === 'paid' ? payment.status === 'paid' :
        activeTab === 'pending' ? (payment.status === 'pending' || payment.status === 'processing') :
        activeTab === 'overdue' ? payment.status === 'overdue' : true;
      
      if (!statusFilterPass) return false;
      
      // Filtro por data
      let dateFilterPass = true;
      if (dateFilter.year || dateFilter.month || dateFilter.day) {
        const paymentDate = new Date(payment.date);
        
        if (dateFilter.year && paymentDate.getFullYear() !== dateFilter.year) {
          dateFilterPass = false;
        }
        
        if (dateFilterPass && dateFilter.month !== undefined && paymentDate.getMonth() !== dateFilter.month) {
          dateFilterPass = false;
        }
        
        if (dateFilterPass && dateFilter.day && paymentDate.getDate() !== dateFilter.day) {
          dateFilterPass = false;
        }
      }
      
      if (!dateFilterPass) return false;
      
      // Filtro por curso
      const courseFilterPass = !courseFilter || payment.course.title === courseFilter;
      if (!courseFilterPass) return false;
      
      // Filtro por aluno
      const studentFilterPass = !studentFilter || payment.student.name === studentFilter;
      if (!studentFilterPass) return false;
      
      // Filtro por valor mínimo
      const minAmountFilterPass = minAmountFilter === '' || payment.amount >= minAmountFilter;
      if (!minAmountFilterPass) return false;
      
      // Filtro por valor máximo
      const maxAmountFilterPass = maxAmountFilter === '' || payment.amount <= maxAmountFilter;
      if (!maxAmountFilterPass) return false;
      
      return true;
    });
  };
  
  const filteredPayments = getFilteredPayments();
  
  // Função para limpar todos os filtros
  const clearFilters = () => {
    setDateFilter({});
    setCourseFilter('');
    setStudentFilter('');
    setMinAmountFilter('');
    setMaxAmountFilter('');
    setFiltersApplied(false);
  };
  
  // Aplicar filtros
  const applyFilters = () => {
    setFiltersApplied(true);
    setShowFilters(false);
  };
  
  // Verificar se algum filtro está aplicado
  const hasActiveFilters = () => {
    return (
      Object.keys(dateFilter).length > 0 ||
      courseFilter !== '' ||
      studentFilter !== '' ||
      minAmountFilter !== '' ||
      maxAmountFilter !== ''
    );
  };

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

      {/* Botão para mostrar filtros e indicador de filtros ativos */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <FilterIcon className="h-5 w-5" />
          <span>Filtros</span>
          {hasActiveFilters() && (
            <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {Object.keys(dateFilter).length > 0 ? 1 : 0 + 
              (courseFilter ? 1 : 0) + 
              (studentFilter ? 1 : 0) + 
              (minAmountFilter !== '' || maxAmountFilter !== '' ? 1 : 0)}
            </span>
          )}
        </button>
        
        {hasActiveFilters() && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          >
            <XIcon className="h-4 w-4" />
            <span>Limpar filtros</span>
          </button>
        )}
      </div>
      
      {/* Painel de filtros */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6 animate-slide-in">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Filtrar Pagamentos</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Filtro por Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data
              </label>
              <div className="flex flex-col space-y-2">
                <select
                  value={dateFilter.year || ''}
                  onChange={(e) => setDateFilter(prev => ({
                    ...prev,
                    year: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Selecione o ano</option>
                  {uniqueYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                
                <select
                  value={dateFilter.month !== undefined ? dateFilter.month : ''}
                  onChange={(e) => setDateFilter(prev => ({
                    ...prev,
                    month: e.target.value !== '' ? parseInt(e.target.value) : undefined
                  }))}
                  className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Selecione o mês</option>
                  {Array.from({ length: 12 }, (_, i) => i).map(month => (
                    <option key={month} value={month}>
                      {new Date(2000, month, 1).toLocaleString('pt-BR', { month: 'long' })}
                    </option>
                  ))}
                </select>
                
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Dia"
                  value={dateFilter.day || ''}
                  onChange={(e) => setDateFilter(prev => ({
                    ...prev,
                    day: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            
            {/* Filtro por Curso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Curso
              </label>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 w-full"
              >
                <option value="">Todos os cursos</option>
                {uniqueCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
            
            {/* Filtro por Aluno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Aluno
              </label>
              <select
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 w-full"
              >
                <option value="">Todos os alunos</option>
                {uniqueStudents.map(student => (
                  <option key={student} value={student}>{student}</option>
                ))}
              </select>
            </div>
            
            {/* Filtro por Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minAmountFilter}
                  onChange={(e) => setMinAmountFilter(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 w-1/2"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxAmountFilter}
                  onChange={(e) => setMaxAmountFilter(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 w-1/2"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors mr-2"
            >
              Limpar
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
      
      {/* Mostrar resumo dos filtros aplicados */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Filtros aplicados:</span>
          
          {Object.keys(dateFilter).length > 0 && (
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              Data: 
              {dateFilter.day && ` Dia ${dateFilter.day}`}
              {dateFilter.month !== undefined && ` ${new Date(2000, dateFilter.month, 1).toLocaleString('pt-BR', { month: 'long' })}`}
              {dateFilter.year && ` ${dateFilter.year}`}
              <button onClick={() => setDateFilter({})} className="ml-1 text-blue-500 hover:text-blue-700">
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {courseFilter && (
            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-md flex items-center">
              <BookOpenIcon className="h-4 w-4 mr-1" />
              Curso: {courseFilter}
              <button onClick={() => setCourseFilter('')} className="ml-1 text-green-500 hover:text-green-700">
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {studentFilter && (
            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-md flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              Aluno: {studentFilter}
              <button onClick={() => setStudentFilter('')} className="ml-1 text-purple-500 hover:text-purple-700">
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {(minAmountFilter !== '' || maxAmountFilter !== '') && (
            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-md flex items-center">
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
              Valor: 
              {minAmountFilter !== '' && ` Min: R$${minAmountFilter}`}
              {minAmountFilter !== '' && maxAmountFilter !== '' && ' -'}
              {maxAmountFilter !== '' && ` Max: R$${maxAmountFilter}`}
              <button onClick={() => { setMinAmountFilter(''); setMaxAmountFilter(''); }} className="ml-1 text-yellow-500 hover:text-yellow-700">
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Informações sobre resultados filtrados */}
      {hasActiveFilters() && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Mostrando {filteredPayments.length} de {payments.length} pagamentos
        </div>
      )}

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