'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isToday, isBefore, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { app } from '@/config/firebase';
import { collections } from '@/services/firebase';

interface StudioSchedulerProps {
  onTimeSelect: (date: Date, time: string) => void;
  studioId?: string;
}

// Horários disponíveis para agendamento
const availableTimes = [
  '08:00', '09:00', '10:00', '11:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function StudioScheduler({ onTimeSelect, studioId }: StudioSchedulerProps) {
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [days, setDays] = useState<Date[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState(true);
  
  // Buscar horários ocupados do banco de dados
  useEffect(() => {
    const fetchBookedSlots = async () => {
      try {
        setLoading(true);
        const db = getDatabase(app);
        const sessionsRef = ref(db, collections.studio_sessions);
        
        // Buscar todas as sessões
        const snapshot = await get(sessionsRef);
        
        if (snapshot.exists()) {
          const slots: { [key: string]: string[] } = {};
          
          // Processar cada sessão
          snapshot.forEach((childSnapshot) => {
            const session = childSnapshot.val();
            
            // Ignorar sessões canceladas
            if (session.status === 'canceled') return;
            
            // Se um studioId específico foi fornecido, filtrar apenas por esse estúdio
            if (studioId && session.studioId !== studioId) return;
            
            // Formatar a data para o formato 'yyyy-MM-dd' para garantir compatibilidade com isSlotBooked
            const sessionDate = new Date(session.date);
            const dateKey = format(sessionDate, 'yyyy-MM-dd');
            const time = session.time;
            
            if (!slots[dateKey]) {
              slots[dateKey] = [];
            }
            
            if (!slots[dateKey].includes(time)) {
              slots[dateKey].push(time);
            }
          });
          
          setBookedSlots(slots);
          console.log('Horários ocupados:', slots);
        }
      } catch (error) {
        console.error('Erro ao buscar horários ocupados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookedSlots();
  }, [studioId]);
  
  // Preencher a semana com datas
  useEffect(() => {
    const startDate = startOfWeek(currentWeekDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
    setDays(weekDays);
  }, [currentWeekDate]);

  // Verificar se um slot está reservado
  const isSlotBooked = (date: Date, time: string) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return bookedSlots[dateKey]?.includes(time) || false;
  };

  // Ir para a semana anterior
  const goToPreviousWeek = () => {
    setCurrentWeekDate(prev => addDays(prev, -7));
  };

  // Ir para a próxima semana
  const goToNextWeek = () => {
    setCurrentWeekDate(prev => addDays(prev, 7));
  };

  // Verificar se uma data é no passado (anterior a hoje)
  const isPast = (date: Date) => {
    // Comparar apenas as datas, sem considerar o horário
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Formatar o nome do dia da semana
  const formatDayOfWeek = (date: Date) => {
    return format(date, 'EEE', { locale: ptBR });
  };

  // Formatar o dia do mês
  const formatDayOfMonth = (date: Date) => {
    return format(date, 'd', { locale: ptBR });
  };

  // Verificar se uma data está selecionada
  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  };

  // Selecionar uma data
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Selecionar um horário
  const handleTimeSelect = (date: Date, time: string) => {
    if (!isPast(date) && !isSlotBooked(date, time)) {
      onTimeSelect(date, time);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {format(currentWeekDate, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousWeek}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={goToNextWeek}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Cabeçalho da tabela - dias da semana */}
            <div className="grid grid-cols-8 gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
              <div className="text-center font-medium text-gray-500 dark:text-gray-400">
                Horário
              </div>
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`text-center cursor-pointer ${
                    isDateSelected(day) 
                      ? 'bg-blue-100 dark:bg-blue-900/30 rounded-md' 
                      : ''
                  } ${
                    isPast(new Date(day))
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => !isPast(new Date(day)) && handleDateSelect(new Date(day))}
                >
                  <div className={`font-medium ${
                    isPast(new Date(day)) 
                      ? 'text-gray-400 dark:text-gray-500' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {formatDayOfWeek(day)}
                  </div>
                  <div className={`text-lg ${
                    isPast(new Date(day))
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {formatDayOfMonth(day)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Corpo da tabela - horários */}
            <div className="space-y-2">
              {availableTimes.map((time, timeIndex) => (
                <div key={timeIndex} className="grid grid-cols-8 gap-2 items-center">
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                    {time}
                  </div>
                  
                  {days.map((day, dayIndex) => {
                    const isBooked = isSlotBooked(day, time);
                    const dayIsPast = isPast(new Date(day));
                    
                    return (
                      <div 
                        key={dayIndex}
                        className={`h-10 flex items-center justify-center rounded-md ${
                          dayIsPast || isBooked
                            ? 'bg-gray-100 dark:bg-gray-700/30 cursor-not-allowed'
                            : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer'
                        } ${
                          isDateSelected(day) && !isBooked && !dayIsPast
                            ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                            : ''
                        }`}
                        onClick={() => handleTimeSelect(day, time)}
                      >
                        {isBooked ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Ocupado</span>
                        ) : dayIsPast ? (
                          <span className="text-xs text-gray-400 dark:text-gray-500">Indisponível</span>
                        ) : (
                          <span className="text-xs text-green-600 dark:text-green-400">Disponível</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {selectedDate && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">
            Data selecionada: {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Clique em um horário disponível (verde) para agendar sua sessão.
          </p>
        </div>
      )}
    </div>
  );
} 