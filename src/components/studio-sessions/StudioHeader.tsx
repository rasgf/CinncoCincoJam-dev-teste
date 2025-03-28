import React from 'react';
import Image from 'next/image';
import { MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline';

interface StudioProps {
  id: string;
  name: string;
  image: string;
  address: string;
  phone: string;
  description: string;
}

export default function StudioHeader({ studio }: { studio: StudioProps }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="relative h-64 md:h-80">
        <Image
          src={studio.image}
          alt={studio.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-3xl font-bold text-white mb-2">{studio.name}</h1>
          <div className="flex items-center text-white/90 text-sm mb-2">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span>{studio.address}</span>
          </div>
          <div className="flex items-center text-white/90 text-sm">
            <PhoneIcon className="h-4 w-4 mr-1" />
            <span>{studio.phone}</span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
          Sobre o Estúdio
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {studio.description}
        </p>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-2">Instrumentos Disponíveis</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Bateria profissional</li>
              <li>• Amplificadores Fender e Marshall</li>
              <li>• Teclados Roland e Nord</li>
              <li>• Microfones Shure e Neumann</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-2">Equipamentos</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Mesa de som digital</li>
              <li>• Sistema de monitoramento</li>
              <li>• Interfaces de áudio</li>
              <li>• Software de gravação profissional</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-2">Serviços</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Ensaios de banda</li>
              <li>• Gravações profissionais</li>
              <li>• Aulas práticas</li>
              <li>• Workshops em grupo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 