'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion, Variants } from 'framer-motion';
import {
  Sparkles,
  FileText,
  BarChart3,
  Lightbulb,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  Zap,
  Shield,
  Briefcase,
  TrendingUp,
  Award,
  Play
} from 'lucide-react';

// Animation Variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-brand-950 font-sans selection:bg-brand-500 selection:text-white overflow-x-hidden">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full transition-all duration-300 bg-white/80 dark:bg-brand-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-brand-900/50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 group-hover:bg-brand-500 transition-colors shadow-sm">
              <span className="text-white font-bold text-lg leading-none">A</span>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Applyza</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 transition-colors">How It Works</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:flex text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-brand-900/50 font-medium">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-sm hover:shadow transition-all">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)]" />

          <div className="container relative z-10 px-4">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              
              {/* Hero Content */}
              <motion.div 
                initial="hidden" 
                animate="visible" 
                variants={staggerContainer}
                className="max-w-2xl"
              >
                <motion.div variants={fadeUp} className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300 mb-6 shadow-sm">
                  <Zap className="h-4 w-4 mr-2 text-brand-600 dark:text-brand-400" />
                  AI-Powered Resume Optimization
                </motion.div>
                
                <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]">
                  Optimize your resume. <br/>
                  <span className="text-brand-600 dark:text-brand-400">Land your dream job.</span>
                </motion.h1>
                
                <motion.p variants={fadeUp} className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-xl leading-relaxed">
                  Upload your resume and the job description you're applying for. Our GPT-4 powered AI provides instant ATS scoring, keyword matching, and actionable revisions.
                </motion.p>
                
                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Button size="lg" asChild className="h-12 px-8 bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-md hover:shadow-lg transition-all w-full sm:w-auto">
                    <Link href="/signup">
                      Start Optimizing Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="h-12 px-8 border-slate-300 dark:border-brand-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-brand-900/50 transition-all w-full sm:w-auto">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </motion.div>

                <motion.div variants={fadeUp} className="mt-10 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-50 dark:border-brand-950 bg-slate-200 dark:bg-slate-700" />
                    ))}
                  </div>
                  <p>Join <strong className="text-slate-900 dark:text-white">10,000+</strong> professionals hired</p>
                </motion.div>
              </motion.div>

              {/* Hero Visualizer Mockup */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative mx-auto w-full max-w-lg lg:max-w-none pt-8 lg:pt-0"
              >
                <div className="relative rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-2xl hover:shadow-3xl transition-shadow overflow-hidden">
                  {/* Mockup Header */}
                  <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-slate-300/80 dark:bg-slate-700" />
                      <div className="w-3 h-3 rounded-full bg-slate-300/80 dark:bg-slate-700" />
                      <div className="w-3 h-3 rounded-full bg-slate-300/80 dark:bg-slate-700" />
                    </div>
                    <div className="mx-auto text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center">
                      <Shield className="w-3 h-3 mr-1"/> secure / Applyza Score
                    </div>
                  </div>
                  
                  {/* Mockup Body */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Product_Manager_Resume.pdf</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Target Role: Senior Product Manager</p>
                      </div>
                      <div className="flex relative items-center justify-center w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-900/30 ring-4 ring-brand-100 dark:ring-brand-800/50">
                        <span className="text-xl font-bold text-brand-600 dark:text-brand-400">92</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start justify-between p-4 rounded-xl bg-green-50/50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 text-sm">
                        <div>
                          <p className="font-semibold text-green-800 dark:text-green-400 flex items-center mb-1">
                            <CheckCircle2 className="w-4 h-4 mr-2"/> "Agile Methodology" found
                          </p>
                          <p className="text-green-600 dark:text-green-500 text-xs ml-6">High impact keyword successfully matched in Experience.</p>
                        </div>
                      </div>
                      <div className="flex items-start justify-between p-4 rounded-xl bg-brand-50/50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/50 text-sm group">
                        <div>
                          <p className="font-semibold text-brand-800 dark:text-brand-400 flex items-center mb-1">
                            <Zap className="w-4 h-4 mr-2"/> Action verb suggestion
                          </p>
                          <p className="text-brand-600 dark:text-brand-500 text-xs ml-6">Consider replacing "Helped with" to "Spearheaded".</p>
                        </div>
                        <Button size="sm" className="h-7 text-xs bg-brand-600 hover:bg-brand-700 opacity-0 group-hover:opacity-100 transition-opacity">Apply</Button>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm bg-white dark:bg-slate-900">
                        <span className="flex items-center font-medium"><Award className="w-4 h-4 mr-2 text-slate-400"/> Education section formatting is perfect.</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating badge */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }} 
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute -right-4 lg:-right-10 -bottom-6 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 flex items-center gap-3 backdrop-blur-sm"
                >
                  <div className="bg-brand-100 dark:bg-brand-900/50 p-2 rounded-full">
                    <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Top 5% of candidates</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Highly Competitive</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* LOGO CLOUD / SOCIAL PROOF */}
        <section className="py-10 border-y border-slate-200 dark:border-brand-900/50 bg-white/50 dark:bg-slate-900/20">
          <div className="container">
            <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wider">Trusted by job seekers hired at top companies</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale dark:opacity-40">
              {/* Placeholders for logos (Could be replaced with real SVGs) */}
              <div className="text-xl font-bold font-serif">Acmecorp</div>
              <div className="text-xl font-bold tracking-tighter">GLOBAL</div>
              <div className="text-xl font-bold flex items-center"><Briefcase className="w-5 h-5 mr-1"/> Nexus</div>
              <div className="text-xl font-black italic">SysTech</div>
              <div className="hidden sm:block text-xl font-medium tracking-widest">AERIS</div>
            </div>
          </div>
        </section>

        {/* FEATURES (BENTO GRID) */}
        <section id="features" className="py-24 bg-[#F8FAFC] dark:bg-brand-950 px-4">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                Everything you need to beat the ATS
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Stop guessing what recruiters want. Applyza breaks down exactly how applicant tracking systems read your resume.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              
              <motion.div 
                whileHover={{ y: -5 }}
                className="col-span-1 md:col-span-2 rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden relative group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <FileText className="w-32 h-32 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="relative z-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/40 mb-6">
                    <FileText className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Smart Resume Parsing</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
                    Upload your PDF or DOCX file. Our advanced AI perfectly extracts and structures your experience, skills, and education without losing context or formatting.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="col-span-1 rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30 mb-6">
                  <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">ATS Scoring</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Get a clear compatibility score tailored to your specific job description. See exactly which keywords you're missing.
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="col-span-1 rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 mb-6">
                  <Lightbulb className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">AI Suggestions</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Receive actionable text rewrites. Let GPT-4 suggest bullet point improvements that showcase massive impact.
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="col-span-1 md:col-span-2 rounded-3xl bg-slate-900 dark:bg-slate-800 p-8 shadow-sm ring-1 ring-slate-800 dark:ring-slate-700 relative overflow-hidden"
              >
                <img src="/placeholder-graph.svg" alt="" className="absolute right-0 bottom-0 opacity-10 object-cover" />
                <div className="relative z-10">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800 dark:bg-slate-700 text-xs font-semibold text-white mb-6 border border-slate-700">
                    <Sparkles className="w-3 h-3 mr-1 text-brand-400"/> Formatter Built-In
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Coming Soon: LaTeX Compiler</h3>
                  <p className="text-slate-400 leading-relaxed max-w-md">
                    We're building an isolated, secure LaTeX compiler so you can export breathtakingly beautiful, ATS-friendly PDFs with zero friction directly from your AI suggestions.
                  </p>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 bg-white dark:bg-brand-950 border-y border-slate-100 dark:border-brand-900/30">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                Three steps to an interview
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { step: '01', title: 'Upload Resume & JD', desc: 'Securely upload your current resume and copy-paste the exact job description you are targeting.' },
                { step: '02', title: 'AI Analysis', desc: 'Our engine parses the text, extracts context, and reveals the invisible keywords the ATS is looking for.' },
                { step: '03', title: 'Apply Fixes', desc: 'Directly accept AI rewrites to optimize your impact statements. Download and apply with confidence.' },
              ].map((item, idx) => (
                <div key={item.step} className="relative">
                  {/* Decorative line connecting steps on desktop */}
                  {idx !== 2 && (
                    <div className="hidden md:block absolute top-6 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-slate-200 dark:bg-slate-700" />
                  )}
                  
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 font-bold text-xl mb-6 relative z-10 shadow-sm border border-brand-100 dark:border-brand-800">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-[250px]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-24 bg-slate-900 dark:bg-slate-950 relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-600/20 rounded-full blur-[100px] opacity-50 pointer-events-none" />
          
          <div className="container relative z-10 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">
              Ready to optimize your resume?
            </h2>
            <p className="text-slate-300 dark:text-slate-400 mb-10 max-w-lg mx-auto text-lg">
              Join thousands of job seekers who have bypassed the ATS and landed interviews at top companies using Applyza.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button size="lg" asChild className="h-14 px-8 bg-brand-600 hover:bg-brand-500 text-white font-medium text-base w-full sm:w-auto shadow-lg shadow-brand-600/20">
                <Link href="/signup">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-slate-400 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-brand-400"/> No credit card required. Free forever plan available.
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-brand-950 py-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-600">
                  <span className="text-white font-bold text-xs leading-none">A</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">Applyza</span>
              </Link>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
                The most advanced AI-powered resume analyzer and optimizer. Built to help you get hired faster.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">Product</h4>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="#features" className="hover:text-brand-600 dark:hover:text-brand-400">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-brand-600 dark:hover:text-brand-400">How it Works</Link></li>
                <li><Link href="#" className="hover:text-brand-600 dark:hover:text-brand-400">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="#" className="hover:text-brand-600 dark:hover:text-brand-400">Blog</Link></li>
                <li><Link href="#" className="hover:text-brand-600 dark:hover:text-brand-400">Resume Templates</Link></li>
                <li><Link href="#" className="hover:text-brand-600 dark:hover:text-brand-400">Career Guides</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="#" className="hover:text-brand-600 dark:hover:text-brand-400">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-brand-600 dark:hover:text-brand-400">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-brand-600 dark:hover:text-brand-400">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} Applyza. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
