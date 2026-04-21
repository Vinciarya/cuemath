import { AuthShell } from '@/components/auth-shell'
import { ForgotPasswordForm } from '@/components/forgot-password-form'

export default function Page() {
  return (
    <AuthShell
      eyebrow="Password Reset"
      title="Reset your password"
      description="We’ll send a secure reset link to your inbox so you can get back into the recruiter workspace."
    >
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </AuthShell>
  )
}
