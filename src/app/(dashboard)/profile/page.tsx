'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ImageUpload } from '@/components/common/ImageUpload';
import { useAuthContext } from '@/contexts/AuthContext';
import { getUserByUid, updateUser, deleteUser } from '@/services/firebase';
import { deleteUser as deleteFirebaseUser } from 'firebase/auth';
import { ReauthModal } from '@/components/auth/ReauthModal';
import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserIcon, EnvelopeIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { updateProfile } from '@/services/users';

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
    specialties: [] as string[],
    social_media: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);
  const isTeacher = firebaseUser?.fields.role === 'professor';

  useEffect(() => {
    if (firebaseUser) {
      setFormData({
        name: firebaseUser.fields.name || '',
        email: firebaseUser.fields.email || '',
        role: firebaseUser.fields.role || '',
        bio: firebaseUser.fields.bio || '',
        specialties: firebaseUser.fields.specialties || [],
        social_media: firebaseUser.fields.social_media || ''
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
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
        specialties: formData.specialties,
        social_media: formData.social_media,
        updated_at: new Date().toISOString()
      };

      await updateProfile(firebaseUser.id, updateData);
      await refreshUser();
      
      setSuccess('Perfil atualizado com sucesso!');
      setSelectedImage(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'specialties') {
      setFormData(prev => ({
        ...prev,
        [name]: value.split(',').map(item => item.trim())
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
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

  if (!user || !firebaseUser) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meu Perfil</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie suas informações pessoais e preferências da conta
          </p>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Coluna da Esquerda - Foto e Informações Rápidas */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <div className="mb-6">
                <ImageUpload
                  currentImage={firebaseUser.fields.profile_image}
                  onImageSelect={handleImageSelect}
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Clique na imagem para alterar
                </p>
              </div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {formData.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getRoleDisplay(formData.role)}
              </p>
            </div>

            {/* Status da Conta */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                Status da Conta
              </h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                  Ativo
                </span>
              </div>
            </div>
          </div>

          {/* Coluna da Direita - Formulário e Ações */}
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

                        <Input
                          label="Especialidades"
                          name="specialties"
                          value={formData.specialties.join(', ')}
                          onChange={handleChange}
                          placeholder="Ex: React, Next.js, Node.js"
                        />

                        <Input
                          label="Redes Sociais"
                          name="social_media"
                          value={formData.social_media}
                          onChange={handleChange}
                          placeholder="Links para suas redes sociais"
                        />
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
    </div>
  );
} 