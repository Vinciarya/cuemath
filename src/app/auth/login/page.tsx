import { AuthShell } from '@/components/auth-shell'
import { LoginForm } from '@/components/login-form'

export default function Page() {
  return (
    <AuthShell
      eyebrow="Recruiter Access"
      title="Sign in to CueMath"
      description="Use your Cuemath recruiter account to manage interview templates, review candidate sessions, and keep hiring calibrated."
    >
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </AuthShell>
  )
}
