'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { createCourse } from '@/services/firebase-courses';
import { useAuthContext } from '@/contexts/AuthContext';
import { CreateCourseData } from '@/types/course';

export function CourseForm() {
  const router = useRouter();
  const { airtableUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Garantir que o preço seja um número válido
      const priceStr = formData.get('price') as string;
      const price = parseFloat(priceStr);
      
      if (isNaN(price) || price < 0) {
        setError('Preço inválido');
        return;
      }

      const courseData: CreateCourseData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        price, // Usar o número convertido
        category: formData.get('category') as string,
        level: formData.get('level') as string,
        status: 'draft',
        thumbnail: (formData.get('thumbnail') as File) || undefined,
        what_will_learn: (formData.get('what_will_learn') as string).split('\n').filter(Boolean),
        requirements: (formData.get('requirements') as string).split('\n').filter(Boolean),
        professor_id: airtableUser?.id || ''
      };

      await createCourse(courseData);
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('Erro ao criar curso:', error);
      setError('Erro ao criar curso. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Título"
        name="title"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700">Descrição</label>
        <textarea
          name="description"
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <Input
        label="Preço"
        name="price"
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700">Categoria</label>
        <select
          name="category"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">Selecione uma categoria</option>
          <option value="frontend">Frontend</option>
          <option value="backend">Backend</option>
          <option value="mobile">Mobile</option>
          <option value="devops">DevOps</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Nível</label>
        <select
          name="level"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">Selecione um nível</option>
          <option value="beginner">Iniciante</option>
          <option value="intermediate">Intermediário</option>
          <option value="advanced">Avançado</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">O que vai aprender</label>
        <textarea
          name="what_will_learn"
          rows={4}
          placeholder="Digite cada item em uma linha"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Pré-requisitos</label>
        <textarea
          name="requirements"
          rows={4}
          placeholder="Digite cada item em uma linha"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Thumbnail</label>
        <input
          type="file"
          name="thumbnail"
          accept="image/*"
          className="mt-1 block w-full"
        />
      </div>

      <Button type="submit" isLoading={loading}>
        Criar Curso
      </Button>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}
    </form>
  );
} 