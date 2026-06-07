import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

const Card = ({ children, className = '', hover = false }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-slate-850 rounded-xl border border-slate-700/50 shadow-card',
        hover && 'card-hover cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

Card.Header = ({ children, className = '' }: CardHeaderProps) => {
  return (
    <div className={cn('px-5 py-4 border-b border-slate-700/50', className)}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

Card.Title = ({ children, className = '' }: CardTitleProps) => {
  return (
    <h3 className={cn('text-sm font-semibold text-slate-100', className)}>
      {children}
    </h3>
  );
};

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

Card.Body = ({ children, className = '' }: CardBodyProps) => {
  return <div className={cn('p-5', className)}>{children}</div>;
};

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

Card.Footer = ({ children, className = '' }: CardFooterProps) => {
  return (
    <div className={cn('px-5 py-3 border-t border-slate-700/50', className)}>
      {children}
    </div>
  );
};

export default Card;
