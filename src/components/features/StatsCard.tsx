import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'gold' | 'red';
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
  className,
}) => {
  const colorStyles = {
    blue: 'from-primary-50 to-primary-100/50 text-primary-900 border-primary-100',
    green: 'from-green-50 to-green-100/50 text-green-700 border-green-100',
    gold: 'from-amber-50 to-amber-100/50 text-amber-700 border-amber-100',
    red: 'from-red-50 to-red-100/50 text-red-700 border-red-100',
  };

  const iconBgStyles = {
    blue: 'bg-primary-900 text-white',
    green: 'bg-green-600 text-white',
    gold: 'bg-amber-500 text-white',
    red: 'bg-red-500 text-white',
  };

  return (
    <div
      className={cn(
        'card card-hover p-5 bg-gradient-to-br border',
        colorStyles[color],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="stats-value">{value}</span>
            {trend !== undefined && (
              <div
                className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  trend >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          {subtitle && <p className="text-xs opacity-60 mt-1">{subtitle}</p>}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shadow-lg',
            iconBgStyles[color]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};
