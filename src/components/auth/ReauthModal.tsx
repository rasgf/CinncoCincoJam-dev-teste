'use client';

import { useState } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Dialog } from '@headlessui/react';
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
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <div className="p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Confirme sua senha
            </Dialog.Title>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Por segurança, precisamos confirmar sua senha antes de deletar sua conta.
            </p>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 px-4 py-3 rounded-lg">
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
                  className="w-auto !bg-red-600 dark:!bg-red-500 hover:!bg-red-700 dark:hover:!bg-red-600"
                >
                  Confirmar e deletar
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 