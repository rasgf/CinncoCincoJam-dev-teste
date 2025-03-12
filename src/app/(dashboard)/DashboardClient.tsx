'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function DashboardClient() {
  const { user, airtableUser } = useAuthContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Bem-vindo, {airtableUser?.fields?.name || user?.email || 'Usuário'}</h2>
            <p className="text-gray-600">Aqui está uma visão geral da sua conta.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/courses" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold mb-2">Cursos</h3>
              <p className="text-gray-600">Ver todos os seus cursos</p>
            </Link>
            
            <Link href="/dashboard/profile" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold mb-2">Perfil</h3>
              <p className="text-gray-600">Editar suas informações</p>
            </Link>
            
            <Link href="/dashboard/settings" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold mb-2">Configurações</h3>
              <p className="text-gray-600">Ajustar preferências</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 