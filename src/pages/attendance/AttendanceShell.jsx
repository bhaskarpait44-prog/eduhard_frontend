import { cn } from '@/utils/helpers'

export const AttendanceHero = ({ badge, title, description, meta = [], actions, children }) => (
  <section
    className="rounded-2xl border"
    style={{
      background:
        'linear-gradient(135deg, color-mix(in srgb, var(--color-brand) 10%, var(--color-surface)) 0%, var(--color-surface) 52%, color-mix(in srgb, var(--color-surface-raised) 70%, white) 100%)',
      borderColor: 'color-mix(in srgb, var(--color-brand) 16%, var(--color-border))',
    }}
  >
    <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between lg:p-5">
      <div className="space-y-3">
        {badge ? (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-brand) 10%, var(--color-surface))',
              color: 'var(--color-brand-dark)',
              border: '1px solid color-mix(in srgb, var(--color-brand) 18%, var(--color-border))',
            }}
          >
            {badge}
          </span>
        ) : null}

        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {description}
            </p>
          ) : null}
        </div>

        {meta.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {meta.map((item) => (
              <div
                key={item.label}
                className="min-w-[110px] rounded-xl border px-3 py-2"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-surface) 84%, white)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <p className="text-[9px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>

    {children ? (
      <div
        className="rounded-b-2xl border-t px-4 py-3 lg:px-5"
        style={{
          borderColor: 'color-mix(in srgb, var(--color-brand) 10%, var(--color-border))',
          backgroundColor: 'color-mix(in srgb, var(--color-surface) 94%, white)',
        }}
      >
        {children}
      </div>
    ) : null}
  </section>
)

export const AttendanceSection = ({ title, description, action, className, children }) => (
  <section
    className={cn('rounded-3xl border p-5 shadow-sm sm:p-6', className)}
    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
  >
    {(title || description || action) ? (
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {title ? (
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="text-sm leading-6" style={{ color: 'var(--color-text-secondary)' }}>
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
      </div>
    ) : null}
    {children}
  </section>
)

export const AttendanceMetric = ({ label, value, hint, tone = 'default' }) => {
  const tones = {
    default: {
      value: 'var(--color-text-primary)',
      bg: 'var(--color-surface-raised)',
      border: 'var(--color-border)',
    },
    success: { value: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
    warning: { value: '#b45309', bg: '#fffbeb', border: '#fde68a' },
    danger: { value: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    info: { value: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  }

  const palette = tones[tone] || tones.default

  return (
    <div className="rounded-2xl border px-4 py-4" style={{ backgroundColor: palette.bg, borderColor: palette.border }}>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold" style={{ color: palette.value }}>
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
