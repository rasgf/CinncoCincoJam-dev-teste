'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { UserModal } from '@/components/admin/UserModal';
import { getAllUsers, createUser, removeUser, updateUserRole, promoteToTeacher, revokeTeacherRole } from '@/services/admin';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { createSecondaryApp } from '@/config/firebase';
import { TrashIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import { User } from '@/types/user';

export default function UsersPage() {
  const { airtableUser } = useAuthContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data.map(record => ({
        id: record.id,
        fields: record.fields
      })));
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      // Criar uma nova instância do Firebase
      const { secondaryAuth } = createSecondaryApp();

      // Criar usuário no Firebase
      const { user } = await createUserWithEmailAndPassword(
        secondaryAuth,
        userData.email,
        'senha123' // Senha temporária
      );

      // Criar usuário no Airtable
      await createUser({
        uid: user.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        status: userData.status
      });

      // Desconectar a instância secundária
      await secondaryAuth.signOut();

      // Recarregar a lista de usuários
      await loadUsers();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  };

  const handleDeleteUser = async (userId: string, firebaseUid: string, email: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setDeletingUserId(userId);
      
      // Criar uma nova instância do Firebase para operação de remoção
      const { secondaryAuth } = createSecondaryApp();

      await removeUser(userId, firebaseUid, email, secondaryAuth);
      await loadUsers(); // Recarrega a lista
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      alert('Erro ao remover usuário. Tente novamente.');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'professor' | 'aluno') => {
    try {
      setUpdatingRoleUserId(userId);
      await updateUserRole(userId, newRole);
      await loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar tipo de usuário:', error);
      alert('Erro ao atualizar tipo de usuário. Tente novamente.');
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const handlePromoteToTeacher = async (userId: string) => {
    try {
      setLoading(true);
      await promoteToTeacher(userId);
      await loadUsers(); // Recarregar lista de usuários
      alert('Usuário promovido a professor com sucesso!');
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      alert('Erro ao promover usuário a professor');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeTeacher = async (userId: string) => {
    try {
      setLoading(true);
      await revokeTeacherRole(userId);
      await loadUsers();
      alert('Papel de professor revogado com sucesso!');
    } catch (error) {
      console.error('Erro ao revogar papel de professor:', error);
      alert(error instanceof Error ? error.message : 'Erro ao revogar papel de professor');
    } finally {
      setLoading(false);
    }
  };

  if (!airtableUser || airtableUser.fields.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Acesso não autorizado.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
        
        <Button onClick={() => setIsModalOpen(true)}>
          Adicionar Usuário
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data de criação
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.fields.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {user.fields.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button
                      disabled={updatingRoleUserId === user.id}
                      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full 
                        ${updatingRoleUserId === user.id ? 'animate-pulse' : ''}
                        ${user.fields.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : user.fields.role === 'professor'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {user.fields.role}
                      <ChevronDownIcon className="w-4 h-4 ml-1" />
                    </Menu.Button>

                    <Menu.Items className="absolute z-10 mt-1 w-36 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => handleUpdateRole(user.id, 'aluno')}
                              disabled={user.fields.role === 'aluno'}
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } ${
                                user.fields.role === 'aluno' ? 'bg-gray-50 text-gray-400' : 'text-gray-700'
                              } block w-full text-left px-4 py-2 text-sm`}
                            >
                              Aluno
                            </button>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => handleUpdateRole(user.id, 'professor')}
                              disabled={user.fields.role === 'professor'}
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } ${
                                user.fields.role === 'professor' ? 'bg-gray-50 text-gray-400' : 'text-gray-700'
                              } block w-full text-left px-4 py-2 text-sm`}
                            >
                              Professor
                            </button>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => handleUpdateRole(user.id, 'admin')}
                              disabled={user.fields.role === 'admin'}
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } ${
                                user.fields.role === 'admin' ? 'bg-gray-50 text-gray-400' : 'text-gray-700'
                              } block w-full text-left px-4 py-2 text-sm`}
                            >
                              Administrador
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Menu>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.fields.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.fields.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.fields.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleDeleteUser(user.id, user.fields.uid, user.fields.email)}
                    disabled={deletingUserId === user.id || user.fields.role === 'admin'}
                    className={`text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-full hover:bg-red-50 transition-colors ${
                      deletingUserId === user.id ? 'animate-pulse' : ''
                    }`}
                    title={
                      user.fields.role === 'admin' 
                        ? 'Não é possível remover administradores' 
                        : 'Remover usuário'
                    }
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateUser}
      />
    </div>
  );
} 