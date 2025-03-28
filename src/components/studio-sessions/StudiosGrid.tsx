'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import StudioCard from './StudioCard';

// Dados das unidades da School of Rock no Rio de Janeiro
const studios = [
  {
    id: 'barra',
    name: 'School of Rock - Barra da Tijuca',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2558&auto=format&fit=crop',
    address: 'Av. das Américas, 4666 - Barra da Tijuca, Rio de Janeiro - RJ, 22640-102',
    phone: '(21) 3030-4040',
    description: 'Estúdio completo com equipamentos profissionais, sala acústica e instrumentos de alta qualidade.'
  },
  {
    id: 'copacabana',
    name: 'School of Rock - Copacabana',
    image: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?q=80&w=2670&auto=format&fit=crop',
    address: 'Av. Nossa Sra. de Copacabana, 1417 - Copacabana, Rio de Janeiro - RJ, 22070-011',
    phone: '(21) 3030-5050',
    description: 'Ambiente moderno com tecnologia de ponta, isolamento acústico e equipamentos premium.'
  },
  {
    id: 'ipanema',
    name: 'School of Rock - Ipanema',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=2670&auto=format&fit=crop',
    address: 'Rua Visconde de Pirajá, 351 - Ipanema, Rio de Janeiro - RJ, 22410-003',
    phone: '(21) 3030-6060',
    description: 'Studio premium com sala de gravação profissional, equipamentos de última geração e conforto acústico.'
  }
];

export default function StudiosGrid() {
  const router = useRouter();

  const handleStudioSelect = (studioId: string) => {
    router.push(`/studio-sessions/${studioId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {studios.map((studio) => (
        <StudioCard
          key={studio.id}
          id={studio.id}
          name={studio.name}
          image={studio.image}
          address={studio.address}
          phone={studio.phone}
          description={studio.description}
          onClick={() => handleStudioSelect(studio.id)}
        />
      ))}
    </div>
  );
} 