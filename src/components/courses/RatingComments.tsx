'use client';

import { useState, useEffect } from 'react';
import { getCourseRatingComments } from '@/services/firebase-ratings';
import { VideoRating } from '@/services/firebase-ratings';
import { StarRating } from '@/components/common/StarRating';
import { Card } from '@/components/common/Card';

interface RatingCommentsProps {
  courseId: string;
  limit?: number;
  showExpanded?: boolean;
}

export function RatingComments({ courseId, limit = 5, showExpanded = false }: RatingCommentsProps) {
  const [comments, setComments] = useState<Array<VideoRating & { username?: string; videoTitle?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(showExpanded);
  const [visibleComments, setVisibleComments] = useState<Array<VideoRating & { username?: string; videoTitle?: string }>>([]);

  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true);
        const ratingComments = await getCourseRatingComments(courseId);
        setComments(ratingComments);
        
        // Definir comentários visíveis com base no limite
        setVisibleComments(expanded ? ratingComments : ratingComments.slice(0, limit));
      } catch (error) {
        console.error('Erro ao carregar comentários:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadComments();
  }, [courseId, limit, expanded]);

  const toggleExpanded = () => {
    setExpanded(!expanded);
    if (!expanded) {
      setVisibleComments(comments);
    } else {
      setVisibleComments(comments.slice(0, limit));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-40"></div>
      </Card>
    );
  }

  if (comments.length === 0) {
    return (
      <Card>
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          Ainda não há comentários para este curso.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Comentários dos Alunos
        </h3>
        
        <div className="space-y-4">
          {visibleComments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {comment.username || 'Usuário'}
                  </div>
                  <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                  <StarRating initialRating={comment.rating} readOnly size="sm" />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(comment.created_at)}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {comment.comment}
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Sobre: {comment.videoTitle || 'Vídeo'}
              </div>
            </div>
          ))}
        </div>
        
        {comments.length > limit && (
          <button
            onClick={toggleExpanded}
            className="mt-4 w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-center border-t border-gray-100 dark:border-gray-700"
          >
            {expanded ? 'Mostrar menos comentários' : `Ver mais ${comments.length - limit} comentários`}
          </button>
        )}
      </div>
    </Card>
  );
} 