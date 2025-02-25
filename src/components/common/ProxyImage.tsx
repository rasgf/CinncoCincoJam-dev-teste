'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProxyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function ProxyImage({ src, alt, width = 300, height = 200, className, priority }: ProxyImageProps) {
  const [error, setError] = useState(false);
  
  // Função para determinar o tipo de src
  const getSrcType = (url: string): 'firebase' | 'dataurl' | 'relative' | 'external' => {
    if (!url) return 'relative';
    if (url.startsWith('data:')) return 'dataurl';
    if (url.startsWith('/')) return 'relative';
    if (url.includes('firebasestorage.googleapis.com')) return 'firebase';
    return 'external';
  };
  
  // Função para gerar o URL correto baseado no tipo
  const getProperSrc = (url: string): string => {
    const srcType = getSrcType(url);
    
    // Data URLs e URLs relativas não precisam de proxy
    if (srcType === 'dataurl' || srcType === 'relative') {
      return url;
    }
    
    // URLs do Firebase Storage usam proxy apenas em desenvolvimento
    if (srcType === 'firebase' && process.env.NODE_ENV === 'development') {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    
    // Qualquer outra URL é usada diretamente
    return url;
  };
  
  // Imagem de fallback para quando há erro
  const fallbackSrc = `/api/placeholder?width=${width}&height=${height}&text=${encodeURIComponent(alt || 'No Image')}`;
  
  // Se não houver src ou se houver erro, mostrar imagem de fallback
  const finalSrc = (!src || error) ? fallbackSrc : getProperSrc(src);
  
  return (
    <Image
      src={finalSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={() => setError(true)}
    />
  );
} 