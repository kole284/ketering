import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type TimePickerModalProps = {
  isOpen: boolean
  onClose: () => void
  onSelect: (time: string) => void
  minTime?: string // 'HH:MM'
  maxTime?: string // 'HH:MM'
  stepMinutes?: number
  initial?: string
  light?: boolean
}

const parseToMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

const formatHHMM = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(h)}:${pad(m)}`
}

function TimePickerModal({
  isOpen,
  onClose,
  onSelect,
  minTime = '00:00',
  maxTime = '23:59',
  stepMinutes = 30,
  initial,
  light = false,
}: TimePickerModalProps) {
  const [selected, setSelected] = useState<string | undefined>(initial)
  const firstRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // lock scroll
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      setTimeout(() => firstRef.current?.focus(), 0)
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const minM = parseToMinutes(minTime)
  const maxM = parseToMinutes(maxTime)
  const times: string[] = []
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    times.push(formatHHMM(m))
  }

  const isAllowed = (t: string) => {
    const mm = parseToMinutes(t)
    return mm >= minM && mm <= maxM
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        className={`z-10 w-80 max-h-[70vh] overflow-auto rounded-lg shadow-lg p-4 mx-4 ${
          light ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Izaberi vreme</h3>
          <button
            onClick={onClose}
            className="text-sm opacity-80 hover:opacity-100"
            aria-label="Zatvori"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {times.map((t, i) => {
            const allowed = isAllowed(t)
            const isSel = selected === t
            return (
              <button
                key={t}
                ref={i === 0 ? firstRef : undefined}
                type="button"
                onClick={() => {
                  if (!allowed) return
                  setSelected(t)
                }}
                onDoubleClick={() => {
                  if (!allowed) return
                  onSelect(t)
                  onClose()
                }}
                disabled={!allowed}
                className={`py-2 px-2 rounded text-sm text-center border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isSel
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : light
                    ? 'bg-white/5 border-slate-200'
                    : 'bg-transparent border-slate-700'
                }`}
              >
                {t}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-transparent border text-sm"
          >
            Otkaži
          </button>
          <button
            onClick={() => {
              if (!selected) return
              onSelect(selected)
              onClose()
            }}
            className="px-4 py-1 rounded bg-indigo-600 text-white text-sm"
            disabled={!selected}
          >
            Odaberi
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// Controlled wrapper API similar to DatePicker used across the app
type TimePickerProps = {
  value: string
  onChange: (value: string) => void
  required?: boolean
  minTime?: string
  maxTime?: string
  className?: string
}

export function TimePicker({ value, onChange, minTime, maxTime, className }: TimePickerProps) {
  const [open, setOpen] = useState(false)

  const displayValue = value && /^\d{2}:\d{2}$/.test(value) ? value : 'Izaberi vreme'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          'mt-2 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-base font-medium shadow-sm outline-none transition focus:border-teal-500',
          className ?? '',
        ].join(' ')}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={/^\d{2}:\d{2}$/.test(value) ? 'text-slate-900' : 'text-slate-400'}>{displayValue}</span>
      </button>

      <TimePickerModal
        key={value || "empty"}
        isOpen={open}
        onClose={() => setOpen(false)}
        onSelect={(t) => {
          onChange(t)
          setOpen(false)
        }}
        initial={value}
        minTime={minTime}
        maxTime={maxTime}
      />
    </>
  )
}

export default TimePicker
