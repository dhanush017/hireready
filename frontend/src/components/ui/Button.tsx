import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

    const variants = {
      primary:
        'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 focus-visible:outline-accent-600 shadow-sm',
      secondary:
        'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 active:bg-zinc-100 focus-visible:outline-accent-600 shadow-sm',
      outline:
        'bg-transparent text-zinc-700 border border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 active:bg-zinc-100 focus-visible:outline-accent-600',
      ghost:
        'bg-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 active:bg-zinc-200/70 focus-visible:outline-accent-600',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 h-8 gap-1.5',
      md: 'text-sm px-3.5 py-2 h-10 gap-2 min-h-[40px] sm:min-h-[40px]',
      lg: 'text-[15px] px-4 py-2.5 h-11 min-h-[44px] gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" strokeWidth={1.75} />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
