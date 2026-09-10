import { CheckCircle2, Sparkles, Target, Zap } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#080C14] flex">
      {/* Left panel — brand / value props */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-transparent to-violet-900/20 pointer-events-none" />
        <div className="absolute top-[20%] left-[10%] w-80 h-80 bg-brand-600/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[15%] right-[5%] w-60 h-60 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Grid bg */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_50%,transparent_100%)]" />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group mb-auto">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/30 group-hover:shadow-brand-500/50 transition-shadow">
              <span className="text-white font-black text-base leading-none">A</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Applyza
            </span>
          </Link>

          {/* Main copy */}
          <div className="flex-1 flex flex-col justify-center max-w-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-400 mb-6 w-fit">
              <Sparkles className="h-3 w-3" />
              AI Resume Optimizer
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-[1.1] mb-4">
              Beat the ATS.
              <br />
              <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">
                Land more interviews.
              </span>
            </h1>

            <p className="text-white/50 text-base leading-relaxed mb-8">
              Upload your resume, paste any job description, and get instant feedback on how to win.
            </p>

            <div className="space-y-3.5">
              {[
                { icon: <Target className="h-4 w-4 text-brand-400" />, text: 'ATS compatibility score vs. the exact JD' },
                { icon: <Zap className="h-4 w-4 text-amber-400" />, text: 'AI rewrites for weak bullet points' },
                { icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />, text: 'Keyword gap analysis — know what\'s missing' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center">
                    {icon}
                  </div>
                  <span className="text-sm text-white/60">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom tagline */}
          <p className="text-xs text-white/25 mt-auto">
            Free to start — no credit card required.
          </p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        {/* Subtle ambient glow behind form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 lg:hidden mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
              <span className="text-white font-black text-sm leading-none">A</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Applyza</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
