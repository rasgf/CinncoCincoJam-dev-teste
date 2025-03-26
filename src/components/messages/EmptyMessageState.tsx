'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/common/Button';
import Link from 'next/link';

interface EmptyMessageStateProps {
  title: string;
  message: string;
  icon?: ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  isTeacher?: boolean;
}

export function EmptyMessageState({ 
  title, 
  message, 
  icon, 
  action,
  isTeacher = false 
}: EmptyMessageStateProps) {
  return (
    <div className="text-center p-8">
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {message}
      </p>
      
      {action && (
        action.href ? (
          <Link href={action.href}>
            <Button>
              {action.label}
            </Button>
          </Link>
        ) : (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
      
      {/* Sugestões diferentes para professores e alunos */}
      <div className="mt-8 text-sm text-gray-500 dark:text-gray-500">
        {isTeacher ? (
          <div className="space-y-2">
            <p>Sugestões:</p>
            <ul className="list-disc list-inside">
              <li>Envie mensagens de boas-vindas aos alunos novos</li>
              <li>Responda dúvidas sobre o conteúdo dos cursos</li>
              <li>Anuncie novidades ou atualizações nos cursos</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-2">
            <p>Sugestões:</p>
            <ul className="list-disc list-inside">
              <li>Tire dúvidas sobre o conteúdo com o professor</li>
              <li>Solicite material complementar</li>
              <li>Compartilhe seu progresso no curso</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 