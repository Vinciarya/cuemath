import { Fraunces, DM_Sans } from 'next/font/google'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const fraunces = Fraunces({ subsets: ['latin'], display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap' })

import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const sections = [
    { delay: '0s', content: (
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <span className={`${fraunces.className} text-2xl font-bold text-[#2D5F3F]`}>CueMath</span>
        <Button variant="ghost" asChild className="text-[#2D5F3F] hover:bg-[#2D5F3F]/10 font-medium">
          <Link href="/login">Sign In</Link>
        </Button>
      </nav>
    )},
    { delay: '0.1s', content: (
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <h1 className={`${fraunces.className} text-5xl md:text-6xl leading-[1.1] mb-8 text-[#1A1A1A]`}>
          Find great tutors at the <br className="hidden md:block" /> speed of conversation.
        </h1>
        <p className={`${dmSans.className} text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto mb-10 leading-relaxed`}>
          AI voice screening that evaluates teaching style, warmth, and clarity — so you hire tutors your students will love.
        </p>
        <Button asChild size="lg" className="bg-[#2D5F3F] hover:bg-[#1a3d26] text-white px-10 h-14 text-lg rounded-full shadow-lg shadow-[#2D5F3F]/20 transition-all hover:scale-105 active:scale-95">
          <Link href="/login">Get Started →</Link>
        </Button>
      </section>
    )},
    { delay: '0.2s', content: (
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { t: "① Create", d: "Share a link with candidates. No scheduling required." },
            { t: "② AI Interviews", d: "5-minute voice conversation. Candidates answer naturally." },
            { t: "③ Review", d: "Scorecards across clarity, warmth, patience, and more." }
          ].map((c, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border-l-[6px] border-[#E8A838] hover:translate-y-[-4px] transition-all duration-300">
              <h3 className={`${fraunces.className} text-2xl mb-4 text-[#1A1A1A]`}>{c.t}</h3>
              <p className={`${dmSans.className} text-neutral-600 leading-relaxed italic`}>{c.d}</p>
            </div>
          ))}
        </div>
      </section>
    )},
    { delay: '0.3s', content: (
      <section className="max-w-7xl mx-auto px-6 py-12 flex flex-wrap justify-center gap-4">
        {["Clarity", "Warmth", "Simplicity", "Patience", "Fluency"].map((d) => (
          <span key={d} className={`${dmSans.className} bg-[#EEF7F2] text-[#2D5F3F] px-6 py-2.5 rounded-full font-semibold text-sm tracking-wide shadow-sm border border-[#2D5F3F]/10`}>
            {d}
          </span>
        ))}
      </section>
    )}
  ]

  return (
    <div className="min-h-screen bg-[#FAFAF7] relative overflow-hidden text-[#1A1A1A] selection:bg-[#E8A838]/20">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        .animate-fade-up { animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
        .noise { position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.03; 
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
      `}</style>
      <div className="noise" />
      <div className="relative z-10 flex flex-col min-h-screen">
        {sections.map((s, i) => (
          <div key={i} className="animate-fade-up" style={{ animationDelay: s.delay }}>{s.content}</div>
        ))}
        <footer className={`${dmSans.className} mt-auto max-w-7xl mx-auto w-full px-6 py-12 text-center text-sm text-neutral-500 border-t border-neutral-200/60 animate-fade-up`} style={{ animationDelay: '0.4s' }}>
          Built for Cuemath AI Builder Challenge · <a href="https://github.com/Vinciarya" className="hover:text-[#2D5F3F] transition-colors font-medium">github.com/Vinciarya</a>
        </footer>
      </div>
    </div>
  )
}
