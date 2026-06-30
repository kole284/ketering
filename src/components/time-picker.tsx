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
    <div className="time-picker-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        className="time-picker-dialog z-10 max-h-[70vh] w-full max-w-sm overflow-auto p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Izaberi vreme</h3>
          <button
            onClick={onClose}
            className="icon-button"
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
                className={`time-picker-option py-2 px-2 text-sm text-center border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isSel
                    ? 'time-picker-option-selected border-[color:var(--primary)]'
                    : 'time-picker-option-unselected border-[color:var(--border)] bg-transparent'
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
            className="time-picker-secondary-action px-3 py-1 text-sm"
          >
            Otkaži
          </button>
          <button
            onClick={() => {
              if (!selected) return
              onSelect(selected)
              onClose()
            }}
            className="time-picker-primary-action px-4 py-1 text-sm"
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
          'mt-2 flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--input)] px-4 py-3 text-left text-base font-medium text-[color:var(--foreground)] shadow-sm outline-none transition focus:border-[color:var(--primary)]',
          className ?? '',
        ].join(' ')}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={/^\d{2}:\d{2}$/.test(value) ? 'text-[color:var(--foreground)]' : 'text-[color:var(--muted-foreground)]'}>{displayValue}</span>
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
