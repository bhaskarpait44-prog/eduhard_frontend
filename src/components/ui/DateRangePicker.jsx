// src/components/ui/DateRangePicker.jsx
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { cn } from '@/utils/helpers'

const DateRangePicker = ({ fromDate, toDate, onFromChange, onToChange, className }) => {
  const disabledFromDate = (current) => {
    if (!current) return false;
    if (toDate) {
      return current.isAfter(dayjs(toDate).endOf('day'));
    }
    return false;
  };

  const disabledToDate = (current) => {
    if (!current) return false;
    if (fromDate) {
      return current.isBefore(dayjs(fromDate).startOf('day'));
    }
    return false;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          From
        </label>
        <DatePicker
          value={fromDate ? dayjs(fromDate) : null}
          disabledDate={disabledFromDate}
          onChange={(date, dateString) => onFromChange(date ? date.format('YYYY-MM-DD') : '')}
          placeholder="Start date"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: 'var(--color-surface)',
            border         : '1.5px solid var(--color-border)',
            color          : 'var(--color-text-primary)',
            height         : '38px',
          }}
          format="DD-MM-YYYY"
        />
      </div>
      <span className="mt-5 text-sm" style={{ color: 'var(--color-text-muted)' }}>—</span>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          To
        </label>
        <DatePicker
          value={toDate ? dayjs(toDate) : null}
          disabledDate={disabledToDate}
          onChange={(date, dateString) => onToChange(date ? date.format('YYYY-MM-DD') : '')}
          placeholder="End date"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: 'var(--color-surface)',
            border         : '1.5px solid var(--color-border)',
            color          : 'var(--color-text-primary)',
            height         : '38px',
          }}
          format="DD-MM-YYYY"
        />
      </div>
    </div>
  )
}

export default DateRangePicker