'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuthContext } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { signup } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const name = formData.get('name') as string;

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    try {
      await signup(email, password, name);
      router.push('/profile');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crie sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              faça login se já tiver uma conta
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Nome completo"
              name="name"
              type="text"
              autoComplete="name"
              required
            />

            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />

            <Input
              label="Senha"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />

            <Input
              label="Confirme a senha"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>

          <Button type="submit" isLoading={isLoading}>
            Criar conta
          </Button>
        </form>
      </div>
    </div>
  );
} 