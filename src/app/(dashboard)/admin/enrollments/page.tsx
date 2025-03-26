'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loading } from '@/components/common/Loading';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { getAllCourses } from '@/services/firebase-courses';
import { getAllUsers } from '@/services/firebase';
import { createEnrollment, checkEnrollment, getAllEnrollments, EnrollmentWithDetails } from '@/services/firebase-enrollments';
import { getProfessorsWithCourses } from '@/services/firebase-professors';
import { Course } from '@/types/course';
import { toast } from 'react-hot-toast';

export default function AdminEnrollmentsPage() {
  const { airtableUser } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [enrollmentSearchTerm, setEnrollmentSearchTerm] = useState('');
  const [filteredEnrollments, setFilteredEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [showEnrollments, setShowEnrollments] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'byProfessor'>('all');
  const [professorsWithCourses, setProfessorsWithCourses] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Carregar cursos, usuários, matrículas e professores com cursos
        const [coursesData, usersData, enrollmentsData, professorsData] = await Promise.all([
          getAllCourses(),
          getAllUsers(),
          getAllEnrollments(),
          getProfessorsWithCourses()
        ]);
        
        // Filtrar apenas cursos publicados
        const publishedCourses = coursesData.filter(course => 
          course.fields.status === 'published'
        );
        
        // Filtrar apenas usuários com papel de aluno (em português, não 'student')
        const studentUsers = usersData.filter(user => 
          user.fields.role === 'aluno'
        );
        
        console.log('Total de usuários:', usersData.length);
        console.log('Total de alunos encontrados:', studentUsers.length);
        console.log('Exemplo de papel de usuário:', usersData[0]?.fields?.role);
        
        setCourses(publishedCourses);
        setUsers(studentUsers);
        setSearchResults(studentUsers);
        setEnrollments(enrollmentsData);
        setFilteredEnrollments(enrollmentsData);
        setProfessorsWithCourses(professorsData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    if (airtableUser?.fields.role === 'admin') {
      loadData();
    }
  }, [airtableUser]);

  useEffect(() => {
    if (searchTerm) {
      const results = users.filter(user => 
        user.fields.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fields.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults(users);
    }
  }, [searchTerm, users]);

  useEffect(() => {
    if (enrollmentSearchTerm.trim() === '') {
      setFilteredEnrollments(enrollments);
    } else {
      const searchTermLower = enrollmentSearchTerm.toLowerCase();
      const filtered = enrollments.filter(enrollment => 
        enrollment.fields.userName?.toLowerCase().includes(searchTermLower) ||
        enrollment.fields.userEmail?.toLowerCase().includes(searchTermLower) ||
        enrollment.fields.courseName?.toLowerCase().includes(searchTermLower)
      );
      setFilteredEnrollments(filtered);
    }
  }, [enrollmentSearchTerm, enrollments]);

  const handleEnrollStudent = async () => {
    if (!selectedCourse || !selectedUser) {
      toast.error('Selecione um curso e um aluno para continuar');
      return;
    }

    try {
      setIsEnrolling(true);
      
      // Verificar se o aluno já está matriculado neste curso
      const alreadyEnrolled = await checkEnrollment(selectedUser, selectedCourse);
      if (alreadyEnrolled) {
        toast.error('Este aluno já está matriculado neste curso');
        setIsEnrolling(false);
        return;
      }
      
      // Encontrar o curso e o professor associado
      const course = courses.find(c => c.id === selectedCourse);
      if (!course) {
        throw new Error('Curso não encontrado');
      }

      // Criar matrícula
      await createEnrollment({
        user_id: selectedUser,
        course_id: selectedCourse,
        professor_id: course.fields.professor_id,
        status: 'active'
      });

      // Mostrar mensagem de sucesso
      const user = users.find(u => u.id === selectedUser);
      const courseName = course.fields.title;
      const userName = user?.fields.name || user?.fields.email || 'Aluno';
      
      // Exibir mensagem de sucesso
      const message = `Matrícula criada com sucesso: ${userName} foi matriculado no curso "${courseName}" gratuitamente`;
      setSuccessMessage(message);
      toast.success(message);

      // Limpar seleções
      setSelectedCourse('');
      setSelectedUser('');
      
      // Atualizar lista de matrículas
      await refreshEnrollments();
    } catch (error) {
      console.error('Erro ao matricular aluno:', error);
      toast.error('Erro ao criar matrícula. Por favor, tente novamente.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const refreshEnrollments = async () => {
    try {
      const enrollmentsData = await getAllEnrollments();
      setEnrollments(enrollmentsData);
      setFilteredEnrollments(enrollmentsData);
    } catch (error) {
      console.error('Erro ao atualizar lista de matrículas:', error);
    }
  };

  if (!airtableUser || airtableUser.fields.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Acesso não autorizado.</p>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gerenciar Matrículas</h1>
          <p className="text-gray-500 dark:text-gray-400">Libere cursos gratuitamente para alunos</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setShowEnrollments(!showEnrollments)} 
            variant="outline"
          >
            {showEnrollments ? 'Voltar para Matrícula' : 'Ver Matrículas Existentes'}
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setSuccessMessage(null)}
                  className="inline-flex rounded-md p-1.5 text-green-500 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
                >
                  <span className="sr-only">Fechar</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showEnrollments ? (
        <>
          {/* Abas para escolher entre todos os cursos ou cursos por professor */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
              <li className="mr-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`inline-block p-4 rounded-t-lg ${
                    activeTab === 'all'
                      ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500'
                      : 'text-gray-500 dark:text-gray-400 border-b-2 border-transparent hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Todos os Cursos
                </button>
              </li>
              <li className="mr-2">
                <button
                  onClick={() => setActiveTab('byProfessor')}
                  className={`inline-block p-4 rounded-t-lg ${
                    activeTab === 'byProfessor'
                      ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500'
                      : 'text-gray-500 dark:text-gray-400 border-b-2 border-transparent hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Cursos por Professor
                </button>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seleção de Curso - muda conforme a aba ativa */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Selecione o Curso
              </h2>

              {activeTab === 'all' ? (
                // Exibição de todos os cursos
                courses.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">Nenhum curso publicado disponível.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {courses.map((course) => (
                        <label 
                          key={course.id}
                          className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors
                            ${selectedCourse === course.id 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                        >
                          <input
                            type="radio"
                            name="course"
                            value={course.id}
                            checked={selectedCourse === course.id}
                            onChange={() => setSelectedCourse(course.id)}
                            className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                          <div className="flex-1 ml-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{course.fields.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {course.fields.description?.substring(0, 100)}
                              {course.fields.description?.length > 100 ? '...' : ''}
                            </p>
                            <div className="mt-2 flex items-center text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                {course.fields.price ? `R$ ${course.fields.price}` : 'Gratuito'}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                // Exibição de cursos agrupados por professor
                professorsWithCourses.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">Nenhum professor com cursos disponíveis.</p>
                ) : (
                  <div className="space-y-6">
                    {professorsWithCourses.map((professor) => (
                      <div key={professor.id} className="space-y-3">
                        <h3 className="font-medium text-gray-800 dark:text-gray-200 p-2 bg-gray-100 dark:bg-gray-700 rounded flex justify-between items-center">
                          <span>Professor: {professor.fields.name || professor.fields.email}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            professor.fields.status === 'approved' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                              : professor.fields.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {professor.fields.status === 'approved' 
                              ? 'Aprovado' 
                              : professor.fields.status === 'pending' 
                              ? 'Pendente' 
                              : professor.fields.status}
                          </span>
                        </h3>
                        
                        {professor.courses && professor.courses.length > 0 ? (
                          <div className="pl-2 space-y-3">
                            {professor.courses.map((course: any) => (
                              <label 
                                key={course.id}
                                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors
                                  ${selectedCourse === course.id 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name="course"
                                  value={course.id}
                                  checked={selectedCourse === course.id}
                                  onChange={() => setSelectedCourse(course.id)}
                                  className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400"
                                />
                                <div className="flex-1 ml-2">
                                  <p className="font-medium text-gray-900 dark:text-gray-100">{course.fields.title}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {course.fields.description?.substring(0, 100)}
                                    {course.fields.description?.length > 100 ? '...' : ''}
                                  </p>
                                  <div className="mt-2 flex items-center text-sm">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                      {course.fields.price ? `R$ ${course.fields.price}` : 'Gratuito'}
                                    </span>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 pl-4">
                            Este professor não possui cursos publicados.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Seleção de Aluno */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Selecione o Aluno
              </h2>

              <div className="mb-4">
                <Input
                  label="Buscar aluno por nome ou email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite para buscar..."
                />
              </div>

              {users.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Nenhum aluno encontrado.</p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {searchResults.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">Nenhum aluno encontrado na busca.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {searchResults.map((user) => (
                        <label 
                          key={user.id}
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors
                            ${selectedUser === user.id 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                        >
                          <input
                            type="radio"
                            name="user"
                            value={user.id}
                            checked={selectedUser === user.id}
                            onChange={() => setSelectedUser(user.id)}
                            className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                          <div className="flex-1 ml-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {user.fields.name || 'Nome não definido'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {user.fields.email}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botão de Ação */}
          <div className="flex justify-center pt-6">
            <Button
              onClick={handleEnrollStudent}
              disabled={!selectedCourse || !selectedUser || isEnrolling}
              isLoading={isEnrolling}
              className="px-8"
            >
              Liberar Acesso Gratuito
            </Button>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4">
            <div className="mb-4">
              <Input
                label="Buscar matrículas por aluno, email ou curso"
                value={enrollmentSearchTerm}
                onChange={(e) => setEnrollmentSearchTerm(e.target.value)}
                placeholder="Digite para buscar..."
              />
            </div>
            
            {filteredEnrollments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">
                  {enrollmentSearchTerm.trim() !== '' 
                    ? 'Nenhuma matrícula encontrada para esta busca.'
                    : 'Nenhuma matrícula encontrada no sistema.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Aluno
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Curso
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Professor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Data de Matrícula
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredEnrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{enrollment.fields.userName || 'Nome não disponível'}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{enrollment.fields.userEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{enrollment.fields.courseName || 'Curso não disponível'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{enrollment.fields.professorName || 'Nome não disponível'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${enrollment.fields.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                              : enrollment.fields.status === 'completed'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}
                          >
                            {enrollment.fields.status === 'active' 
                              ? 'Ativo' 
                              : enrollment.fields.status === 'completed' 
                              ? 'Concluído' 
                              : 'Cancelado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(enrollment.fields.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 