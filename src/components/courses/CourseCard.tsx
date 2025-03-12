'use client';

import React from 'react';
import Image from 'next/image';
import { PaymentType, RecurrenceInterval } from '@/types/course';
import { ProxyImage } from '../common/ProxyImage';

export interface CourseCardProps {
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
  paymentType?: PaymentType;
  recurrenceInterval?: RecurrenceInterval;
  installments?: boolean;
  installmentCount?: number;
}

export default function CourseCard({
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
  paymentType,
  recurrenceInterval,
  installments,
  installmentCount
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
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
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{description}</p>
        
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