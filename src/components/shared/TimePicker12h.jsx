import { useMemo } from 'react'

/**
 * A manual 12-hour time picker with text entry and AM/PM toggle.
 * Values are handled in 24h string format (HH:mm) for compatibility.
 */
const TimePicker12h = ({ label, value, onChange, required = false }) => {
  const { h, m, p } = useMemo(() => {
    if (!value) return { h: '', m: '', p: 'AM' }
    const [H, M] = value.split(':')
    let hours = parseInt(H, 10)
    const period = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return { h: String(hours), m: M.slice(0, 2), p: period }
  }, [value])

  const handleUpdate = (part, val) => {
    let nextH = h, nextM = m, nextP = p

    if (part === 'h') {
      let num = val.replace(/\D/g, '').slice(0, 2)
      if (num !== '') {
        const n = parseInt(num, 10)
        if (n > 12) num = '12'
        if (n < 0) num = '1'
      }
      nextH = num
    } else if (part === 'm') {
      let num = val.replace(/\D/g, '').slice(0, 2)
      if (num !== '') {
        const n = parseInt(num, 10)
        if (n > 59) num = '59'
      }
      nextM = num
    } else if (part === 'p') {
      nextP = val
    }

    if (nextH === '' || nextM === '') {
      onChange('') 
    } else {
      let H = parseInt(nextH, 10)
      if (nextP === 'PM' && H < 12) H += 12
      if (nextP === 'AM' && H === 12) H = 0
      onChange(`${String(H).padStart(2, '0')}:${nextM.padStart(2, '0')}`)
    }
  }

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-[140px]">
      {label && <label className="text-xs font-bold text-muted uppercase tracking-wider">{label}</label>}
      
      <div className="flex gap-1 items-center">
        {/* Hour Input */}
        <input
          type="text"
          inputMode="numeric"
          placeholder="HH"
          value={h}
          required={required}
          onChange={(e) => handleUpdate('h', e.target.value)}
          className="w-12 text-center rounded-xl border py-2 text-sm bg-surface outline-none focus:ring-2 focus:ring-brand/20 transition-all"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        />
        
        <span className="text-muted font-bold">:</span>
        
        {/* Minute Input */}
        <input
          type="text"
          inputMode="numeric"
          placeholder="MM"
          value={m}
          required={required}
          onChange={(e) => handleUpdate('m', e.target.value)}
          className="w-12 text-center rounded-xl border py-2 text-sm bg-surface outline-none focus:ring-2 focus:ring-brand/20 transition-all"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        />

        {/* AM/PM Toggle */}
        <button
          type="button"
          onClick={() => handleUpdate('p', p === 'AM' ? 'PM' : 'AM')}
          className="ml-1 px-3 py-2 rounded-xl text-[11px] font-black transition-all border select-none"
          style={{ 
            backgroundColor: p === 'AM' ? '#eff6ff' : '#fff7ed', 
            color: p === 'AM' ? '#1d4ed8' : '#c2410c',
            borderColor: p === 'AM' ? '#bfdbfe' : '#fed7aa'
          }}
        >
          {p}
        </button>
      </div>
    </div>
  )
}

export default TimePicker12h
