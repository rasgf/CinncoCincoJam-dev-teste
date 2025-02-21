interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6 ${className}`}>
      {children}
    </div>
  );
} 