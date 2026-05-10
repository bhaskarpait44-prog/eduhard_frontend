import { AlarmClock, Calendar, Clock } from 'lucide-react'
import { formatDate } from '@/utils/helpers'

const ExamCountdown = ({ exams = [] }) => {
  if (!exams.length) {
    return (
      <div
        className="rounded-[28px] border p-6 text-center"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <AlarmClock size={20} className="mx-auto" style={{ color: 'var(--color-text-muted)' }} />
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">No upcoming exams right now.</p>
      </div>
    )
  }

  return (
    <section
      className="rounded-[28px] border p-5"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(124,58,237,0.10)] text-[var(--student-accent)]">
          <AlarmClock size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Exam Timetable</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Detailed schedule for your upcoming exams.</p>
        </div>
      </div>

      <div className="mt-5 space-y-6">
        {exams.map((exam) => (
          <div key={exam.id} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-[var(--color-text-primary)]">{exam.name}</h3>
              <span className="rounded-full bg-[rgba(124,58,237,0.12)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--student-accent)]">
                {exam.days_remaining === 0 ? 'Starts Today' : `In ${exam.days_remaining} day(s)`}
              </span>
            </div>
            
            <div className="space-y-2">
              {exam.timetable && exam.timetable.length > 0 ? (
                exam.timetable.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[20px] border p-4 transition-all hover:border-[var(--student-accent)]"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[var(--color-text-primary)]">{item.subject_name}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                            <Calendar size={12} className="text-[var(--student-accent)]" />
                            {formatDate(item.exam_date, 'long')}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                            <Clock size={12} className="text-[var(--student-accent)]" />
                            {formatTime(item.start_time)} - {formatTime(item.end_time)}
                          </div>
                        </div>
                      </div>
                      {item.invigilator_name && (
                        <div className="hidden text-right sm:block">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Invigilator</p>
                          <p className="mt-0.5 text-xs font-medium text-[var(--color-text-secondary)]">{item.invigilator_name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-1 text-xs italic text-[var(--color-text-muted)]">Timetable not yet finalized.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[22px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'rgba(22,163,74,0.06)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700 dark:text-green-300">Study Tip</p>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Plan your revision based on the exam sequence. Focus more on subjects scheduled earlier.
        </p>
      </div>
    </section>
  )
}

function formatTime(time) {
  if (!time) return '--'
  const [h, m] = time.split(':')
  const date = new Date()
  date.setHours(parseInt(h), parseInt(m))
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default ExamCountdown
