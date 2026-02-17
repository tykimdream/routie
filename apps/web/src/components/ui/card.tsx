import { type HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { hoverable = false, padding = 'md', className = '', children, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={`
          bg-white rounded-[12px] shadow-sm border border-sand-200
          ${hoverable ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200' : ''}
          ${paddingStyles[padding]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = 'Card';
