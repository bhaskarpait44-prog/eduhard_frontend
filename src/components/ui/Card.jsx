// src/components/ui/Card.jsx
import { cn } from '@/utils/helpers'

const Card = ({ title, children, className, headerAction }) => {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border shadow-sm',
        className,
      )}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {(title || headerAction) && (
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
        >
          {title && (
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {title}
            </h3>
          )}
          {headerAction}
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

export default Card
