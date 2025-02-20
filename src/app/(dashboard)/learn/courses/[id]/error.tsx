'use client';

export default function Error() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Erro ao carregar o curso
        </h2>
        <p className="text-gray-500 mt-2">
          Tente novamente mais tarde
        </p>
      </div>
    </div>
  );
} 