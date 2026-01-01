import { ArrowRight, Check, Database, Zap, Shield, Code, Cpu, Server, Layers, Terminal, Sparkles, Lock, GitBranch, Search, ChevronDown } from 'lucide-react';
import { useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue, animate } from 'framer-motion';
import { Link } from 'react-router-dom';

// Import logos
import amazonLogo from '../public/amazon.png';
import coinbaseLogo from '../public/coinbase.png';
import googleLogo from '../public/google.png';
import microsoftLogo from '../public/microsoft.png';
import nikeLogo from '../public/nike.png';

// --- Components ---

const GlassBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#0f172a]">
      {/* Deep background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-slate-900/20" />

      {/* Floating Orbs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/30 blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [1, 1.5, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/20 blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, 50, 0],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-cyan-500/20 blur-[100px]"
      />

      {/* Noise overlay for texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-lg border-b border-white/10 shadow-lg shadow-black/5">
    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/80 to-purple-600/80 backdrop-blur-md rounded-xl flex items-center justify-center shadow-inner border border-white/20">
          <Database className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight drop-shadow-sm">ChatSQL</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {['Features', 'How it works', 'Pricing'].map((item) => (
          <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-medium text-white/70 hover:text-white transition-all hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
            {item}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Link to="/auth/signin" className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden sm:block">Sign In</Link>
        <Link to="/dashboard" className="group relative px-6 py-2.5 rounded-lg overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors" />
          <span className="relative text-sm font-semibold text-white">Get Started</span>
        </Link>
      </div>
    </div>
  </nav>
);

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl shadow-black/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <GlassCard className="p-8 group">
    <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
      <Icon className="w-7 h-7 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">{title}</h3>
    <p className="text-slate-300 leading-relaxed font-light">{description}</p>
  </GlassCard>
);

const StepCard = ({ number, title, description }: { number: string, title: string, description: string }) => (
  <div className="relative pl-8 md:pl-0">
    <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent" />
    <div className="hidden md:flex absolute top-8 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#0f172a] border border-indigo-500/50 items-center justify-center z-10 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
    </div>

    <GlassCard className="p-8 md:ml-12 md:mr-auto md:w-[calc(50%-3rem)] hover:-translate-y-1">
      <div className="text-4xl font-bold text-white/10 mb-4 font-mono">{number}</div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-300 font-light">{description}</p>
    </GlassCard>
  </div>
);

export default function ChatSQLLanding() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30">
      <GlassBackground />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(0,0,0,0.2)]"
          >
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <span className="text-sm font-medium text-indigo-200">AI-Powered Database Visualization</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-tight"
          >
            See your data <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 drop-shadow-[0_0_30px_rgba(165,180,252,0.3)]">
              through a new lens
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Transform opaque databases into crystal-clear insights. Chat with your data, visualize schemas, and uncover hidden patterns in a unified, glass-like interface.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-900 font-bold hover:bg-indigo-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:-translate-y-0.5">
              Start Visualizing Free
            </Link>
            <Link to="/demo" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-white font-semibold hover:bg-white/10 transition-all hover:-translate-y-0.5">
              View Live Demo
            </Link>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotateX: 20 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="mt-20 relative mx-auto max-w-5xl perspective-1000"
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.3)]">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />

              {/* Mock UI Header */}
              <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-white/5">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="ml-4 px-3 py-1 rounded-md bg-black/20 text-xs text-slate-400 font-mono flex-1 text-center">
                  ChatSQL Dashboard - v2.0
                </div>
              </div>

              {/* Mock UI Content */}
              <div className="p-8 grid grid-cols-12 gap-6 h-[500px]">
                {/* Sidebar */}
                <div className="col-span-3 space-y-4 hidden md:block">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>

                {/* Main Content */}
                <div className="col-span-12 md:col-span-9 space-y-6">
                  <div className="flex gap-4">
                    <div className="h-32 flex-1 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-white/10 p-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/30 mb-2" />
                      <div className="h-4 w-24 bg-white/10 rounded mb-2" />
                      <div className="h-8 w-16 bg-white/20 rounded" />
                    </div>
                    <div className="h-32 flex-1 rounded-xl bg-white/5 border border-white/10 p-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/30 mb-2" />
                      <div className="h-4 w-24 bg-white/10 rounded mb-2" />
                      <div className="h-8 w-16 bg-white/20 rounded" />
                    </div>
                    <div className="h-32 flex-1 rounded-xl bg-white/5 border border-white/10 p-4">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/30 mb-2" />
                      <div className="h-4 w-24 bg-white/10 rounded mb-2" />
                      <div className="h-8 w-16 bg-white/20 rounded" />
                    </div>
                  </div>
                  <div className="h-64 rounded-xl bg-black/20 border border-white/5 p-4 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-slate-500 font-mono text-sm">Generating Visualization...</div>
                    </div>
                    {/* Abstract Chart Lines */}
                    <svg className="absolute bottom-0 left-0 right-0 h-32 w-full opacity-30" preserveAspectRatio="none">
                      <path d="M0,100 C150,50 300,150 450,80 C600,10 750,100 900,50 L900,150 L0,150 Z" fill="url(#grad1)" />
                      <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 border-y border-white/5 bg-black/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-medium text-slate-500 mb-8 uppercase tracking-widest">Trusted by data teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {[amazonLogo, googleLogo, microsoftLogo, nikeLogo, coinbaseLogo].map((logo, i) => (
              <img key={i} src={logo} alt="Partner logo" className="h-8 object-contain brightness-200 contrast-0 hover:brightness-100 hover:contrast-100 transition-all" />
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Crystal Clear Capabilities</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
              Powerful features wrapped in an elegant, translucent interface designed for clarity and speed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Search}
              title="Natural Language Queries"
              description="Ask questions in plain English. Our AI translates your intent into optimized SQL instantly, like seeing through the code."
            />
            <FeatureCard
              icon={Layers}
              title="Schema Visualization"
              description="View your database structure as floating, interactive layers. Understand relationships at a glance."
            />
            <FeatureCard
              icon={Zap}
              title="Real-time Analytics"
              description="Watch data flow in real-time. Dashboards that update instantly with a glass-like smoothness."
            />
            <FeatureCard
              icon={Shield}
              title="Enterprise Security"
              description="Bank-grade encryption and role-based access control, visible yet impenetrable."
            />
            <FeatureCard
              icon={GitBranch}
              title="Version Control"
              description="Track schema changes with visual diffs. See the history of your data evolution clearly."
            />
            <FeatureCard
              icon={Cpu}
              title="AI Optimization"
              description="Smart suggestions to optimize queries and indexing, polishing your database performance."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-900/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">From Fog to Focus</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
              Three simple steps to clarify your data workflow.
            </p>
          </div>

          <div className="space-y-12 md:space-y-24 relative">
            <StepCard
              number="01"
              title="Connect Your Source"
              description="Securely link your PostgreSQL, MySQL, or SQL Server database. We establish a read-only connection to map your schema instantly."
            />
            <div className="md:flex flex-row-reverse">
              <StepCard
                number="02"
                title="Ask & Explore"
                description="Type questions like 'Show me monthly revenue by region'. Watch as the AI constructs the query and visualizes the result."
              />
            </div>
            <StepCard
              number="03"
              title="Share Insights"
              description="Pin your findings to a dashboard. Share live, interactive glass panels with your team, not static screenshots."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="max-w-5xl mx-auto px-6">
          <GlassCard className="p-12 md:p-20 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 relative z-10">
              Ready to see clearly?
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-light relative z-10">
              Join thousands of developers and data analysts who have switched to the clearest way to manage data.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-900 font-bold hover:bg-indigo-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:-translate-y-0.5">
                Get Started for Free
              </Link>
              <Link to="/contact" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md text-white font-semibold hover:bg-white/20 transition-all hover:-translate-y-0.5">
                Contact Sales
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">ChatSQL</span>
          </div>

          <div className="text-slate-500 text-sm">
            © 2024 ChatSQL Inc. All rights reserved.
          </div>

          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Twitter</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">GitHub</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
