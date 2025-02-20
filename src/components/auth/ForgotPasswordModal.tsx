'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      setEmail('');
      // Fecha o modal após 3 segundos quando o email é enviado com sucesso
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      switch (err.code) {
        case 'auth/user-not-found':
          setError('Não existe uma conta com este email.');
          break;
        case 'auth/invalid-email':
          setError('Email inválido.');
          break;
        default:
          setError('Erro ao enviar email de recuperação. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recuperar senha
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Digite seu email e enviaremos um link para redefinir sua senha.
        </p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
              Email enviado com sucesso! Verifique sua caixa de entrada.
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              className="w-auto"
            >
              Enviar link
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 