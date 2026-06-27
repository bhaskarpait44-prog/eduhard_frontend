import { ArrowRight, Sparkles } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import { cn } from '@/utils/helpers'

const StudentPageShell = ({
  title,
  eyebrow,
  description,
  highlights = [],
  icon: PageIcon,
}) => {
  usePageTitle(title)

  return (
    <div className="space-y-5">
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden rounded-3xl border px-5 py-6 sm:px-6"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(79,70,229,0.10) 52%, var(--color-surface) 100%)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 4px 24px rgba(109,40,217,0.09)',
        }}
      >
        {/* Top accent stripe */}
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #7c3aed, #6366f1)' }} />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex items-start gap-4">
            {/* Page icon */}
            <div
              className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm"
              style={{ backgroundColor: 'rgba(124,58,237,0.12)', color: 'var(--student-accent)' }}
            >
              {PageIcon ? <PageIcon size={22} /> : <Sparkles size={22} />}
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.20em]" style={{ color: 'var(--student-accent)' }}>
                {eyebrow}
              </p>
              <h1 className="mt-1.5 text-2xl font-bold leading-tight sm:text-[28px]">{title}</h1>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[var(--color-text-secondary)] sm:text-[15px]">
                {description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Highlight cards ── */}
      {highlights.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className={cn('relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5')}
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                boxShadow: '0 2px 12px rgba(76, 29, 149, 0.06)',
              }}
            >
              {/* Left accent */}
              <div
                className="absolute inset-y-0 left-0 w-1 rounded-full"
                style={{ backgroundColor: 'var(--student-accent)' }}
              />
              <div className="pl-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>{item.title}</p>
                <p className="mt-2 text-[13px] leading-5 text-[var(--color-text-secondary)]">{item.body}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--student-accent)' }}>
                  <span>Ready for feature build</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

export default StudentPageShell
