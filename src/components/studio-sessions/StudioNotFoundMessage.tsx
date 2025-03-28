import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function StudioNotFoundMessage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
        <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Acesso Restrito
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Esta funcionalidade está disponível apenas para professores autorizados.
          Se você acredita que deveria ter acesso, entre em contato com o administrador do sistema.
        </p>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ID da funcionalidade: studio-sessions-access
          </p>
        </div>
      </div>
    </div>
  );
} 