'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { getCourseById } from '@/services/firebase-courses';
import { checkEnrollment } from '@/services/firebase-enrollments';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { Course } from '@/types/course';
import { ProxyImage } from '@/components/common/ProxyImage';
import { PaymentModal } from '@/components/payments/PaymentModal';
import { getCourseAverageRating } from '@/services/firebase-ratings';
import { StarRating } from '@/components/common/StarRating';
import { RatingComments } from '@/components/courses/RatingComments';

interface CourseFields {
  title: string;
  description: string;
  thumbnail?: string;
  what_will_learn?: string | string[];
  price?: number;
  status?: string;
  level?: string;
  professor_id?: string;
  requirements?: string | string[];
  paymentType?: 'one_time' | 'recurring';
  recurrenceInterval?: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  installments?: boolean;
  installmentCount?: number;
}

interface CourseData {
  id: string;
  fields: CourseFields;
}

export default function CoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, airtableUser } = useAuthContext();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentChecking, setEnrollmentChecking] = useState(true);
  const [courseRating, setCourseRating] = useState({ average: 0, count: 0 });

  // Função auxiliar para converter what_will_learn em array
  const getWhatWillLearn = (items?: string | string[]): string[] => {
    if (!items) return [];
    if (typeof items === 'string') return items.split(',');
    return items;
  };

  useEffect(() => {
    if (id && airtableUser) {
      loadCourse();
      checkUserEnrollment();
    }
  }, [id, airtableUser]);

  const checkUserEnrollment = async () => {
    if (!airtableUser || !id) return;

    try {
      const isAdmin = airtableUser?.fields.role === 'admin';
      const isTeacher = airtableUser?.fields.role === 'professor';
      
      // Admins e professores não precisam estar matriculados para acessar
      if (isAdmin || isTeacher) {
        setIsEnrolled(true);
        setEnrollmentChecking(false);
        return;
      }
      
      // Verificar se o aluno está matriculado
      const enrolled = await checkEnrollment(airtableUser.id, id as string);
      setIsEnrolled(enrolled);
    } catch (error) {
      console.error('Erro ao verificar matrícula:', error);
    } finally {
      setEnrollmentChecking(false);
    }
  };

  const loadCourse = async () => {
    try {
      setLoading(true);
      console.log('Carregando curso com ID:', id);
      const data = await getCourseById(id as string);
      console.log('Dados do curso carregados:', data);
      // Precisamos fazer um cast ou transformação dos dados
      setCourse({
        id: data.id,
        fields: {
          title: data.fields.title as string,
          description: data.fields.description as string,
          thumbnail: data.fields.thumbnail as string | undefined,
          what_will_learn: data.fields.what_will_learn,
          price: data.fields.price as number | undefined,
          status: data.fields.status as string | undefined,
          level: data.fields.level as string | undefined,
          requirements: data.fields.requirements as string | string[] | undefined,
          paymentType: data.fields.paymentType,
          recurrenceInterval: data.fields.recurrenceInterval,
          installments: data.fields.installments,
          installmentCount: data.fields.installmentCount
        }
      });
      
      // Verificar se o usuário está matriculado
      if (user) {
        await checkUserEnrollment();
      }
      
      // Carregar média de avaliações
      const ratingData = await getCourseAverageRating(id as string);
      setCourseRating(ratingData);
      
    } catch (error) {
      console.error('Erro ao carregar curso:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCourse = () => {
    router.push(`/learn/courses/${id}`);
  };

  const handleBuyCourse = () => {
    setShowPaymentModal(true);
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
  };

  const handleSelectPaymentMethod = (method: string) => {
    setSelectedPaymentMethod(method);
  };

  const handlePay = () => {
    // In a real implementation, this would process the payment
    // For now, we'll just close the modal and redirect to the course content
    setShowPaymentModal(false);
    router.push(`/learn/courses/${id}`);
  };

  // Função para formatar as condições de pagamento
  const getPaymentInfo = () => {
    if (!course?.fields.price) return 'Grátis';
    
    const price = `R$ ${course.fields.price.toFixed(2)}`;
    
    if (course.fields.paymentType === 'recurring' && course.fields.recurrenceInterval) {
      const interval = {
        monthly: 'mensal',
        quarterly: 'trimestral',
        biannual: 'semestral',
        annual: 'anual'
      }[course.fields.recurrenceInterval];
      
      return `${price} ${interval}`;
    }
    
    if (course.fields.paymentType === 'one_time') {
      if (course.fields.installments && course.fields.installmentCount) {
        return `${price} em até ${course.fields.installmentCount}x`;
      }
      return `${price} à vista`;
    }
    
    return price;
  };

  if (loading) {
    return <Loading />;
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Curso não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {course.fields.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              {course.fields.description}
            </p>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  O que você vai aprender
                </h2>
                <ul className="space-y-2">
                  {getWhatWillLearn(course.fields.what_will_learn).map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg 
                        className="w-5 h-5 text-green-500 dark:text-green-400 mt-1" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2" 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {course.fields.requirements && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Pré-requisitos
                  </h2>
                  <ul className="space-y-2">
                    {getWhatWillLearn(course.fields.requirements).map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg 
                          className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-1" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                          />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  {course.fields.price !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Investimento</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {getPaymentInfo()}
                      </p>
                    </div>
                  )}
                </div>

                {isEnrolled && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Você já está matriculado neste curso
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {!isEnrolled && course.fields.price > 0 && airtableUser?.fields.role !== 'admin' && (
                    <Button
                      onClick={handleBuyCourse}
                      className="w-full bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600"
                    >
                      Comprar Curso
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleStartCourse}
                    className={`w-full ${!isEnrolled && course.fields.price > 0 ? 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600' : 'bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600'}`}
                  >
                    {isEnrolled ? 'Acessar Curso' : 'Começar Curso'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                O que os alunos estão dizendo
              </h2>
              <RatingComments courseId={id as string} />
            </div>
          </div>
          
          <div className="lg:col-span-1">
            {course.fields.thumbnail ? (
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                <ProxyImage
                  src={course.fields.thumbnail}
                  alt={course.fields.title}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
              </div>
            ) : (
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500">
                  Imagem não disponível
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Rating */}
        {courseRating.average > 0 && (
          <div className="flex items-center justify-center mt-6">
            <StarRating initialRating={courseRating.average} readOnly />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {courseRating.average.toFixed(1)} ({courseRating.count} {courseRating.count === 1 ? 'avaliação' : 'avaliações'})
            </span>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Opções de Pagamento
              </h2>
              <button 
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              <div 
                className={`p-3 border rounded-lg cursor-pointer ${
                  selectedPaymentMethod === 'pix_subscription' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => handleSelectPaymentMethod('pix_subscription')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedPaymentMethod === 'pix_subscription' 
                      ? 'border-blue-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedPaymentMethod === 'pix_subscription' && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="font-medium">Assinar com PIX Recorrente</span>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-3 border rounded-lg cursor-pointer ${
                  selectedPaymentMethod === 'pix_onetime' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => handleSelectPaymentMethod('pix_onetime')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedPaymentMethod === 'pix_onetime' 
                      ? 'border-blue-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedPaymentMethod === 'pix_onetime' && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="font-medium">Comprar à Vista com PIX</span>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-3 border rounded-lg cursor-pointer ${
                  selectedPaymentMethod === 'pix_installment' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => handleSelectPaymentMethod('pix_installment')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedPaymentMethod === 'pix_installment' 
                      ? 'border-blue-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedPaymentMethod === 'pix_installment' && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-medium">Parcelar com PIX</span>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-3 border rounded-lg cursor-pointer ${
                  selectedPaymentMethod === 'card_installment' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => handleSelectPaymentMethod('card_installment')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedPaymentMethod === 'card_installment' 
                      ? 'border-blue-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedPaymentMethod === 'card_installment' && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Parcelar com Cartão</span>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-3 border rounded-lg cursor-pointer ${
                  selectedPaymentMethod === 'card_onetime' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => handleSelectPaymentMethod('card_onetime')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedPaymentMethod === 'card_onetime' 
                      ? 'border-blue-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedPaymentMethod === 'card_onetime' && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="font-medium">Pagar à Vista com Cartão</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handlePay}
              disabled={!selectedPaymentMethod}
              className={`w-full ${
                selectedPaymentMethod 
                  ? 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600' 
                  : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              }`}
            >
              Pagar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 