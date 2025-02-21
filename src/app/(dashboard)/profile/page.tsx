'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ImageUpload } from '@/components/common/ImageUpload';
import { useAuthContext } from '@/contexts/AuthContext';
import { getUserByUid, updateUser, deleteUser } from '@/services/airtable';
import { deleteUser as deleteFirebaseUser } from 'firebase/auth';
import { ReauthModal } from '@/components/auth/ReauthModal';
import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  const { user, airtableUser, refreshUser } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);

  useEffect(() => {
    if (airtableUser) {
      setFormData({
        name: airtableUser.fields.name || '',
        email: airtableUser.fields.email || '',
        role: airtableUser.fields.role || ''
      });
    }
  }, [airtableUser]);

  useEffect(() => {
    // Redireciona para a página principal do perfil
    router.push('/profile');
  }, [router]);

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `profile_images/${user?.uid}/${fileName}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Upload realizado com sucesso:', snapshot);
      const downloadURL = await getDownloadURL(storageRef);
      console.log('URL da imagem:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Erro durante o upload:', error);
      throw new Error('Falha ao fazer upload da imagem');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Iniciando atualização do perfil...');
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      let imageUrl = airtableUser?.fields.profile_image;
      console.log('Imagem atual:', imageUrl);

      if (selectedImage) {
        console.log('Iniciando upload da nova imagem...');
        try {
          imageUrl = await uploadImage(selectedImage);
          console.log('Nova imagem uploaded:', imageUrl);
        } catch (uploadError) {
          console.error('Erro no upload da imagem:', uploadError);
          throw uploadError;
        }
      }

      console.log('Atualizando usuário no Airtable...');
      const updateData = {
        name: formData.name,
        profile_image: imageUrl,
        updated_at: new Date().toISOString()
      };
      console.log('Dados para atualização:', updateData);

      const updatedRecord = await updateUser(airtableUser.id, updateData);
      console.log('Resposta do Airtable:', updatedRecord);

      console.log('Iniciando refresh dos dados do usuário...');
      await refreshUser();
      console.log('Refresh concluído');
      
      setSuccess('Perfil atualizado com sucesso!');
      setSelectedImage(null);
    } catch (err: any) {
      console.error('Erro durante a atualização:', err);
      setError(err.message || 'Erro ao atualizar perfil');
    } finally {
      console.log('Finalizando processo de atualização');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
      // Primeiro deletar do Firebase
      if (user) {
        await deleteFirebaseUser(user);
      }

      // Depois deletar do Airtable
      try {
        await deleteUser(airtableUser.id);
      } catch (airtableError) {
        console.error('Erro ao deletar do Airtable:', airtableError);
        // Não vamos mostrar erro aqui pois o usuário já foi deletado do Firebase
      }

      // Redirecionar para login
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar conta');
      setIsDeleting(false);
    }
  };

  if (!user || !airtableUser) {
    return null;
  }

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
              Editar Perfil
            </h3>
            
            <form onSubmit={handleSubmit} className="mt-5 space-y-6">
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

              <div className="flex flex-col items-center space-y-4">
                <ImageUpload
                  currentImage={airtableUser.fields.profile_image}
                  onImageSelect={handleImageSelect}
                  className="mb-6"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Clique na imagem para alterar sua foto de perfil
                </p>
              </div>

              <Input
                label="Nome completo"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                disabled
                required
              />

              <Input
                label="Tipo de usuário"
                name="role"
                type="text"
                value={getRoleDisplay(formData.role)}
                disabled
                required
              />

              <div className="flex justify-end">
                <Button type="submit" isLoading={isLoading}>
                  Salvar alterações
                </Button>
              </div>
            </form>

            <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col space-y-3">
                <h4 className="text-lg font-medium text-red-600 dark:text-red-400">Zona Perigosa</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Uma vez deletada, sua conta não poderá ser recuperada.
                </p>
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleDeleteAccount}
                    isLoading={isDeleting}
                    className="!bg-red-50 dark:!bg-red-900/50 !text-red-600 dark:!text-red-400 hover:!bg-red-100 dark:hover:!bg-red-900/70 w-auto"
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
    </>
  );
} 