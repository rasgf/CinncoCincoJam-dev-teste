'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { airtableUser } = useAuthContext();
  const isTeacher = airtableUser?.fields.role === 'professor';
  const pathname = usePathname();

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
    }
  ];

  return (
    <div className="flex gap-6">
      <div className="w-64 flex-shrink-0">
        <nav className="bg-white shadow rounded-lg p-4">
          {menuItems.map(item => item.show && (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-1">
        <div className="bg-white shadow rounded-lg p-6">
          {children}
        </div>
      </div>
    </div>
  );
} 