'use client';

import React from 'react';
import Image from 'next/image';
import { PaymentType, RecurrenceInterval } from '@/types/course';
import { ProxyImage } from '../common/ProxyImage';
import { StarRating } from '@/components/common/StarRating';

export interface CourseCardProps {
  id?: string;
  title: string;
  description: string;
  thumbnail?: string;
  progress?: number;
  professor?: string;
  price?: number;
  level?: string;
  status?: string;
  what_will_learn?: string;
  requirements?: string;
  rating?: number;
  ratingCount?: number;
  paymentType?: PaymentType;
  recurrenceInterval?: RecurrenceInterval;
  installments?: boolean;
  installmentCount?: number;
  mainCategory?: string;
  subCategory?: string;
  onClick?: () => void;
}

export default function CourseCard({
  id,
  title,
  description,
  thumbnail,
  progress,
  professor,
  price,
  level,
  status,
  what_will_learn,
  requirements,
  rating = 0,
  ratingCount = 0,
  paymentType,
  recurrenceInterval,
  installments,
  installmentCount,
  mainCategory,
  subCategory,
  onClick
}: CourseCardProps) {
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getArrayFromString = (str?: string) => {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch (e) {
      return [str];
    }
  };

  const formatPaymentInfo = () => {
    if (price === undefined) return '';
    
    let paymentInfo = formatPrice(price);
    
    if (paymentType === 'recurring' && recurrenceInterval) {
      const intervalMap: Record<RecurrenceInterval, string> = {
        monthly: 'mensal',
        quarterly: 'trimestral',
        biannual: 'semestral',
        annual: 'anual'
      };
      paymentInfo += ` ${intervalMap[recurrenceInterval]}`;
    } else if (paymentType === 'one_time' && installments && installmentCount) {
      paymentInfo += ` em até ${installmentCount}x`;
    }
    
    return paymentInfo;
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-lg"
      onClick={onClick}
    >
      <div className="relative h-48">
        {thumbnail ? (
          <ProxyImage
            src={thumbnail}
            alt={title}
            width={400}
            height={200}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <span className="text-gray-400 dark:text-gray-500">Sem imagem</span>
          </div>
        )}
        {progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-600">
            <div 
              className="h-full bg-blue-600 dark:bg-blue-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        {mainCategory && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 bg-blue-600/80 text-white text-xs font-medium rounded">
              {mainCategory.replace('_', ' ')}
              {subCategory && ` - ${subCategory.replace('_', ' ')}`}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        
        {professor && (
          <div className="flex items-center mb-2 text-gray-600 dark:text-gray-400 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span>Prof. {professor}</span>
          </div>
        )}
        
        {rating > 0 && (
          <div className="flex items-center mb-2">
            <StarRating initialRating={rating} readOnly size="sm" />
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              {rating.toFixed(1)} ({ratingCount})
            </span>
          </div>
        )}
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
          {description}
        </p>
        
        <div className="flex items-center justify-between">
          {price !== undefined && (
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatPaymentInfo()}
            </span>
          )}
        </div>

        {what_will_learn && (
          <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              O que você vai aprender:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              {getArrayFromString(what_will_learn).map((item: string, index: number) => (
                <li key={index} className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full mr-2" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {requirements && (
          <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Pré-requisitos:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              {getArrayFromString(requirements).map((item: string, index: number) => (
                <li key={index} className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full mr-2" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 