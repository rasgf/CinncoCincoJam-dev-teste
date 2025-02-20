'use client';

import { useState } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

interface ReauthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}

export function ReauthModal({ isOpen, onClose, onSuccess, user }: ReauthModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        password
      );
      await reauthenticateWithCredential(user, credential);
      onSuccess();
    } catch (err: any) {
      setError('Senha incorreta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Confirme sua senha
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Por segurança, precisamos confirmar sua senha antes de deletar sua conta.
        </p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-auto !bg-red-600 hover:!bg-red-700"
            >
              Confirmar e deletar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 