interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, description, trend }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
      <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">{value}</dd>
      {(description || trend) && (
        <div className="mt-2 flex items-center text-sm">
          {trend && (
            <span className={`mr-2 ${
              trend.isPositive 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
          {description && (
            <span className="text-gray-500 dark:text-gray-400">{description}</span>
          )}
        </div>
      )}
    </div>
  );
} 