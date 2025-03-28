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
import { getUserByUid, updateUser, deleteUser, collections } from '@/services/firebase';
import { deleteUser as deleteFirebaseUser } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import StudentSessionsList from '@/components/studio-sessions/StudentSessionsList';

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
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [dataInitialized, setDataInitialized] = useState(false);
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
  const isTeacher = user && firebaseUser?.fields?.role === 'professor';
  const [isProfessorPending, setIsProfessorPending] = useState(false);
  const [isProfessorActive, setIsProfessorActive] = useState(false);
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      if (user && !initialLoadDone) {
        console.log('ProfilePage - Carregamento inicial, forçando refresh dos dados');
        try {
          await refreshUser();
          console.log('ProfilePage - Dados do usuário atualizados no carregamento inicial');
        } catch (error) {
          console.error('ProfilePage - Erro ao atualizar dados iniciais:', error);
        } finally {
          setInitialLoadDone(true);
        }
      }
    };
    
    loadInitialData();
  }, [user, initialLoadDone, refreshUser]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isPageLoading && user) {
        console.log('ProfilePage - Forçando renderização após timeout');
        setIsPageLoading(false);
        if (!dataInitialized && user) {
          console.log('ProfilePage - Inicializando dados básicos do usuário após timeout');
          setFormData(prev => ({
            ...prev,
            name: user.displayName || '',
            email: user.email || '',
            role: firebaseUser?.fields?.role || 'aluno'
          }));
          setDataInitialized(true);
        }
      }
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [isPageLoading, user, dataInitialized, firebaseUser?.fields?.role]);

  useEffect(() => {
    if (user && user.email) {
      console.log('ProfilePage - Verificando email do usuário:', user.email);
      setFormData(prev => {
        if (!prev.email || prev.email !== user.email) {
          console.log('ProfilePage - Atualizando email do formulário');
          return {
            ...prev,
            email: user.email || ''
          };
        }
        return prev;
      });
    }
  }, [user]);

  useEffect(() => {
    console.log('ProfilePage - Efeito de carregamento de dados acionado');
    
    if (user && !firebaseUser && !dataInitialized) {
      console.log('ProfilePage - Apenas usuário Firebase Auth disponível, inicializando dados básicos');
      setFormData(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || '',
        role: 'aluno'
      }));
      setDataInitialized(true);
      setIsPageLoading(false);
    }
    
    if (firebaseUser) {
      console.log('ProfilePage - Dados do usuário carregados:', firebaseUser);
      
      try {
        const fields = firebaseUser.fields || {};
        
        setFormData({
          name: fields.name || user?.displayName || '',
          email: fields.email || user?.email || '',
          role: fields.role || 'aluno',
          bio: fields.bio || '',
          bank_name: fields.bank_name || '',
          bank_branch: fields.bank_branch || '',
          bank_account: fields.bank_account || '',
          bank_account_type: fields.bank_account_type || 'checking',
          bank_document: fields.bank_document || ''
        });
        
        console.log('ProfilePage - Formulário preenchido com dados do Firebase');
        setDataInitialized(true);
        setIsPageLoading(false);
      } catch (error) {
        console.error('ProfilePage - Erro ao processar dados do usuário:', error);
        setIsPageLoading(false);
      }
    }
  }, [firebaseUser, user, dataInitialized]);

  useEffect(() => {
    if (!user && !isPageLoading) {
      console.log('ProfilePage - Usuário não autenticado, redirecionando para login');
      router.replace('/login');
    }
  }, [user, router, isPageLoading]);

  useEffect(() => {
    const checkProfessorStatus = async () => {
      try {
        if (!user) return;
        
        if (!firebaseUser) {
          console.log('Verificação de status - Dados do usuário ainda não carregados');
          return;
        }

        console.log('Verificação de status - Verificando para usuário:', user.uid);
        console.log('Verificação de status - Dados do usuário:', firebaseUser);
        
        const isProfessorRole = firebaseUser?.fields?.role === 'professor';
        console.log('Verificação de status - Usuário tem role professor:', isProfessorRole);
        
        if (!isProfessorRole) {
          console.log('Verificação de status - Usuário não é professor, ignorando verificação de status');
          setIsProfessorPending(false);
          setIsProfessorActive(false);
          return;
        }
        
        console.log('Verificação de status - Importando serviço de professores');
        const { getProfessorByUserId } = await import('@/services/firebase-professors');
        
        try {
          console.log('Verificação de status - Buscando professor com user_id:', user.uid);
          const professor = await getProfessorByUserId(user.uid);
          
          console.log('Verificação de status - Resultado:', professor);
          
          if (professor?.fields?.status === 'pending') {
            console.log('Verificação de status - Status: pendente');
            setIsProfessorPending(true);
            setIsProfessorActive(false);
          } else if (professor?.fields?.status === 'active') {
            console.log('Verificação de status - Status: ativo');
            setIsProfessorPending(false);
            setIsProfessorActive(true);
          } else {
            console.log('Verificação de status - Status:', professor?.fields?.status || 'não encontrado');
            setIsProfessorPending(false);
            setIsProfessorActive(false);
          }
        } catch (professorError) {
          console.error('Verificação de status - Erro ao buscar professor:', professorError);
          setIsProfessorPending(false);
          setIsProfessorActive(false);
        }
      } catch (error) {
        console.error('Verificação de status - Erro geral:', error);
        setIsProfessorPending(false);
        setIsProfessorActive(false);
      }
    };

    checkProfessorStatus();
  }, [user, firebaseUser, initialLoadDone]);

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
  };

  const uploadImage = async (file: File): Promise<string> => {
    console.log('Iniciando upload da imagem:', file.name);
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name}`;
    const storagePath = `profile_images/${user?.uid}/${fileName}`;
    console.log('Caminho de armazenamento:', storagePath);
    const storageRef = ref(storage, storagePath);
    
    try {
      console.log('Enviando arquivo para o Firebase Storage...');
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Upload concluído, obtendo URL de download...');
      const downloadURL = await getDownloadURL(storageRef);
      console.log('URL de download obtida:', downloadURL);
      return downloadURL;
    } catch (error: any) {
      console.error('Erro detalhado durante o upload:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      if (error.code === 'storage/unauthorized') {
        throw new Error('Acesso não autorizado ao Firebase Storage. Verifique as permissões.');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload cancelado.');
      } else if (error.code === 'storage/unknown') {
        throw new Error('Erro desconhecido durante o upload. Tente novamente mais tarde.');
      }
      throw new Error(`Falha ao fazer upload da imagem: ${error.message}`);
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
      console.log('Iniciando atualização de perfil...');
      console.log('Dados do formulário:', formData);
      console.log('Imagem selecionada:', selectedImage ? 'Sim' : 'Não');
      
      let imageUrl = firebaseUser?.fields.profile_image;

      if (selectedImage) {
        console.log('Processando upload da nova imagem...');
        try {
          imageUrl = await uploadImage(selectedImage);
          console.log('Imagem carregada com sucesso, URL:', imageUrl);
        } catch (uploadError: any) {
          console.error('Erro específico no upload de imagem:', uploadError);
          setError(`Erro no upload da imagem: ${uploadError.message}`);
          setIsLoading(false);
          return;
        }
      }
      
      console.log('Preparando dados para atualização do perfil...');
      const updateData = {
        name: formData.name,
        profile_image: imageUrl,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
        ...(isTeacher && {
          bank_name: formData.bank_name,
          bank_branch: formData.bank_branch,
          bank_account: formData.bank_account,
          bank_account_type: formData.bank_account_type,
          bank_document: formData.bank_document
        })
      };
      
      console.log('Enviando atualização para o Firebase...');
      await updateProfile(firebaseUser.id, updateData);
      console.log('Perfil atualizado no Firebase, atualizando dados do usuário...');
      await refreshUser();
      
      console.log('Atualização completa!');
      setSuccess('Perfil atualizado com sucesso!');
      setSelectedImage(null);
    } catch (error: any) {
      console.error('Erro detalhado ao atualizar perfil:', error);
      if (error.code) {
        console.error('Código do erro:', error.code);
      }
      setError(`Erro ao atualizar perfil: ${error.message || 'Verifique os logs para mais detalhes'}`);
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

  const handleRequestApproval = async () => {
    try {
      setIsRequestingApproval(true);
      setError('');
      
      if (!user || !user.uid) {
        throw new Error('Dados do usuário não disponíveis');
      }
      
      console.log('Solicitando aprovação para:', user.uid);
      
      const { createProfessor } = await import('@/services/firebase-professors');
      
      // Usar o UID do Firebase Auth que é mais confiável
      const professor = await createProfessor({
        user_id: user.uid,
        name: formData.name || user.displayName || '',
        email: formData.email || user.email || '',
        status: 'pending'
      });
      
      console.log('Solicitação de professor criada/atualizada:', professor);
      
      // Atualizar o estado local imediatamente
      setIsProfessorPending(true);
      setIsProfessorActive(false);
      
      // Atualizar os dados do usuário no contexto
      await refreshUser();
      
      setSuccess('Solicitação enviada com sucesso! Aguarde a aprovação do administrador.');
    } catch (error: any) {
      console.error('Erro ao solicitar aprovação:', error);
      setError(`Erro ao solicitar aprovação: ${error.message}`);
    } finally {
      setIsRequestingApproval(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }
  
  if (isPageLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados do perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                <svg className="w-3 h-3 mr-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                </svg>
                Dashboard
              </Link>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">Meu Perfil</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Gerencie suas informações pessoais
                </p>
              </div>
            </div>

            {isProfessorPending && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                  Solicitação de Professor Pendente
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Sua solicitação para se tornar um professor está em análise. Você será notificado assim que for aprovada.
                </p>
              </div>
            )}

            {isTeacher && !isProfessorPending && !isProfessorActive && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">
                  Ative seu Perfil de Professor
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                  Seu perfil está configurado como professor, mas você ainda não tem um registro ativo. Solicite a aprovação para acessar todas as funcionalidades de professor.
                </p>
                <Button 
                  onClick={handleRequestApproval} 
                  isLoading={isRequestingApproval}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  Solicitar Aprovação
                </Button>
              </div>
            )}

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

                {isTeacher && isProfessorActive && (
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
                          <div className="h-5 w-5" />
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

          {firebaseUser?.fields?.role === 'aluno' && user?.uid && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <StudentSessionsList studentId={user.uid} />
            </div>
          )}
        </div>

        <div className="space-y-6">
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

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">
                Zona de Perigo
              </h2>
              
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