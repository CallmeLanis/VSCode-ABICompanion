import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
  glow?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  glow = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'relative font-semibold transition-all duration-200 overflow-hidden rounded-lg';

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-abi-orange to-abi-orange-dark
      text-white
      hover:from-abi-orange-light hover:to-abi-orange
      active:scale-[0.98]
      before:absolute before:inset-0 before:bg-white/20 before:translate-x-[-100%]
      hover:before:translate-x-[100%] before:transition-transform before:duration-300
    `,
    secondary: `
      bg-abi-bg-card border border-abi-border
      text-abi-text
      hover:bg-abi-bg-hover hover:border-abi-border-glow
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent
      text-abi-text-muted
      hover:text-abi-text hover:bg-abi-bg-hover
      active:scale-[0.98]
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-700
      text-white
      hover:from-red-500 hover:to-red-600
      active:scale-[0.98]
    `,
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const glowStyle = glow
    ? 'shadow-glow hover:shadow-glow-lg'
    : '';

  const disabledStyle = disabled || loading
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : '';

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${glowStyle}
        ${disabledStyle}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}
      <span className={loading ? 'invisible' : ''}>{children}</span>
    </button>
  );
}
