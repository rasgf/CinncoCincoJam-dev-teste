import React from 'react';
import Image from 'next/image';
import { MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline';

export interface StudioCardProps {
  id: string;
  name: string;
  image: string;
  address: string;
  phone: string;
  description: string;
  onClick: () => void;
}

export default function StudioCard({
  id,
  name,
  image,
  address,
  phone,
  description,
  onClick
}: StudioCardProps) {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-lg"
      onClick={onClick}
    >
      <div className="relative h-48">
        <Image
          src={image}
          alt={name}
          width={400}
          height={200}
          className="w-full h-full object-cover"
        />
        
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 bg-blue-600/80 text-white text-xs font-medium rounded">
            Estúdio
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">
          {name}
        </h3>
        
        <div className="flex items-center mb-2 text-gray-600 dark:text-gray-400 text-sm">
          <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="line-clamp-2">{address}</span>
        </div>
        
        <div className="flex items-center mb-3 text-gray-600 dark:text-gray-400 text-sm">
          <PhoneIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{phone}</span>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
          {description}
        </p>
        
        <button
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          Reservar Horário
        </button>
      </div>
    </div>
  );
} 