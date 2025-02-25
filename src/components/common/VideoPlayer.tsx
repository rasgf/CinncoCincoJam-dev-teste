'use client';

import { useState, useEffect } from 'react';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  className?: string;
  onError?: (error: any) => void;
}

export function VideoPlayer({ videoId, title, className = 'w-full h-full', onError }: VideoPlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Função para extrair o ID do vídeo do YouTube de uma URL
  const getYouTubeVideoId = (url: string): string => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  // Função para construir a URL do player do YouTube com parâmetros apropriados
  const getEmbedUrl = () => {
    if (!videoId) return '';
    
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    
    return `https://www.youtube.com/embed/${getYouTubeVideoId(videoId)}?autoplay=0&rel=0&modestbranding=1&origin=${encodeURIComponent(origin)}&enablejsapi=1&widgetid=1&fs=1`;
  };

  // Lidar com retry quando ocorrer erro
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setError(null);
      setRetryCount(prev => prev + 1);
    }
  };

  // Reset o contador de tentativas quando mudar o vídeo
  useEffect(() => {
    setError(null);
    setRetryCount(0);
  }, [videoId]);

  // Lidar com erros no iframe
  const handleIframeError = (e: any) => {
    console.error('Erro no reprodutor de vídeo:', e);
    setError('Ocorreu um erro ao carregar o vídeo. Por favor, tente novamente.');
    if (onError) onError(e);
  };

  if (error) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gray-100 rounded-lg p-4`}>
        <p className="text-red-500 mb-4">{error}</p>
        {retryCount < maxRetries && (
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      <iframe
        src={getEmbedUrl()}
        title={title}
        className="w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        onError={handleIframeError}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
} 