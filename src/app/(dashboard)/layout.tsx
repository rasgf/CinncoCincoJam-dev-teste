'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/AuthContext';
import { SunIcon, MoonIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { FullScreenLoading } from '@/components/common/Loading';
import { ChatbotWidget } from '@/components/chatbot/ChatbotWidget';
import { PasswordModal } from '@/components/admin/PasswordModal';
import { ConfigModal } from '@/components/admin/ConfigModal';
import { Toaster } from 'react-hot-toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout, airtableUser: firebaseUser } = useAuthContext();
  const isTeacher = firebaseUser?.fields.role === 'professor';
  const isAdmin = firebaseUser?.fields.role === 'admin';
  const [darkMode, setDarkMode] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [showCamarimMessage, setShowCamarimMessage] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Verificar preferência salva
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Função para verificar se já está na página do camarim
  const handleCamarimClick = (e: React.MouseEvent, href: string) => {
    if (pathname === href) {
      e.preventDefault();
      
      // Não mostrar nova mensagem se já estiver exibindo uma
      if (showCamarimMessage) return;
      
      setShowCamarimMessage(true);
      setIsFadingOut(false);
      
      // Iniciar fade-out após 2.5 segundos
      setTimeout(() => {
        setIsFadingOut(true);
      }, 2500);
      
      // Remover completamente após 3 segundos
      setTimeout(() => {
        setShowCamarimMessage(false);
        setIsFadingOut(false);
      }, 3000);
    }
  };

  if (loading) {
    return <FullScreenLoading />;
  }

  const menuItems = [
    { href: '/profile', label: 'Camarim' },
    { href: '/courses', label: 'Cursos' },
    { href: '/apps-pro', label: 'Apps PRO' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  CincoCincoJam
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => item.href === '/profile' && handleCamarimClick(e, item.href)}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              {isAdmin && (
                <>
                  <Link
                    href="/admin"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                  >
                    Administração
                  </Link>
                  <Link
                    href="/admin/professors/pending"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800"
                  >
                    Professores Pendentes
                  </Link>
                </>
              )}
              
              {/* Nome do usuário */}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {firebaseUser?.fields.name}
              </span>

              {/* Botão de Toggle Dark Mode */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                {darkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>

              {/* Botão de Informação */}
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Informações"
              >
                <InformationCircleIcon className="h-5 w-5" />
              </button>

              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sair
              </button>
            </div>

            {/* Menu Mobile */}
            <div className="flex items-center sm:hidden">
              <div className="flex flex-col space-y-1">
                {/* Nome do usuário Mobile */}
                <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  {firebaseUser?.fields.name}
                </span>

                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => item.href === '/profile' && handleCamarimClick(e, item.href)}
                    className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
                {isAdmin && (
                  <>
                    <Link
                      href="/admin"
                      className="text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Administração
                    </Link>
                    <Link
                      href="/admin/professors/pending"
                      className="text-white bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Professores Pendentes
                    </Link>
                  </>
                )}
                
                {/* Botão de Toggle Dark Mode Mobile */}
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {darkMode ? (
                    <>
                      <SunIcon className="h-5 w-5 mr-2" />
                      Modo Claro
                    </>
                  ) : (
                    <>
                      <MoonIcon className="h-5 w-5 mr-2" />
                      Modo Escuro
                    </>
                  )}
                </button>

                {/* Botão de Informação Mobile */}
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <InformationCircleIcon className="h-5 w-5 mr-2" />
                  Informações
                </button>

                <button
                  onClick={handleLogout}
                  className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mensagem de "Você já está no camarim" */}
      {showCamarimMessage && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg ${isFadingOut ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
            <span>Você já está no seu camarim!</span>
            <button 
              onClick={() => {
                setIsFadingOut(true);
                setTimeout(() => {
                  setShowCamarimMessage(false);
                  setIsFadingOut(false);
                }, 500);
              }}
              className="ml-4 text-white hover:text-blue-100 focus:outline-none"
              aria-label="Fechar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 mt-16 dark:text-gray-200">
        {children}
      </main>
      
      {/* Chatbot Widget */}
      <ChatbotWidget />

      {/* Modal de Senha */}
      <PasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => {
          setIsPasswordModalOpen(false);
          setIsConfigModalOpen(true);
        }}
      />

      {/* Modal de Configuração */}
      <ConfigModal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)}
      />
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: darkMode ? '#374151' : '#fff',
            color: darkMode ? '#fff' : '#374151',
          },
        }}
      />
    </div>
  );
} 