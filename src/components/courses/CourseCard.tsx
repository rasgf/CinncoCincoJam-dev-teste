'use client';

interface CourseCardProps {
  title: string;
  description: string;
  thumbnail?: string;
  progress?: number;
  professor?: string;
  price?: number;
}

export function CourseCard({ 
  title, 
  description, 
  thumbnail, 
  progress, 
  professor,
  price 
}: CourseCardProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="h-48 bg-gray-200 relative">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400">Sem imagem</span>
          </div>
        )}
        {progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-blue-600" 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between">
          {professor && (
            <span className="text-sm text-gray-600">
              Prof. {professor}
            </span>
          )}
          {price !== undefined && (
            <span className="text-sm font-medium text-gray-900">
              {price === 0 ? 'Grátis' : `R$ ${price.toFixed(2)}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 