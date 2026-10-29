import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { describedBy, ErrorSummary, Field, PasswordInput, type FieldError } from '@/components/AuthForm'
import { AuthShell } from '@/components/AuthShell'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppState } from '@/context/useAppState'
import { authFailureMessage, PASSWORD_MIN, type RegisterErrors } from '@/lib/auth'
import { safeNext } from '@/lib/redirect'

export default function RegisterPage() {
  const { register } = useAppState()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [formError, setFormError] = useState<string>()
  const [attempt, setAttempt] = useState(0)
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setFormError(undefined)
    const result = await register({ name, email, password })
    setPending(false)
    if (result.ok) {
      navigate(safeNext(next), { replace: true })
      return
    }
    if (result.reason === 'invalid') {
      setErrors(result.errors)
    } else {
      setErrors({})
      setFormError(authFailureMessage[result.reason])
    }
    setAttempt((n) => n + 1)
  }

  const summary: FieldError[] = (['name', 'email', 'password'] as const)
    .filter((f) => errors[f])
    .map((f) => ({ field: f, message: errors[f] ?? '' }))

  return (
    <AuthShell>
        <PageHeading title="Create your account" className="text-[34px] leading-[1.05] font-extrabold md:text-[44px]" />
        <p className="mt-3 text-muted-foreground">
          Demo account: stored only in this browser. Do not reuse a password you use anywhere else.
        </p>
        <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
          <ErrorSummary errors={summary} formError={formError} attempt={attempt} />
          <Field id="name" label="Full name" error={errors.name} hint="Shown on your certificate.">
            <Input
              id="name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describedBy('name', errors.name, 'hint')}
            />
          </Field>
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
          <Field id="password" label="Password" error={errors.password} hint={`At least ${PASSWORD_MIN} characters.`}>
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              error={errors.password}
              hint="hint"
            />
          </Field>
          <Button type="submit" size="lg" disabled={pending} aria-busy={pending || undefined}>
            {pending ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        <p className="mt-6 text-muted-foreground">
          Already have an account?{' '}
          <Link
            to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
            className="link"
          >
            Log in
          </Link>
        </p>
    </AuthShell>
  )
}
