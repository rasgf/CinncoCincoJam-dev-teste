'use client';

import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ImageUpload } from '@/components/common/ImageUpload';
import { updateProfile } from '@/services/users';

export default function ProfileSettingsPage() {
  const { airtableUser, refreshUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: airtableUser?.fields.name || '',
    bio: airtableUser?.fields.bio || '',
    specialties: airtableUser?.fields.specialties || [],
    social_media: airtableUser?.fields.social_media || ''
  });

  if (!airtableUser) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(airtableUser.id, formData);
      await refreshUser();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <Button
          type="submit"
          form="profile-form"
          isLoading={loading}
        >
          Salvar Alterações
        </Button>
      </div>

      <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="max-w-xl">
            <ImageUpload
              currentImage={airtableUser.fields.profile_image}
              onImageSelect={() => {}}
              className="mb-6"
            />

            <div className="space-y-4">
              <Input
                label="Nome"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />

              <Input
                label="Email"
                value={airtableUser.fields.email || ''}
                disabled
              />

              <Input
                label="Tipo de usuário"
                value={airtableUser.fields.role === 'admin' ? 'Administrador' : 
                       airtableUser.fields.role === 'professor' ? 'Professor' : 'Aluno'}
                disabled
              />

              {airtableUser.fields.role === 'professor' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Biografia
                    </label>
                    <textarea
                      name="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
          </div>
        </div>
      </form>
    </div>
  );
} 