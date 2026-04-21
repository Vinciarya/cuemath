import { AuthShell } from '@/components/auth-shell'
import { UpdatePasswordForm } from '@/components/update-password-form'

export default function Page() {
  return (
    <AuthShell
      eyebrow="New Password"
      title="Choose a fresh password"
      description="Update your credentials and continue back into the recruiter dashboard without losing your current recovery session."
    >
      <div className="w-full max-w-md">
        <UpdatePasswordForm />
      </div>
    </AuthShell>
  )
}
