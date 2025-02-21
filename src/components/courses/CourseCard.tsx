'use client';

interface CourseCardProps {
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
}

export function CourseCard({ 
  title, 
  description, 
  thumbnail, 
  progress, 
  professor,
  price,
  level,
  status,
  what_will_learn,
  requirements
}: CourseCardProps) {
  
  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return '';
    if (price === 0) return 'Grátis';
    return `R$ ${Number(price).toFixed(2)}`;
  };

  const getArrayFromString = (value?: string): string[] => {
    if (!value) return [];
    return value.split(',').map(item => item.trim());
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 overflow-hidden hover:shadow-lg dark:hover:shadow-gray-600/30 transition-shadow duration-200">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
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
          {professor && (
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Prof. {professor}
            </span>
          )}
          {price !== undefined && (
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatPrice(price)}
            </span>
          )}
        </div>

        {level && (
          <div className="mt-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {level === 'beginner' ? 'Iniciante' :
               level === 'intermediate' ? 'Intermediário' :
               level === 'advanced' ? 'Avançado' : level}
            </span>
          </div>
        )}

        {what_will_learn && (
          <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              O que você vai aprender:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              {getArrayFromString(what_will_learn).map((item, index) => (
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
              {getArrayFromString(requirements).map((item, index) => (
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