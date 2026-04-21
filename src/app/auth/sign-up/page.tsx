import { AuthShell } from '@/components/auth-shell'
import { SignUpForm } from '@/components/sign-up-form'

export default function Page() {
  return (
    <AuthShell
      eyebrow="Create Account"
      title="Set up your recruiter account"
      description="Create a secure workspace for building interview flows, sending candidate links, and tracking results."
    >
      <div className="w-full max-w-md">
        <SignUpForm />
      </div>
    </AuthShell>
  )
}
