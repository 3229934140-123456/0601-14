import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Card from '../Card/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const StatCard = ({
  title,
  value,
  icon,
  trend,
  trendUp,
  color = 'primary',
  className = '',
}: StatCardProps) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  };

  const trendColor = trendUp ? 'text-success' : 'text-danger';

  return (
    <Card className={className}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-slate-400 mb-1.5">{title}</p>
            <p className="text-2xl font-bold text-slate-100 font-numeric">{value}</p>
            {trend && (
              <p className={cn('text-xs mt-2', trendColor)}>
                {trendUp ? '↑' : '↓'} {trend}
              </p>
            )}
          </div>
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', colorClasses[color])}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
