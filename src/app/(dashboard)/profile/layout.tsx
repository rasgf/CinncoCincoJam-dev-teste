'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUnreadMessageCount } from '@/services/firebase-messages';
import { useEffect, useState } from 'react';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { airtableUser, user } = useAuthContext();
  const isTeacher = airtableUser?.fields.role === 'professor';
  const isStudent = airtableUser?.fields.role === 'aluno';
  const isAdmin = airtableUser?.fields.role === 'admin';
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Carregar contagem de mensagens não lidas
  useEffect(() => {
    if (user) {
      const loadUnreadCount = async () => {
        try {
          const count = await getUnreadMessageCount(user.uid);
          setUnreadMessages(count);
        } catch (error) {
          console.error('Erro ao carregar contagem de mensagens não lidas:', error);
        }
      };
      
      loadUnreadCount();
    }
  }, [user]);

  const menuItems = [
    {
      href: '/profile',
      label: 'Informações Pessoais',
      show: true
    },
    {
      href: '/profile/courses',
      label: 'Meus Cursos',
      show: isTeacher
    },
    {
      href: '/profile/enrolled',
      label: 'Cursos Matriculados',
      show: isStudent
    },
    {
      href: '/profile/students',
      label: 'Meus Alunos',
      show: isTeacher
    },
    {
      href: '/profile/payments',
      label: 'Meus Recebimentos',
      show: isTeacher
    },
    {
      href: '/messages',
      label: 'Mensagens',
      show: true,
      badge: unreadMessages > 0 ? unreadMessages : null
    }
  ];

  return (
    <div className="flex gap-6">
      <div className="w-64 flex-shrink-0">
        <nav className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700/20 rounded-lg p-4">
          {menuItems.map(item => item.show && (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm font-medium relative ${
                pathname === item.href
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                  : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {item.label}
              {item.badge && (
                <span className="absolute top-1/2 -translate-y-1/2 right-3 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-1">
        <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700/20 rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
} 