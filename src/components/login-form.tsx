'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden border-white/70 bg-white/90 shadow-2xl shadow-slate-300/40">
        <CardHeader className="space-y-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center justify-between">
            <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-sky-700">
              Cuemath Recruiter
            </div>
            <div className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
              Secure Access
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl tracking-tight text-slate-950">
              Welcome back
            </CardTitle>
            <CardDescription className="max-w-sm text-sm leading-6 text-slate-600">
              Sign in to review tutor interviews, manage candidate flows, and keep scoring aligned
              across the team.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="grid gap-5">
              <div className="grid gap-2.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Work email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="recruiter@cuemath.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="grid gap-2.5">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm font-medium text-sky-700 underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white"
                />
              </div>
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              ) : null}
              <Button type="submit" className="h-12 w-full text-sm font-semibold" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/sign-up"
                className="font-semibold text-slate-950 underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
