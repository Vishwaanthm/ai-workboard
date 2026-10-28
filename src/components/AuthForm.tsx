import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Input, Label } from './ui/input'

export interface FieldError {
  field: string
  message: string
}

/** Focused summary shown after a failed submit, linking to each field with an error. */
export function ErrorSummary({
  errors,
  formError,
  attempt,
}: {
  errors: FieldError[]
  formError?: string
  /** Increment on every failed submit so the summary takes focus again. */
  attempt: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (attempt > 0) ref.current?.focus()
  }, [attempt])
  if (errors.length === 0 && !formError) return null
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby="error-summary-title"
      className="rounded-panel border border-destructive/30 bg-destructive-soft p-4 text-destructive-soft-foreground outline-none focus-visible:outline-2"
    >
      <p id="error-summary-title" className="font-semibold">
        There is a problem
      </p>
      {formError ? <p className="mt-1">{formError}</p> : null}
      {errors.length > 0 ? (
        <ul className="mt-1 flex flex-col">
          {errors.map((e) => (
            <li key={e.field}>
              <a href={`#${e.field}`} className="inline-flex min-h-11 items-center underline underline-offset-4">
                {e.message}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function describedBy(id: string, error?: string, hint?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
}

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  error,
  hint,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  autoComplete: 'current-password' | 'new-password'
  error?: string
  hint?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex gap-2">
      <Input
        id={id}
        name={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label="Show password"
        aria-pressed={visible}
        aria-controls={id}
        className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-input bg-card transition-colors duration-[120ms] hover:bg-primary-soft"
      >
        {visible ? (
          <EyeOff aria-hidden="true" strokeWidth={1.75} className="size-5" />
        ) : (
          <Eye aria-hidden="true" strokeWidth={1.75} className="size-5" />
        )}
      </button>
    </div>
  )
}
