import { type ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm',
  secondary:
    'bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 shadow-sm',
  outline:
    'border-2 border-primary-300 text-primary-600 hover:bg-primary-50 active:bg-primary-100',
  ghost: 'text-sand-600 hover:bg-sand-100 active:bg-sand-200',
  danger: 'bg-error text-white hover:bg-red-600 active:bg-red-700',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-[8px]',
  md: 'px-6 py-3 text-base rounded-[8px]',
  lg: 'px-8 py-4 text-lg rounded-[12px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center font-semibold
          transition-all duration-200 ease-out
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
