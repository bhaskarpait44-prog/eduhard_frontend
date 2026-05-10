import { useEffect, useMemo, useRef } from 'react'
import { AlertTriangle, CheckCircle2, Save, Send, Users, Activity, Clock, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'

const MarksEntryTable = ({
  rows = [],
  subject,
  state,
  locked = false,
  reviewStatus = null,
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

  const focusNext = (rowIndex, columnIndex, columns) => {
    const nextColumn = columnIndex + 1 < columns.length ? columnIndex + 1 : 0
    const nextRow = columnIndex + 1 < columns.length ? rowIndex : rowIndex + 1
    const targetKey = `${nextRow}:${columns[nextColumn]}`
    inputRefs.current[targetKey]?.focus()
  }

  const columns = subject?.subject_type === 'both'
    ? ['theory_marks_obtained', 'practical_marks_obtained']
    : ['marks_obtained']

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <div
          className="rounded-2xl border bg-surface p-5 shadow-sm"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-text-primary">
                Progress: {progress.entered}/{progress.total}
              </h2>
              <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                <span className="flex items-center gap-1"><Users size={12} /> {progress.remaining} left</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {lastSavedAt || 'Auto-save active'}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                icon={Save}
                loading={saving}
                onClick={onSaveAll}
                disabled={locked}
                className="h-9 rounded-lg px-4 text-xs"
              >
                Save
              </Button>
              <Button
                onClick={onSubmit}
                disabled={locked || incompleteStudents.length > 0}
                icon={Send}
                className="h-9 rounded-lg px-4 text-xs"
              >
                Submit
              </Button>
            </div>
          </div>

          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <InsightCard
            icon={Activity}
            title="Integrity"
            value={incompleteStudents.length ? `${incompleteStudents.length} Missing` : 'OK'}
            tone={incompleteStudents.length ? 'var(--color-error)' : 'var(--color-success)'}
            bg="var(--color-surface-raised)"
          />
          <InsightCard
            icon={ShieldCheck}
            title="Status"
            value={reviewStatus?.status === 'completed' ? 'Final' : 'Draft'}
            tone={reviewStatus?.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)'}
            bg="var(--color-surface-raised)"
          />
        </div>
      </section>

      <section
        className="overflow-hidden rounded-2xl border bg-surface shadow-sm"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-surface-raised/30" style={{ borderColor: 'var(--color-border)' }}>
                {[
                  { label: 'Roll', width: '60px' },
                  { label: 'Name', width: 'auto' },
                  ...(subject?.subject_type === 'both'
                    ? [
                      { label: 'Theory', width: '110px' },
                      { label: 'Practical', width: '110px' },
                      { label: 'Total', width: '80px' },
                    ]
                    : [
                      { label: subject?.subject_type === 'practical' ? 'Practical' : 'Marks', width: '110px' },
                    ]
                  ),
                  { label: 'Grade', width: '80px' },
                  { label: 'Absent', width: '100px' },
                ].map((col) => (
                  <th
                    key={col.label}
                    className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted"
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map((row, rowIndex) => {
                const record = state[row.enrollment_id] || {}
                const theory = Number(record.theory_marks_obtained || 0)
                const practical = Number(record.practical_marks_obtained || 0)
                const combined = subject?.subject_type === 'both' ? theory + practical : Number(record.marks_obtained || 0)
                const passing = Number(subject?.combined_passing_marks || 0)
                const isFailing = !record.is_absent && combined < passing

                return (
                  <tr
                    key={row.enrollment_id}
                    className="group hover:bg-surface-raised/20"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-text-muted">{row.roll_number || '--'}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-text-primary">
                        {row.first_name} {row.last_name}
                      </span>
                    </td>

                    {subject?.subject_type === 'both' ? (
                      <>
                        <td className="px-4 py-3">
                          <MarkInput
                            refKey={`${rowIndex}:theory_marks_obtained`}
                            inputRefs={inputRefs}
                            disabled={locked || record.is_absent}
                            value={record.theory_marks_obtained}
                            max={subject.theory_total_marks}
                            tone={Number(record.theory_marks_obtained || 0) < Number(subject.theory_passing_marks || 0) ? 'var(--color-error)' : 'var(--color-success)'}
                            onChange={(value) => onChange(row.enrollment_id, 'theory_marks_obtained', value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === 'Tab') {
                                event.preventDefault()
                                focusNext(rowIndex, 0, columns)
                              }
                            }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <MarkInput
                            refKey={`${rowIndex}:practical_marks_obtained`}
                            inputRefs={inputRefs}
                            disabled={locked || record.is_absent}
                            value={record.practical_marks_obtained}
                            max={subject.practical_total_marks}
                            tone={Number(record.practical_marks_obtained || 0) < Number(subject.practical_passing_marks || 0) ? 'var(--color-error)' : 'var(--color-success)'}
                            onChange={(value) => onChange(row.enrollment_id, 'practical_marks_obtained', value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === 'Tab') {
                                event.preventDefault()
                                focusNext(rowIndex, 1, columns)
                              }
                            }}
                          />
                        </td>
                        <td className={`px-4 py-3 text-sm font-bold ${record.is_absent ? 'text-text-muted' : isFailing ? 'text-error' : 'text-success'}`}>
                          {record.is_absent ? '—' : combined}
                        </td>
                      </>
                    ) : (
                      <td className="px-4 py-3">
                        <MarkInput
                          refKey={`${rowIndex}:marks_obtained`}
                          inputRefs={inputRefs}
                          disabled={locked || record.is_absent}
                          value={record.marks_obtained}
                          max={subject?.combined_total_marks}
                          tone={isFailing ? 'var(--color-error)' : 'var(--color-success)'}
                          onChange={(value) => onChange(row.enrollment_id, 'marks_obtained', value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === 'Tab') {
                              event.preventDefault()
                              focusNext(rowIndex, 0, columns)
                            }
                          }}
                        />
                      </td>
                    )}

                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        record.is_absent ? 'text-text-muted' : combined >= passing ? 'text-success' : 'text-error'
                      }`}>
                        {record.is_absent ? 'AB' : combined >= passing ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={!!record.is_absent}
                        disabled={locked}
                        onChange={(event) => onChange(row.enrollment_id, 'is_absent', event.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {incompleteStudents.length > 0 && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-bold text-red-900">Missing entries for: {incompleteStudents.map((s) => s.first_name).join(', ')}</p>
        </div>
      )}
    </div>
  )
}

const MarkInput = ({ refKey, inputRefs, disabled, value, max, tone, onChange, onKeyDown }) => (
  <div className="relative">
    <input
      ref={(element) => { inputRefs.current[refKey] = element }}
      type="number"
      min="0"
      max={max}
      step="0.5"
      disabled={disabled}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      className="w-20 rounded-lg bg-surface-raised px-2 py-1.5 text-center text-xs font-bold text-text-primary outline-none ring-1 ring-border focus:ring-primary/50 disabled:opacity-40"
      style={{ borderLeft: `3px solid ${tone}` }}
    />
  </div>
)

const InsightCard = ({ icon: Icon, title, value, tone, bg }) => (
  <div
    className="flex items-center gap-3 rounded-xl border bg-surface p-3 shadow-sm"
    style={{ borderColor: 'var(--color-border)' }}
  >
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: bg, color: tone }}>
      <Icon size={16} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted truncate">{title}</p>
      <p className="text-sm font-bold" style={{ color: tone }}>{value}</p>
    </div>
  </div>
)

export default MarksEntryTable
