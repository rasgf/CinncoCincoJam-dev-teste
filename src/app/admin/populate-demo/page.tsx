'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PopulateDemoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePopulate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/populate-demo-courses');
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'Erro ao popular cursos de demonstração');
      }
    } catch (error) {
      console.error('Erro:', error);
      setError('Ocorreu um erro ao tentar popular os cursos de demonstração');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Popular Plataforma com Cursos de Demonstração</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <p className="mb-4">
          Esta página permite adicionar cursos de demonstração à plataforma. Isso incluirá:
        </p>
        
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>3 professores de exemplo</li>
          <li>3 cursos de música (Violão, Teoria Musical e Piano)</li>
          <li>Conteúdos para cada curso (vídeos do YouTube)</li>
        </ul>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePopulate}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Populando...' : 'Popular Plataforma'}
          </button>
          
          <button
            onClick={() => router.push('/courses')}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
          >
            Ver Cursos
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {result && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Cursos de demonstração adicionados com sucesso!</p>
          <p className="mt-2">Foram adicionados:</p>
          <ul className="list-disc pl-6 mt-1">
            <li>{result.data.professors} professores</li>
            <li>{result.data.courses} cursos</li>
            <li>{result.data.courseContents} conjuntos de conteúdos</li>
          </ul>
        </div>
      )}
    </div>
  );
} 