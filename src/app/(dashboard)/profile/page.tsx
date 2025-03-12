'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ImageUpload } from '@/components/common/ImageUpload';
import { ReauthModal } from '@/components/auth/ReauthModal';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  UserIcon, 
  EnvelopeIcon, 
  AcademicCapIcon,
  BanknotesIcon,
  IdentificationIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import { updateProfile } from '@/services/users';
import { getUserByUid, updateUser, deleteUser } from '@/services/firebase';
import { deleteUser as deleteFirebaseUser } from 'firebase/auth';

const getRoleDisplay = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'professor':
      return 'Professor';
    case 'aluno':
      return 'Aluno';
    default:
      return role;
  }
};

export default function ProfilePage() {
  const { user, airtableUser: firebaseUser, refreshUser } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    bio: '',
    bank_name: '',
    bank_branch: '',
    bank_account: '',
    bank_account_type: 'checking',
    bank_document: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const isTeacher = firebaseUser?.fields.role === 'professor';

  useEffect(() => {
    if (firebaseUser) {
      setFormData({
        name: firebaseUser.fields.name || '',
        email: firebaseUser.fields.email || '',
        role: firebaseUser.fields.role || '',
        bio: firebaseUser.fields.bio || '',
        bank_name: firebaseUser.fields.bank_name || '',
        bank_branch: firebaseUser.fields.bank_branch || '',
        bank_account: firebaseUser.fields.bank_account || '',
        bank_account_type: firebaseUser.fields.bank_account_type || 'checking',
        bank_document: firebaseUser.fields.bank_document || ''
      });
    }
  }, [firebaseUser]);

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `profile_images/${user?.uid}/${fileName}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Erro durante o upload:', error);
      throw new Error('Falha ao fazer upload da imagem');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    console.log(`Campo alterado: ${name}, valor: ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Enviando dados do formulário:', formData);
      
      // Preparar dados para atualização
      let imageUrl = firebaseUser?.fields.profile_image;

      if (selectedImage) {
        try {
          imageUrl = await uploadImage(selectedImage);
        } catch (uploadError) {
          throw uploadError;
        }
      }
      
      const updateData = {
        name: formData.name,
        profile_image: imageUrl,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
        // Incluindo dados bancários na atualização
        ...(isTeacher && {
          bank_name: formData.bank_name,
          bank_branch: formData.bank_branch,
          bank_account: formData.bank_account,
          bank_account_type: formData.bank_account_type,
          bank_document: formData.bank_document
        })
      };
      
      await updateProfile(firebaseUser.id, updateData);
      await refreshUser();
      
      setSuccess('Perfil atualizado com sucesso!');
      setSelectedImage(null);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setError('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      return;
    }
    setIsReauthModalOpen(true);
  };

  const handleConfirmedDelete = async () => {
    setIsDeleting(true);
    try {
      if (user) {
        await deleteFirebaseUser(user);
      }

      try {
        await deleteUser(firebaseUser.id);
      } catch (firebaseError) {
        console.error('Erro ao deletar do Firebase:', firebaseError);
      }

      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar conta');
      setIsDeleting(false);
    }
  };

  const handleChangePassword = () => {
    setIsChangePasswordModalOpen(true);
  };

  if (!user || !firebaseUser) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Meu Perfil
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Coluna da Esquerda - Avatar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Foto de Perfil
              </h2>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                  <ImageUpload
                    currentImage={firebaseUser?.fields.profile_image}
                    onImageSelect={handleImageSelect}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Clique na imagem para alterar sua foto de perfil
                </p>
              </div>
            </div>
          </div>

          {/* Coluna da Direita - Formulário */}
          <div className="md:col-span-2 space-y-6">
            {/* Mensagens de Feedback */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-200 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Formulário Principal */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
                  Informações Pessoais
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <Input
                        label="Nome completo"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        disabled
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                      <Input
                        label="Tipo de usuário"
                        name="role"
                        type="text"
                        value={getRoleDisplay(formData.role)}
                        disabled
                        required
                      />
                    </div>

                    {isTeacher && (
                      <>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Biografia
                          </label>
                          <textarea
                            name="bio"
                            rows={4}
                            value={formData.bio}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
                          />
                        </div>
                        
                        {/* Seção de Dados Bancários */}
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Dados Bancários para Recebimentos
                          </h3>
                          
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <BuildingLibraryIcon className="h-5 w-5 text-gray-400" />
                              <Input
                                label="Nome do Banco"
                                name="bank_name"
                                type="text"
                                value={formData.bank_name}
                                onChange={handleChange}
                                placeholder="Ex: Banco do Brasil, Nubank, etc."
                              />
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <BanknotesIcon className="h-5 w-5 text-gray-400" />
                              <div className="grid grid-cols-2 gap-4 w-full">
                                <Input
                                  label="Agência"
                                  name="bank_branch"
                                  type="text"
                                  value={formData.bank_branch}
                                  onChange={handleChange}
                                  placeholder="Sem dígito"
                                />
                                <Input
                                  label="Conta"
                                  name="bank_account"
                                  type="text"
                                  value={formData.bank_account}
                                  onChange={handleChange}
                                  placeholder="Com dígito"
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <div className="h-5 w-5" /> {/* Espaçador para alinhamento */}
                              <div className="w-full">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                  Tipo de Conta
                                </label>
                                <select
                                  name="bank_account_type"
                                  value={formData.bank_account_type}
                                  onChange={handleChange}
                                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
                                >
                                  <option value="checking">Conta Corrente</option>
                                  <option value="savings">Conta Poupança</option>
                                  <option value="payment">Conta de Pagamento</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <IdentificationIcon className="h-5 w-5 text-gray-400" />
                              <Input
                                label="CPF/CNPJ"
                                name="bank_document"
                                type="text"
                                value={formData.bank_document}
                                onChange={handleChange}
                                placeholder="Apenas números"
                              />
                            </div>
                            
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                              Estes dados serão utilizados apenas para processamento de pagamentos.
                              Suas informações bancárias são armazenadas de forma segura.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-end">
                      <Button type="submit" isLoading={isLoading}>
                        Salvar alterações
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Seção de Perigo */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">
                  Zona de Perigo
                </h2>
                
                {/* Alterar Senha */}
                <div className="border-l-4 border-yellow-500 pl-4 py-2 mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Altere sua senha regularmente para manter sua conta segura.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleChangePassword}
                    className="!bg-yellow-50 dark:!bg-yellow-900/50 !text-yellow-600 dark:!text-yellow-400 hover:!bg-yellow-100 dark:hover:!bg-yellow-900/70"
                  >
                    Alterar senha
                  </Button>
                </div>
                
                {/* Deletar Conta */}
                <div className="border-l-4 border-red-500 pl-4 py-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Uma vez deletada, sua conta não poderá ser recuperada. Por favor, tenha certeza.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleDeleteAccount}
                    isLoading={isDeleting}
                    className="!bg-red-50 dark:!bg-red-900/50 !text-red-600 dark:!text-red-400 hover:!bg-red-100 dark:hover:!bg-red-900/70"
                  >
                    Deletar minha conta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReauthModal
        isOpen={isReauthModalOpen}
        onClose={() => setIsReauthModalOpen(false)}
        onSuccess={handleConfirmedDelete}
        user={user}
      />
      
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        user={user}
      />
    </div>
  );
} 