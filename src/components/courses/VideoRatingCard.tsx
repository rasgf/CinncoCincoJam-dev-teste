'use client';

import { useState, useEffect } from 'react';
import { StarRating } from '@/components/common/StarRating';
import { addVideoRating, getUserVideoRating, getVideoAverageRating } from '@/services/firebase-ratings';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

interface VideoRatingCardProps {
  userId: string;
  courseId: string;
  videoId: string;
  videoTitle: string;
}

export function VideoRatingCard({ userId, courseId, videoId, videoTitle }: VideoRatingCardProps) {
  const [userRating, setUserRating] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);

  useEffect(() => {
    const loadRatings = async () => {
      try {
        setLoading(true);
        
        // Verificar se o usuário já avaliou este vídeo
        const existingRating = await getUserVideoRating(userId, videoId);
        if (existingRating) {
          setUserRating(existingRating.rating);
          setComment(existingRating.comment || '');
          setHasRated(true);
          console.log('Avaliação existente carregada:', existingRating);
        }
        
        // Carregar a média das avaliações deste vídeo
        const avgRating = await getVideoAverageRating(videoId);
        setAverageRating(avgRating);
      } catch (error) {
        console.error('Erro ao carregar avaliações:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId && videoId) {
      loadRatings();
    }
  }, [userId, videoId]);

  const handleRatingChange = (rating: number) => {
    setUserRating(rating);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const handleSubmit = async () => {
    if (userRating === 0) {
      toast.error('Por favor, selecione uma avaliação');
      return;
    }
    
    try {
      setSubmitting(true);
      setUpdateSuccess(false);
      
      const result = await addVideoRating({
        user_id: userId,
        course_id: courseId,
        video_id: videoId,
        rating: userRating,
        comment
      });
      
      console.log('Resultado da avaliação:', result);
      toast.success(hasRated ? 'Avaliação atualizada com sucesso!' : 'Obrigado pela sua avaliação!');
      setHasRated(true);
      setUpdateSuccess(true);
      
      // Atraso visual para mostrar o sucesso
      setTimeout(() => setUpdateSuccess(false), 3000);
      
      // Atualizar média
      const avgRating = await getVideoAverageRating(videoId);
      setAverageRating(avgRating);
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Não foi possível salvar sua avaliação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-20"></div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Avalie esta aula
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sua avaliação
            </label>
            <StarRating 
              initialRating={userRating} 
              onChange={handleRatingChange} 
              size="lg"
              showValue
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comentário (opcional)
            </label>
            <textarea
              className="w-full px-3 py-2 text-gray-700 dark:text-gray-300 border rounded-lg dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:border-blue-500"
              rows={3}
              value={comment}
              onChange={handleCommentChange}
              placeholder="Deixe um comentário sobre esta aula..."
            />
          </div>
          
          <Button 
            onClick={handleSubmit}
            isLoading={submitting}
            disabled={submitting}
            className={updateSuccess ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {hasRated ? 'Atualizar Avaliação' : 'Enviar Avaliação'}
            {updateSuccess && (
              <span className="ml-2">✓</span>
            )}
          </Button>
          
          {averageRating > 0 && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Média de avaliações
              </p>
              <div className="flex items-center">
                <StarRating 
                  initialRating={averageRating} 
                  readOnly 
                  showValue
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
} 