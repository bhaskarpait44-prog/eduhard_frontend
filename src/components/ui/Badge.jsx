// src/components/ui/Badge.jsx
import { cn } from '@/utils/helpers'

const VARIANT_CLASSES = {
  blue:   'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  green:  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800',
  amber:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  grey:   'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-850 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  dark:   'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
  red:    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
}

const DOT_CLASSES = {
  blue:   'bg-blue-600 dark:bg-blue-400',
  green:  'bg-emerald-600 dark:bg-emerald-400',
  yellow: 'bg-yellow-600 dark:bg-yellow-400',
  amber:  'bg-amber-600 dark:bg-amber-400',
  grey:   'bg-slate-500 dark:bg-slate-400',
  dark:   'bg-slate-700 dark:bg-slate-400',
  red:    'bg-red-600 dark:bg-red-400',
  purple: 'bg-purple-600 dark:bg-purple-400',
  indigo: 'bg-indigo-600 dark:bg-indigo-400',
}

const SIZE_CLASSES = {
  xs: 'px-2 py-0.5 text-[11px] gap-1 font-semibold',
  sm: 'px-2.5 py-0.5 text-xs gap-1.5 font-medium',
  md: 'px-3 py-1 text-sm gap-2 font-medium',
  lg: 'px-3.5 py-1.5 text-sm gap-2 font-medium',
}

const Badge = ({ variant = 'grey', children, size = 'sm', dot = false, className, style }) => {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.grey
  const dotClass = DOT_CLASSES[variant] || DOT_CLASSES.grey
  const sizeClass = SIZE_CLASSES[size] || (size === 'xs' ? SIZE_CLASSES.xs : SIZE_CLASSES.sm)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-solid transition-colors duration-150',
        variantClass,
        sizeClass,
        className,
      )}
      style={style}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotClass)}
        />
      )}
      {children}
    </span>
  )
}

export default Badge
