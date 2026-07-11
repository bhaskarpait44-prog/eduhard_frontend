import { useEffect, useMemo, useRef } from 'react'
import { AlertTriangle, CheckCircle2, Save, Send, Users, Activity, Clock, ShieldCheck, ChevronDown, ChevronUp, RefreshCw, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/helpers'

const MarksEntryTable = ({
  rows = [],
  subject,
  state,
  locked = false,
  saving = false,
  lastSavedAt,
  onChange,
  onSaveAll,
  onSubmit,
}) => {
  const inputRefs = useRef({})

  const progress = useMemo(() => {
    const entered = rows.filter((row) => {
      const record = state[row.enrollment_id] || {}
      if (record.is_absent) return true
      if (subject?.subject_type === 'both') {
        return record.theory_marks_obtained !== '' && record.theory_marks_obtained != null &&
          record.practical_marks_obtained !== '' && record.practical_marks_obtained != null
      }
      return record.marks_obtained !== '' && record.marks_obtained != null
    }).length

    return {
      entered,
      total: rows.length,
      percentage: rows.length ? Math.round((entered / rows.length) * 100) : 0,
      remaining: rows.length - entered,
    }
  }, [rows, state, subject])

  const incompleteStudents = useMemo(() => rows.filter((row) => {
    const record = state[row.enrollment_id] || {}
    if (record.is_absent) return false
    if (subject?.subject_type === 'both') {
      return record.theory_marks_obtained === '' || record.theory_marks_obtained == null ||
        record.practical_marks_obtained === '' || record.practical_marks_obtained == null
    }
    return record.marks_obtained === '' || record.marks_obtained == null
  }), [rows, state, subject])

  useEffect(() => {
    const handleSaveShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        onSaveAll()
      }
    }

    window.addEventListener('keydown', handleSaveShortcut)
    return () => window.removeEventListener('keydown', handleSaveShortcut)
  }, [onSaveAll])

  const columns = subject?.subject_type === 'both'
    ? ['theory_marks_obtained', 'practical_marks_obtained']
    : ['marks_obtained']

  const handleKeyDown = (event, rowIndex, colIndex) => {
    const { key } = event
    let nextRow = rowIndex
    let nextCol = colIndex

    if (key === 'ArrowDown') nextRow++
    else if (key === 'ArrowUp') nextRow--
    else if (key === 'ArrowRight' && event.target.selectionEnd === event.target.value.length) nextCol++
    else if (key === 'ArrowLeft' && event.target.selectionStart === 0) nextCol--
    else if (key === 'Enter') {
      event.preventDefault()
      nextRow++
    } else if (key === 'Tab') {
      return
    } else {
      return
    }

    if (nextCol >= columns.length) {
      nextCol = 0
      nextRow++
    } else if (nextCol < 0) {
      nextCol = columns.length - 1
      nextRow--
    }

    if (nextRow >= 0 && nextRow < rows.length) {
      const targetKey = `${nextRow}:${columns[nextCol]}`
      inputRefs.current[targetKey]?.focus()
      inputRefs.current[targetKey]?.select()
      event.preventDefault()
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Summary Stats ── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: progress.total, color: 'var(--color-text-primary)' },
          { label: 'Entered', value: progress.entered, color: '#10b981' },
          { label: 'Pending', value: progress.remaining, color: progress.remaining > 0 ? '#f59e0b' : '#10b981' },
          { label: 'Completion', value: `${progress.percentage}%`, color: 'var(--color-primary)' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border p-4 sm:p-5"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {/* ── Action Bar ── */}
      <section 
        className="sticky top-0 z-20 rounded-2xl border bg-surface/90 p-4 shadow-sm backdrop-blur-md"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
              <Activity size={20} />
            </div>
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider">Progress</span>
                <span className="text-[11px] font-black text-primary">{progress.percentage}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-raised overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-700 ease-in-out"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastSavedAt && (
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                <Clock size={11} />
                Saved {lastSavedAt}
              </span>
            )}
            <Button
              variant="outline"
              icon={saving ? Loader2 : Save}
              loading={saving}
              onClick={onSaveAll}
              disabled={locked}
              className="min-h-[40px] px-5 text-sm font-bold"
            >
              Save Draft
            </Button>
            <Button
              onClick={onSubmit}
              disabled={locked || incompleteStudents.length > 0}
              icon={Send}
              className="min-h-[40px] px-6 text-sm font-bold shadow-lg shadow-primary/20"
            >
              Submit Marks
            </Button>
          </div>
        </div>
      </section>

      {/* ── Table ── */}
      <section
        className="overflow-hidden rounded-2xl border bg-surface shadow-sm"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-surface-raised/30" style={{ borderColor: 'var(--color-border)' }}>
                {[
                  { label: 'Roll', width: '70px', align: 'center' },
                  { label: 'Student Information', width: 'auto', align: 'left' },
                  ...(subject?.subject_type === 'both'
                    ? [
                      { label: 'Theory', width: '100px', align: 'center' },
                      { label: 'Practical', width: '100px', align: 'center' },
                      { label: 'Total', width: '90px', align: 'center' },
                    ]
                    : [
                      { label: subject?.subject_type === 'practical' ? 'Practical' : 'Marks', width: '110px', align: 'center' },
                    ]
                  ),
                  { label: 'Status', width: '90px', align: 'center' },
                  { label: 'Absent', width: '70px', align: 'center' },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={cn(
                      "px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted",
                      col.align === 'center' ? 'text-center' : 'text-left'
                    )}
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rows.map((row, rowIndex) => {
                const record = state[row.enrollment_id] || {}
                const theory = record.theory_marks_obtained === '' ? null : Number(record.theory_marks_obtained)
                const practical = record.practical_marks_obtained === '' ? null : Number(record.practical_marks_obtained)
                const marks = record.marks_obtained === '' ? null : Number(record.marks_obtained)

                const combined = subject?.subject_type === 'both'
                  ? (theory === null && practical === null ? null : (theory || 0) + (practical || 0))
                  : marks

                const passing = Number(subject?.combined_passing_marks || 0)
                const isFailing = !record.is_absent && combined !== null && combined < passing
                const isComplete = record.is_absent || (
                  subject?.subject_type === 'both'
                    ? theory !== null && practical !== null
                    : marks !== null
                )

                return (
                  <tr
                    key={row.enrollment_id}
                    className={cn(
                      "group transition-colors duration-150 hover:bg-surface-raised/40",
                      !isComplete && "bg-amber-50/20",
                      record.is_absent && "bg-slate-50/50"
                    )}
                  >
                    <td className="px-4 py-3 text-center text-xs font-mono font-bold text-text-muted">
                      {row.roll_number || '--'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                          {row.first_name} {row.last_name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-text-muted uppercase tracking-widest">ID: {row.student_id}</span>
                          {row.attendance_status === 'absent' && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-black text-red-700 uppercase tracking-wider animate-pulse">
                              Absent in Class
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {subject?.subject_type === 'both' ? (
                      <>
                        <td className="px-4 py-3 text-center">
                          <MarkInput
                            refKey={`${rowIndex}:theory_marks_obtained`}
                            inputRefs={inputRefs}
                            disabled={locked || record.is_absent}
                            value={record.theory_marks_obtained}
                            max={subject.theory_total_marks}
                            tone={theory !== null && theory < Number(subject.theory_passing_marks || 0) ? 'var(--color-error)' : 'var(--color-success)'}
                            onChange={(value) => onChange(row.enrollment_id, 'theory_marks_obtained', value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, 0)}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <MarkInput
                            refKey={`${rowIndex}:practical_marks_obtained`}
                            inputRefs={inputRefs}
                            disabled={locked || record.is_absent}
                            value={record.practical_marks_obtained}
                            max={subject.practical_total_marks}
                            tone={practical !== null && practical < Number(subject.practical_passing_marks || 0) ? 'var(--color-error)' : 'var(--color-success)'}
                            onChange={(value) => onChange(row.enrollment_id, 'practical_marks_obtained', value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, 1)}
                          />
                        </td>
                        <td className={cn(
                          "px-4 py-3 text-center text-sm font-black",
                          record.is_absent ? 'text-text-muted' : isFailing ? 'text-error' : 'text-success'
                        )}>
                          {record.is_absent ? '—' : combined ?? '—'}
                        </td>
                      </>
                    ) : (
                      <td className="px-4 py-3 text-center">
                        <MarkInput
                          refKey={`${rowIndex}:marks_obtained`}
                          inputRefs={inputRefs}
                          disabled={locked || record.is_absent}
                          value={record.marks_obtained}
                          max={subject?.combined_total_marks}
                          tone={marks !== null && marks < passing ? 'var(--color-error)' : 'var(--color-success)'}
                          onChange={(value) => onChange(row.enrollment_id, 'marks_obtained', value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 0)}
                        />
                      </td>
                    )}

                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                        record.is_absent
                          ? 'bg-slate-100 text-slate-600'
                          : combined === null
                            ? 'bg-amber-100 text-amber-700'
                            : combined >= passing
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                      )}>
                        {record.is_absent ? 'ABSENT' : combined === null ? 'PENDING' : combined >= passing ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={!!record.is_absent}
                          disabled={locked || row.attendance_status === 'absent'}
                          onChange={(event) => onChange(row.enrollment_id, 'is_absent', event.target.checked)}
                          className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary disabled:opacity-30"
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Shortcuts ── */}
      <section className="flex flex-wrap gap-4 items-center justify-between text-text-muted">
        <div className="flex flex-wrap gap-4">
          <ShortcutItem keys={['↑', '↓']} label="Navigate" />
          <ShortcutItem keys={['Enter']} label="Next row" />
          <ShortcutItem keys={['Ctrl', 'S']} label="Save draft" />
        </div>
        {incompleteStudents.length > 0 && (
          <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
            <AlertTriangle size={14} />
            <span>{incompleteStudents.length} entries remaining</span>
          </div>
        )}
      </section>
    </div>
  )
}

const MarkInput = ({ refKey, inputRefs, disabled, value, max, tone, onChange, onKeyDown }) => (
  <div className="flex justify-center">
    <input
      // eslint-disable-next-line react-hooks/immutability
      ref={(element) => { inputRefs.current[refKey] = element }}
      type="number"
      min="0"
      max={max}
      step="0.5"
      placeholder="0.0"
      disabled={disabled}
      value={value ?? ''}
      onChange={(event) => {
        const val = event.target.value
        if (val === '') {
          onChange('')
          return
        }
        const numVal = Number(val)
        if (!isNaN(numVal) && numVal >= 0) {
          if (!max || isNaN(Number(max)) || numVal <= Number(max)) {
            onChange(val)
          }
        }
      }}
      onKeyDown={onKeyDown}
      className={cn(
        "w-16 rounded-lg bg-surface-raised px-2 py-1.5 text-center text-xs font-black text-text-primary outline-none transition-all border-b-2",
        "focus:bg-surface focus:ring-2 focus:ring-primary/30 focus:border-primary",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        "placeholder:text-text-muted/30"
      )}
      style={{ borderBottomColor: tone }}
    />
  </div>
)

const ShortcutItem = ({ keys, label }) => (
  <div className="flex items-center gap-2">
    <div className="flex gap-1">
      {keys.map(k => (
        <kbd key={k} className="rounded border border-border bg-surface-raised px-1.5 py-0.5 text-[10px] font-black text-text-primary">
          {k}
        </kbd>
      ))}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </div>
)

export default MarksEntryTable
