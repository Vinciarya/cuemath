'use client'

import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Using window.location.href for a full reload ensures that the client-side 
    // cache is cleared and the back button won't show protected content.
    window.location.href = '/auth/login'
  }

  return (
    <Button onClick={logout} variant="outline" className="bg-white">
      Sign out
    </Button>
  )
}
