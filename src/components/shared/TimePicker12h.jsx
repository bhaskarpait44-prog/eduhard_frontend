import { useState, useEffect, useCallback } from 'react'

/**
 * A manual 12-hour time picker with text entry and AM/PM toggle.
 * Uses internal state to allow typing partial values.
 */
const TimePicker12h = ({ label, value, onChange, required = false }) => {
  const [prevValue, setPrevValue] = useState(value)
  const [localH, setLocalH] = useState('')
  const [localM, setLocalM] = useState('')
  const [localP, setLocalP] = useState('AM')

  if (value !== prevValue) {
    setPrevValue(value)
    if (!value) {
      setLocalH('')
      setLocalM('')
    } else {
      const [H, M] = value.split(':')
      let h = parseInt(H, 10)
      const p = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      setLocalH(String(h))
      setLocalM(M.slice(0, 2))
      setLocalP(p)
    }
  }

  const pushUpdate = useCallback((h, m, p) => {
    if (h === '' || m === '') {
      // Don't clear parent state unless both are empty (optional logic)
      if (h === '' && m === '') onChange('')
      return
    }
    
    let H = parseInt(h, 10)
    if (p === 'PM' && H < 12) H += 12
    if (p === 'AM' && H === 12) H = 0
    
    const formatted = `${String(H).padStart(2, '0')}:${m.padStart(2, '0')}`
    if (formatted !== value) {
      onChange(formatted)
    }
  }, [onChange, value])

  const handleHChange = (val) => {
    let num = val.replace(/\D/g, '').slice(0, 2)
    if (num !== '') {
      const n = parseInt(num, 10)
      if (n > 12) num = '12'
      if (n === 0) num = '1' // 0 isn't valid in 12h format
    }
    setLocalH(num)
    pushUpdate(num, localM, localP)
  }

  const handleMChange = (val) => {
    let num = val.replace(/\D/g, '').slice(0, 2)
    if (num !== '') {
      const n = parseInt(num, 10)
      if (n > 59) num = '59'
    }
    setLocalM(num)
    pushUpdate(localH, num, localP)
  }

  const togglePeriod = () => {
    const nextP = localP === 'AM' ? 'PM' : 'AM'
    setLocalP(nextP)
    pushUpdate(localH, localM, nextP)
  }

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-[140px]">
      {label && <label className="text-xs font-bold text-muted uppercase tracking-wider">{label}</label>}
      
      <div className="flex gap-1 items-center">
        <input
          type="text"
          inputMode="numeric"
          placeholder="HH"
          value={localH}
          required={required}
          onChange={(e) => handleHChange(e.target.value)}
          className="w-12 text-center rounded-xl border py-2 text-sm bg-surface outline-none focus:ring-2 focus:ring-brand/20 transition-all"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        />
        
        <span className="text-muted font-bold">:</span>
        
        <input
          type="text"
          inputMode="numeric"
          placeholder="MM"
          value={localM}
          required={required}
          onChange={(e) => handleMChange(e.target.value)}
          className="w-12 text-center rounded-xl border py-2 text-sm bg-surface outline-none focus:ring-2 focus:ring-brand/20 transition-all"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        />

        <button
          type="button"
          onClick={togglePeriod}
          className="ml-1 px-3 py-2 rounded-xl text-[11px] font-black transition-all border select-none"
          style={{ 
            backgroundColor: localP === 'AM' ? '#eff6ff' : '#fff7ed', 
            color: localP === 'AM' ? '#1d4ed8' : '#c2410c',
            borderColor: localP === 'AM' ? '#bfdbfe' : '#fed7aa'
          }}
        >
          {localP}
        </button>
      </div>
    </div>
  )
}

export default TimePicker12h
