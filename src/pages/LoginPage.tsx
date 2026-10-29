import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { describedBy, ErrorSummary, Field, PasswordInput, type FieldError } from '@/components/AuthForm'
import { AuthShell } from '@/components/AuthShell'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppState } from '@/context/useAppState'
import { authFailureMessage } from '@/lib/auth'
import { safeNext } from '@/lib/redirect'

export default function LoginPage() {
  const { login } = useAppState()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string>()
  const [attempt, setAttempt] = useState(0)
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (pending) return
    const fieldErrors: { email?: string; password?: string } = {}
    if (!email.trim()) fieldErrors.email = 'Enter your email address.'
    if (!password) fieldErrors.password = 'Enter your password.'
    setErrors(fieldErrors)
    setFormError(undefined)
    if (Object.keys(fieldErrors).length > 0) {
      setAttempt((n) => n + 1)
      return
    }
    setPending(true)
    const result = await login(email, password)
    setPending(false)
    if (result.ok) {
      navigate(safeNext(next), { replace: true })
      return
    }
    setFormError(result.reason === 'invalid' ? authFailureMessage.credentials : authFailureMessage[result.reason])
    setAttempt((n) => n + 1)
  }

  const summary: FieldError[] = (['email', 'password'] as const)
    .filter((f) => errors[f])
    .map((f) => ({ field: f, message: errors[f] ?? '' }))

  return (
    <AuthShell>
        <PageHeading title="Log in" className="text-[34px] leading-[1.05] font-extrabold md:text-[44px]" />
        <p className="mt-3 text-muted-foreground">Accounts are stored only in this browser.</p>
        <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
          <ErrorSummary errors={summary} formError={formError} attempt={attempt} />
          <Field id="email" label="Email" error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describedBy('email', errors.email)}
            />
          </Field>
          <Field id="password" label="Password" error={errors.password}>
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              error={errors.password}
            />
          </Field>
          <Button type="submit" size="lg" disabled={pending} aria-busy={pending || undefined}>
            {pending ? 'Logging in...' : 'Log in'}
          </Button>
        </form>
        <p className="mt-6 text-muted-foreground">
          New here?{' '}
          <Link
            to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}
            className="link"
          >
            Create an account
          </Link>
        </p>
    </AuthShell>
  )
}
