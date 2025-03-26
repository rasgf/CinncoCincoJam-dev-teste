'use client';

import { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

interface StarRatingProps {
  initialRating?: number;
  totalStars?: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  precision?: 0.5 | 1;
}

export function StarRating({
  initialRating = 0,
  totalStars = 5,
  onChange,
  readOnly = false,
  size = 'md',
  showValue = false,
  precision = 0.5
}: StarRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  // Atualizar o rating quando initialRating mudar
  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const handleStarClick = (index: number) => {
    if (readOnly) return;
    
    // Para precisão de 0.5, precisamos considerar cliques em "metade" das estrelas
    // Adicionar 1 ao index para obter o valor correto (1 a 5 em vez de 0 a 4)
    const newRating = index + 1;
    
    console.log(`Clique na estrela ${index}, valor definido: ${newRating}`);
    setRating(newRating);
    onChange?.(newRating);
  };

  const handleHalfStarClick = (index: number) => {
    if (readOnly || precision !== 0.5) return;
    
    const newRating = index + 0.5;
    console.log(`Clique na meia estrela ${index}, valor definido: ${newRating}`);
    setRating(newRating);
    onChange?.(newRating);
  };

  const handleMouseEnter = (index: number) => {
    if (readOnly) return;
    setHoverRating(index + 1);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
  };

  // Renderizar as estrelas com base na precisão
  const renderStars = () => {
    const stars = [];
    
    for (let i = 0; i < totalStars; i++) {
      const currentRating = hoverRating || rating;
      const filled = i < Math.floor(currentRating);
      const halfFilled = precision === 0.5 && i === Math.floor(currentRating) && currentRating % 1 !== 0;
      
      stars.push(
        <div key={i} className="relative inline-block">
          {filled ? (
            <StarIcon 
              className={`${starSizes[size]} text-yellow-400 cursor-pointer`}
              onClick={() => handleStarClick(i)}
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseLeave={handleMouseLeave}
            />
          ) : halfFilled ? (
            <div className="relative">
              <StarOutline 
                className={`${starSizes[size]} text-yellow-400 cursor-pointer absolute top-0 left-0`}
              />
              <div className="overflow-hidden" style={{ width: '50%' }}>
                <StarIcon 
                  className={`${starSizes[size]} text-yellow-400 cursor-pointer`}
                />
              </div>
            </div>
          ) : (
            <StarOutline 
              className={`${starSizes[size]} text-gray-300 dark:text-gray-600 hover:text-yellow-400 cursor-pointer`}
              onClick={() => handleStarClick(i)}
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseLeave={handleMouseLeave}
            />
          )}
          
          {/* Área clicável para metade da estrela (só se precision for 0.5) */}
          {precision === 0.5 && !readOnly && (
            <>
              <div 
                className="absolute top-0 left-0 w-1/2 h-full cursor-pointer z-10" 
                onClick={() => handleHalfStarClick(i)}
                onMouseEnter={() => setHoverRating(i + 0.5)}
                onMouseLeave={handleMouseLeave}
              />
              <div 
                className="absolute top-0 right-0 w-1/2 h-full cursor-pointer z-10" 
                onClick={() => handleStarClick(i)}
                onMouseEnter={() => setHoverRating(i + 1)}
                onMouseLeave={handleMouseLeave}
              />
            </>
          )}
        </div>
      );
    }
    
    return stars;
  };

  return (
    <div className="flex items-center">
      <div className="flex space-x-1">
        {renderStars()}
      </div>
      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
} 