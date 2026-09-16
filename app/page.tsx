'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion, Variants, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  BarChart3,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Zap,
  Target,
  TrendingUp,
  ChevronRight,
  Star,
  Upload,
  ScanSearch,
  PenLine,
  Download,
  RefreshCw,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// ─── Animation Variants ──────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Animated Score Ring ─────────────────────────────────────────────────────
function ScoreRing({ score, color }: { score: number; color: string }) {
  const [displayed, setDisplayed] = useState(0);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (displayed / 100) * circumference;

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 1200;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setDisplayed(Math.round(progress * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    const timeout = setTimeout(() => {
      frame = requestAnimationFrame(animate);
    }, 800);
    return () => { clearTimeout(timeout); cancelAnimationFrame(frame); };
  }, [score]);

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="48" cy="48" r="40" fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>
      <span className="text-2xl font-bold text-white">{displayed}</span>
    </div>
  );
}

// ─── Typing animation ─────────────────────────────────────────────────────────
const ROLES = ['Software Engineer', 'Product Manager', 'Data Scientist', 'Marketing Lead', 'UX Designer'];

function TypingRole() {
  const [roleIdx, setRoleIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const role = ROLES[roleIdx];
    if (!deleting && displayed.length < role.length) {
      const t = setTimeout(() => setDisplayed(role.slice(0, displayed.length + 1)), 60);
      return () => clearTimeout(t);
    }
    if (!deleting && displayed.length === role.length) {
      const t = setTimeout(() => setDeleting(true), 2000);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false);
      setRoleIdx((i) => (i + 1) % ROLES.length);
    }
  }, [displayed, deleting, roleIdx]);

  return (
    <span className="text-brand-400">
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Failed to get auth session:', err);
      } finally {
        setLoadingUser(false);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoadingUser(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const initial = (displayName.charAt(0) || 'U').toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-[#080C14] text-white font-sans overflow-x-hidden selection:bg-brand-500/50">
      
      {/* ── AMBIENT BACKGROUND EFFECTS ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-brand-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] -left-[10%] w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 w-full transition-all duration-300">
        <div className="absolute inset-0 bg-[#080C14]/70 backdrop-blur-xl border-b border-white/5" />
        <div className="container relative flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/30 group-hover:shadow-brand-500/50 transition-shadow">
              <span className="text-white font-black text-base leading-none">A</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Applyza
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {[['Features', '#features'], ['How It Works', '#how-it-works'], ['Pricing', '#pricing']].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-medium text-white/50 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {loadingUser ? (
              <div className="h-9 w-28 rounded-lg bg-white/5 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Button asChild className="bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-lg shadow-brand-600/25 hover:shadow-brand-500/40 transition-all duration-200 rounded-lg text-sm h-9 px-3.5 sm:px-4">
                  <Link href="/dashboard" className="flex items-center gap-1.5">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 outline-none focus:ring-2 focus:ring-brand-500/50"
                      aria-label="User menu"
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="h-7 w-7 rounded-full object-cover border border-white/15"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-xs shadow-sm">
                          {initial}
                        </div>
                      )}
                      <span className="text-xs font-medium text-white/80 max-w-[90px] truncate hidden sm:inline">
                        {displayName}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-white/40" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-[#0c121e]/95 border border-white/10 text-white shadow-2xl p-1.5 rounded-xl backdrop-blur-xl"
                  >
                    <div className="px-2.5 py-2">
                      <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                      <p className="text-[11px] text-white/45 truncate mt-0.5">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-white/10 my-1" />
                    <DropdownMenuItem asChild className="hover:bg-white/10 focus:bg-white/10 rounded-lg cursor-pointer text-white/85 focus:text-white transition-colors">
                      <Link href="/dashboard" className="flex items-center gap-2.5 px-2.5 py-2 text-xs">
                        <LayoutDashboard className="h-4 w-4 text-brand-400" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-white/10 focus:bg-white/10 rounded-lg cursor-pointer text-white/85 focus:text-white transition-colors">
                      <Link href="/resumes" className="flex items-center gap-2.5 px-2.5 py-2 text-xs">
                        <FileText className="h-4 w-4 text-cyan-400" />
                        <span>My Resumes</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-white/10 focus:bg-white/10 rounded-lg cursor-pointer text-white/85 focus:text-white transition-colors">
                      <Link href="/settings" className="flex items-center gap-2.5 px-2.5 py-2 text-xs">
                        <Settings className="h-4 w-4 text-white/50" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10 my-1" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="hover:bg-red-500/15 focus:bg-red-500/20 text-red-400 focus:text-red-300 rounded-lg cursor-pointer flex items-center gap-2.5 px-2.5 py-2 text-xs transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:flex text-white/60 hover:text-white hover:bg-white/5 font-medium">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-lg shadow-brand-600/25 hover:shadow-brand-500/40 transition-all duration-200 rounded-lg">
                  <Link href="/signup" className="flex items-center gap-1.5">
                    Get Started Free <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">

        {/* ── HERO ── */}
        <section ref={heroRef} className="relative pt-28 pb-20 md:pt-36 md:pb-32 overflow-hidden">
          {/* Subtle grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)]" />

          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="container relative z-10 px-4"
          >
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-16 items-center">

              {/* Left — Copy */}
              <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-2xl">
                
                <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-400 mb-7 backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Resume Optimizer — Beat any ATS
                </motion.div>

                <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-[4.5rem] font-extrabold tracking-tighter leading-[1.05] mb-6">
                  <span className="text-white">Get your resume</span>
                  <br />
                  <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-cyan-400 bg-clip-text text-transparent">
                    in front of humans.
                  </span>
                </motion.h1>

                <motion.p variants={fadeUp} className="text-lg sm:text-xl text-white/55 mb-4 leading-relaxed max-w-lg">
                  Upload your resume. Paste the job description.
                  <br />
                  Applyza scores your ATS compatibility, spots missing keywords, and rewrites weak bullet points — in seconds.
                </motion.p>

                <motion.p variants={fadeUp} className="text-base text-white/40 mb-10 max-w-lg">
                  Built for <TypingRole /> roles.
                </motion.p>

                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {user ? (
                    <>
                      <Button size="lg" asChild className="h-13 px-8 bg-brand-600 hover:bg-brand-500 text-white font-bold text-base shadow-xl shadow-brand-600/30 hover:shadow-brand-500/40 transition-all duration-300 rounded-xl w-full sm:w-auto">
                        <Link href="/dashboard" className="flex items-center gap-2">
                          Go to Dashboard
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="lg" asChild className="h-13 px-6 text-white/60 hover:text-white hover:bg-white/5 font-medium rounded-xl w-full sm:w-auto border border-white/10">
                        <Link href="/resumes">View My Resumes</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="lg" asChild className="h-13 px-8 bg-brand-600 hover:bg-brand-500 text-white font-bold text-base shadow-xl shadow-brand-600/30 hover:shadow-brand-500/40 transition-all duration-300 rounded-xl w-full sm:w-auto">
                        <Link href="/signup" className="flex items-center gap-2">
                          Optimize My Resume Free
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="lg" asChild className="h-13 px-6 text-white/60 hover:text-white hover:bg-white/5 font-medium rounded-xl w-full sm:w-auto border border-white/10">
                        <Link href="/login">Already have an account?</Link>
                      </Button>
                    </>
                  )}
                </motion.div>

                {/* Trust badge — only real, verifiable claims */}
                <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-5 text-sm text-white/40">
                  {[
                    'No credit card required',
                    'Free to start',
                    'Secure & private',
                  ].map((t) => (
                    <span key={t} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-brand-400" />
                      {t}
                    </span>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right — UI Mockup */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-md mx-auto lg:max-w-none"
              >
                {/* Glow behind the card */}
                <div className="absolute inset-0 bg-brand-600/20 rounded-3xl blur-3xl scale-90 translate-y-8" />

                <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-[#111827] to-[#0d1117] shadow-2xl overflow-hidden backdrop-blur-sm">
                  {/* Card top bar */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-white/30 font-mono">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      applyza.com/analyze
                    </div>
                    <div className="w-14" />
                  </div>

                  {/* Card body */}
                  <div className="p-5 space-y-4">
                    {/* File + score row */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-500/15 border border-brand-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-brand-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">SoftwareEngineer_Resume.pdf</p>
                        <p className="text-xs text-white/40">Target: Senior Software Engineer @ Google</p>
                      </div>
                      <ScoreRing score={87} color="#3b82f6" />
                    </div>

                    {/* Analysis items */}
                    <div className="space-y-2.5">
                      {/* Keyword matched */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.0, duration: 0.4 }}
                        className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-emerald-300">&quot;System Design&quot; — matched</p>
                          <p className="text-xs text-emerald-400/60 mt-0.5">Found in Experience section. High weight keyword.</p>
                        </div>
                      </motion.div>

                      {/* Missing keyword */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.25, duration: 0.4 }}
                        className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20"
                      >
                        <Target className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-amber-300">&quot;Kubernetes&quot; — missing</p>
                          <p className="text-xs text-amber-400/60 mt-0.5">Appears 3× in the JD. Add to Skills or Projects.</p>
                        </div>
                      </motion.div>

                      {/* AI rewrite suggestion */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5, duration: 0.4 }}
                        className="flex items-start gap-3 p-3.5 rounded-xl bg-brand-500/8 border border-brand-500/20 group"
                      >
                        <Zap className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-brand-300">Rewrite suggestion</p>
                          <p className="text-xs text-white/40 mt-0.5 line-through">&quot;Helped improve deployment speed&quot;</p>
                          <p className="text-xs text-brand-300/80 mt-1">&quot;Reduced deployment time by 40% by migrating to Kubernetes&quot;</p>
                        </div>
                        <button className="flex-shrink-0 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          Apply
                        </button>
                      </motion.div>
                    </div>

                    {/* Bottom bar */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-white/30">3 of 8 suggestions applied</span>
                      <div className="flex gap-1.5">
                        {Array.from({ length: 8 }, (_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < 3 ? 'bg-brand-400' : 'bg-white/15'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                  className="absolute -right-4 -bottom-5 lg:-right-8 bg-gradient-to-br from-[#1a2235] to-[#111827] rounded-xl p-3.5 shadow-2xl border border-white/10 flex items-center gap-3"
                >
                  <div className="bg-green-500/15 border border-green-500/20 p-2 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 font-medium">ATS Score</p>
                    <p className="text-sm font-bold text-white">87 → 94 <span className="text-green-400">↑</span></p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ── WHAT IS APPLYZA ── */}
        <section className="py-16 border-y border-white/5 bg-white/[0.02]">
          <div className="container px-4">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-white/30 mb-10"
            >
              How the modern job application works
            </motion.p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { icon: <FileText className="w-5 h-5" />, pct: '75%', label: 'of resumes are rejected by ATS before a human ever reads them', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                { icon: <ScanSearch className="w-5 h-5" />, pct: '6 sec', label: 'is how long a recruiter actually spends on each resume', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                { icon: <Star className="w-5 h-5" />, pct: '2×', label: 'more interviews for candidates who tailor resume to each JD', color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20' },
              ].map(({ icon, pct, label, color, bg }) => (
                <motion.div
                  key={pct}
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}
                  className={`flex flex-col gap-3 rounded-2xl border p-6 ${bg} backdrop-blur-sm`}
                >
                  <span className={`${color}`}>{icon}</span>
                  <p className={`text-4xl font-black ${color}`}>{pct}</p>
                  <p className="text-sm text-white/50 leading-relaxed">{label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-28 px-4">
          <div className="container">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-xl mx-auto mb-16">
              <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400 mb-3">The Process</motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                From upload to interview-ready in minutes
              </motion.h2>
              <motion.p variants={fadeUp} className="text-white/50 text-lg">
                No complicated setup. No learning curve. Just results.
              </motion.p>
            </motion.div>

            <div className="relative max-w-4xl mx-auto">
              {/* Connecting line on desktop */}
              <div className="hidden md:block absolute top-[3.25rem] left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { step: '01', icon: <Upload className="w-6 h-6" />, title: 'Upload Resume', desc: 'Drop your PDF or DOCX. We parse it instantly — no formatting lost.', color: 'from-brand-500 to-brand-700' },
                  { step: '02', icon: <PenLine className="w-6 h-6" />, title: 'Paste the Job Description', desc: 'Copy the exact JD from LinkedIn, Indeed, or company sites.', color: 'from-violet-500 to-violet-700' },
                  { step: '03', icon: <ScanSearch className="w-6 h-6" />, title: 'AI Analysis', desc: "We score ATS compatibility, extract keywords, and pinpoint every gap.", color: 'from-cyan-500 to-cyan-700' },
                  { step: '04', icon: <RefreshCw className="w-6 h-6" />, title: 'Apply & Repeat', desc: 'Accept rewrites, download your new resume, and iterate for every role.', color: 'from-emerald-500 to-emerald-700' },
                ].map((item, idx) => (
                  <motion.div
                    key={item.step}
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: idx * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className={`relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} shadow-lg flex items-center justify-center text-white mb-5`}>
                      {item.icon}
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#080C14] border border-white/10 text-[10px] font-bold text-white/60 flex items-center justify-center">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-white/45 leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-28 px-4 bg-white/[0.02] border-y border-white/5">
          <div className="container">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-xl mx-auto mb-16">
              <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400 mb-3">Features</motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                Everything you need to get past the gatekeeper
              </motion.h2>
              <motion.p variants={fadeUp} className="text-white/50 text-lg">
                Applyza does in 30 seconds what would take a career coach hours.
              </motion.p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {[
                {
                  icon: <BarChart3 className="w-6 h-6" />,
                  title: 'ATS Compatibility Score',
                  desc: "A 0–100 score calculated against your target JD — not a generic benchmark. Know exactly how an ATS will rank you before you apply.",
                  color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/15',
                  tag: 'Core',
                },
                {
                  icon: <Target className="w-6 h-6" />,
                  title: 'Keyword Gap Analysis',
                  desc: 'Side-by-side comparison of required, preferred, and missing keywords. We show frequency in the JD so you prioritize what matters most.',
                  color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/15',
                  tag: 'Core',
                },
                {
                  icon: <Zap className="w-6 h-6" />,
                  title: 'AI Bullet Rewrites',
                  desc: "Weak impact statements are rewritten with stronger action verbs and quantified achievements. One click to accept — your words, just sharper.",
                  color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/15',
                  tag: 'Core',
                },
                {
                  icon: <FileText className="w-6 h-6" />,
                  title: 'Smart Resume Parsing',
                  desc: 'Upload PDF or DOCX. Our parser extracts your full resume with correct section structure, preserving your work — no re-typing required.',
                  color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/15',
                  tag: 'Core',
                },
                {
                  icon: <Lightbulb className="w-6 h-6" />,
                  title: 'Section-Level Feedback',
                  desc: "Get targeted feedback per section — Summary, Experience, Skills, Education. Know which part is dragging your score down the most.",
                  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/15',
                  tag: 'Core',
                },
                {
                  icon: <Sparkles className="w-6 h-6" />,
                  title: 'LaTeX Export',
                  desc: 'Coming soon — export your optimized resume as a beautiful, ATS-safe LaTeX PDF. Clean formatting that makes both machines and humans happy.',
                  color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/15',
                  tag: 'Soon',
                },
              ].map((feat, idx) => (
                <motion.div
                  key={feat.title}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: idx * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`relative rounded-2xl border p-6 ${feat.bg} backdrop-blur-sm group cursor-default`}
                >
                  {feat.tag === 'Soon' && (
                    <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider text-pink-400 bg-pink-500/15 border border-pink-500/20 rounded-full px-2 py-0.5">
                      Coming Soon
                    </span>
                  )}
                  <div className={`w-11 h-11 rounded-xl ${feat.bg} border flex items-center justify-center mb-5 ${feat.color}`}>
                    {feat.icon}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHO IT'S FOR ── */}
        <section className="py-28 px-4">
          <div className="container">
            <div className="max-w-5xl mx-auto">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
                <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400 mb-3">Who it&apos;s for</motion.p>
                <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Built for every job seeker
                </motion.h2>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-5">
                {[
                  { emoji: '🎓', who: 'Fresh Graduates', problem: "You've never applied before and have no idea why you're not hearing back.", solution: 'Applyza shows you exactly what recruiters and ATS want to see, so your first applications actually land interviews.' },
                  { emoji: '🔁', who: 'Career Switchers', problem: "You have transferable skills but your resume doesn't translate them to the new industry.", solution: 'We map your existing experience to the target role\'s language — without making you start from scratch.' },
                  { emoji: '📈', who: 'Experienced Professionals', problem: "You're overqualified on paper but still not getting callbacks.", solution: 'ATS scores give you a factual reason. Fix the gaps, tailor per role, and let your experience finally speak for itself.' },
                  { emoji: '⚡', who: 'Active Job Seekers', problem: "Applying to dozens of jobs but tailoring your resume each time takes hours.", solution: 'Paste a new JD, get instant diff — accept suggested rewrites in one click. Tailor in minutes, not hours.' },
                ].map(({ emoji, who, problem, solution }, idx) => (
                  <motion.div
                    key={who}
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: idx * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
                    className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{emoji}</span>
                      <div>
                        <h3 className="text-base font-bold text-white mb-1">{who}</h3>
                        <p className="text-sm text-white/40 mb-3 italic">&ldquo;{problem}&rdquo;</p>
                        <p className="text-sm text-white/65 leading-relaxed">{solution}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section id="pricing" className="py-28 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-900/20 via-brand-800/10 to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-brand-600/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="container relative z-10">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
              className="max-w-2xl mx-auto text-center"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-400 mb-8 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Free to get started — no card needed
              </motion.div>

              <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
                Stop sending your resume into the void
              </motion.h2>

              <motion.p variants={fadeUp} className="text-lg text-white/50 mb-10 leading-relaxed">
                The job market is brutal. Your resume shouldn&apos;t be the reason you&apos;re not getting calls. Let Applyza fix what&apos;s actually holding you back.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                {user ? (
                  <>
                    <Button size="lg" asChild className="h-14 px-10 bg-brand-600 hover:bg-brand-500 text-white font-bold text-base shadow-2xl shadow-brand-600/30 hover:shadow-brand-500/40 transition-all duration-300 rounded-xl">
                      <Link href="/dashboard" className="flex items-center gap-2">
                        Open Dashboard
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="lg" asChild className="h-14 px-8 text-white/60 hover:text-white hover:bg-white/5 font-medium rounded-xl border border-white/10">
                      <Link href="/resumes">My Resumes</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="lg" asChild className="h-14 px-10 bg-brand-600 hover:bg-brand-500 text-white font-bold text-base shadow-2xl shadow-brand-600/30 hover:shadow-brand-500/40 transition-all duration-300 rounded-xl">
                      <Link href="/signup" className="flex items-center gap-2">
                        Get Started Free
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="lg" asChild className="h-14 px-8 text-white/60 hover:text-white hover:bg-white/5 font-medium rounded-xl border border-white/10">
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </>
                )}
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-6 text-sm text-white/35">
                {['Free plan available', 'No credit card required', 'Cancel any time'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-400/70" /> {t}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 bg-[#080C14] py-12">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
                  <span className="text-white font-black text-sm leading-none">A</span>
                </div>
                <span className="font-bold text-white">Applyza</span>
              </Link>
              <p className="text-sm text-white/35 leading-relaxed max-w-xs">
                AI-powered resume optimizer that helps you beat ATS and land more interviews.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-white/40">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Account</h4>
              <ul className="space-y-3 text-sm text-white/40">
                {user ? (
                  <>
                    <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                    <li><Link href="/resumes" className="hover:text-white transition-colors">My Resumes</Link></li>
                    <li><button onClick={handleSignOut} className="hover:text-red-400 transition-colors text-left">Sign Out</button></li>
                  </>
                ) : (
                  <>
                    <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up Free</Link></li>
                    <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-white/40">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/25">
              © {new Date().getFullYear()} Applyza. All rights reserved.
            </p>
            <p className="text-xs text-white/20">
              Made for job seekers, by people who&apos;ve been there.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
