import { cn } from '@/utils/helpers'

const IconButton = ({
  icon: Icon,
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  className,
  disabled = false,
  ...props
}) => {
  const sizeClasses = {
    sm: 'p-1.5 rounded-lg',
    md: 'p-2.5 rounded-xl',
    lg: 'p-3.5 rounded-2xl',
  }

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-brand)',
      color: '#fff',
    },
    secondary: {
      backgroundColor: 'var(--color-surface-raised)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
    },
    danger: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        className
      )}
      style={variantStyles[variant]}
      {...props}
    >
      {Icon ? <Icon size={size === 'sm' ? 16 : 20} /> : children}
    </button>
  )
}

export default IconButton
