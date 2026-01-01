import {
  Database, Zap, Shield, Cpu, Layers, Search, GitBranch, Sparkles,
  ArrowRight, Play, BarChart3, MessageSquare, Eye, CheckCircle2,
  Globe, Command, Terminal, Activity
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';

// Import logos
import amazonLogo from '../public/amazon.png';
import coinbaseLogo from '../public/coinbase.png';
import googleLogo from '../public/google.png';
import microsoftLogo from '../public/microsoft.png';
import nikeLogo from '../public/nike.png';

// --- Advanced Design System ---

const Background = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#030712] overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full opacity-50 mix-blend-screen" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-fuchsia-500/10 blur-[120px] rounded-full opacity-30 mix-blend-screen" />
    </div>
  );
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 20);
    });
  }, [scrollY]);

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#030712]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'py-6 bg-transparent'}`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-lg shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
            <Database className="w-4 h-4 text-white" />
            <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">ChatSQL</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {['Product', 'Solutions', 'Pricing', 'Docs'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link to="/auth/signin" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">
            Log in
          </Link>
          <Link to="/dashboard" className="group relative px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all">
            Start Building
            <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

const BentoCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay }}
    className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] transition-colors duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

const PricingCard = ({ tier, price, features, recommended = false }: { tier: string, price: string, features: string[], recommended?: boolean }) => (
  <motion.div
    whileHover={{ y: -8 }}
    className={`relative p-8 rounded-3xl border ${recommended ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10 bg-white/[0.02]'} backdrop-blur-sm flex flex-col h-full`}
  >
    {recommended && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-xs font-bold text-white shadow-lg shadow-indigo-500/25">
        MOST POPULAR
      </div>
    )}

    <div className="mb-8">
      <h3 className="text-lg font-medium text-slate-300 mb-2">{tier}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold text-white">{price}</span>
        {price !== 'Custom' && <span className="text-slate-500">/month</span>}
      </div>
    </div>

    <div className="flex-1 space-y-4 mb-8">
      {features.map((feature, i) => (
        <div key={i} className="flex items-start gap-3 text-sm text-slate-400">
          <CheckCircle2 className={`w-5 h-5 shrink-0 ${recommended ? 'text-indigo-400' : 'text-slate-600'}`} />
          <span>{feature}</span>
        </div>
      ))}
    </div>

    <button className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${recommended
      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
      : 'bg-white/10 hover:bg-white/20 text-white'
      }`}>
      {price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
    </button>
  </motion.div>
);

export default function ChatSQLLanding() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-indigo-500/30">
      <Background />
      <Navbar />

      {/* === HERO SECTION === */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8 hover:bg-indigo-500/20 transition-colors cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            v2.0 is now live
            <ArrowRight className="w-3 h-3 ml-1" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-[1.1]"
          >
            Your database, <br />
            <span
              className="inline-block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent pb-1"
              style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              fluent in human.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Stop writing boilerplate SQL. Start asking questions.
            Visualize schemas, optimize queries, and build dashboards with natural language.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/40 transition-all hover:scale-105 active:scale-95">
              Start for free
            </Link>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 14-day trial
              </div>
            </div>
          </motion.div>

          {/* Hero Dashboard Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
            className="relative mx-auto max-w-6xl perspective-1000"
          >
            <div className="relative rounded-xl border border-white/10 bg-[#0f172a]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Window Controls */}
              <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                </div>
                <div className="flex-1 text-center text-xs font-mono text-slate-600">
                  postgres://production-db:5432
                </div>
              </div>

              {/* Interface */}
              <div className="flex h-[600px]">
                {/* Sidebar */}
                <div className="w-64 border-r border-white/5 bg-white/[0.01] p-4 hidden md:flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium px-2">
                    <Database className="w-4 h-4" /> Tables
                  </div>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-8 rounded bg-white/5 animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
                  ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 flex flex-col gap-6">
                  {/* Chat Input Area */}
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10">
                      <p className="text-slate-300 text-lg font-light">
                        Show me the monthly revenue growth for the last quarter, grouped by region.
                      </p>
                    </div>
                  </div>

                  {/* Generated SQL & Chart */}
                  <div className="ml-14 space-y-4">
                    <div className="bg-[#020617] rounded-lg border border-white/10 p-4 font-mono text-sm text-emerald-400 overflow-x-auto">
                      SELECT region, DATE_TRUNC('month', created_at) as month, SUM(amount)<br />
                      FROM transactions<br />
                      WHERE created_at &gt; NOW() - INTERVAL '3 months'<br />
                      GROUP BY 1, 2 ORDER BY 2 DESC;
                    </div>

                    <div className="h-64 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-lg border border-white/5 relative overflow-hidden flex items-end justify-around px-8 pb-0">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          transition={{ duration: 0.5, delay: 0.5 + (i * 0.1) }}
                          className="w-12 bg-indigo-500/40 rounded-t-sm hover:bg-indigo-500/60 transition-colors cursor-pointer relative group"
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            ${h}k
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* === SOCIAL PROOF === */}
      <section className="py-10 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-medium text-slate-500 mb-8">TRUSTED BY ENGINEERING TEAMS AT</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {[amazonLogo, googleLogo, microsoftLogo, nikeLogo, coinbaseLogo].map((logo, i) => (
              <img key={i} src={logo} alt="Partner logo" className="h-6 object-contain brightness-200 contrast-0 hover:brightness-100 hover:contrast-100 transition-all" />
            ))}
          </div>
        </div>
      </section>

      {/* === BENTO GRID FEATURES === */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Everything you need to <br />
              <span className="text-indigo-400">master your data.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Large Card */}
            <BentoCard className="md:col-span-2 p-8 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Natural Language Querying</h3>
                <p className="text-slate-400 max-w-md">
                  Forget complex JOINs. Just ask questions in plain English and get optimized SQL + visualizations instantly.
                </p>
              </div>
              <div className="relative h-32 bg-[#020617] rounded-lg border border-white/10 p-4 font-mono text-xs text-slate-400 overflow-hidden group-hover:border-indigo-500/30 transition-colors">
                <span className="text-indigo-400">user:</span> Show active users by country<br />
                <span className="text-emerald-400">ai:</span> SELECT country, COUNT(*) FROM users...
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent" />
              </div>
            </BentoCard>

            {/* Tall Card */}
            <BentoCard className="md:row-span-2 p-8 bg-gradient-to-b from-white/[0.02] to-indigo-900/10">
              <div className="h-full flex flex-col">
                <div className="w-12 h-12 rounded-lg bg-fuchsia-500/20 flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6 text-fuchsia-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Schema Visualization</h3>
                <p className="text-slate-400 mb-8">
                  Interactive ER diagrams that update in real-time as you modify your database.
                </p>
                <div className="flex-1 relative">
                  {/* Abstract nodes animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute top-1/4 left-1/4 w-16 h-16 rounded-lg border-2 border-indigo-500/30 bg-indigo-500/10"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                        className="absolute top-1/2 right-1/4 w-16 h-16 rounded-lg border-2 border-fuchsia-500/30 bg-fuchsia-500/10"
                      />
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <line x1="35%" y1="35%" x2="65%" y2="60%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </BentoCard>

            {/* Small Card 1 */}
            <BentoCard className="p-8">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Real-time Sync</h3>
              <p className="text-slate-400 text-sm">
                Changes reflect instantly across your team's dashboards.
              </p>
            </BentoCard>

            {/* Small Card 2 */}
            <BentoCard className="p-8">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Enterprise Security</h3>
              <p className="text-slate-400 text-sm">
                SOC2 Type II compliant. Your data never trains our models.
              </p>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* === PRICING SECTION === */}
      <section id="pricing" className="py-32 relative border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Simple, transparent pricing</h2>
            <p className="text-slate-400 text-lg mb-8">Start for free, scale as you grow.</p>

            {/* Toggle */}
            <div className="inline-flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'yearly' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Yearly <span className="text-emerald-400 text-xs ml-1">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              tier="Starter"
              price="$0"
              features={[
                "1 Database Connection",
                "50 AI Queries / month",
                "Basic Schema Visualization",
                "Community Support"
              ]}
            />
            <PricingCard
              tier="Pro"
              price={billingCycle === 'monthly' ? "$49" : "$39"}
              recommended={true}
              features={[
                "5 Database Connections",
                "Unlimited AI Queries",
                "Advanced Visualization",
                "Team Dashboards",
                "Priority Support",
                "Query History & Export"
              ]}
            />
            <PricingCard
              tier="Enterprise"
              price="Custom"
              features={[
                "Unlimited Connections",
                "Custom AI Model Fine-tuning",
                "SSO & Audit Logs",
                "Dedicated Success Manager",
                "On-premise Deployment",
                "SLA Guarantee"
              ]}
            />
          </div>
        </div>
      </section>

      {/* === CTA SECTION === */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/5" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            Ready to modernize your <br /> data workflow?
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Join 10,000+ developers who are querying faster and building better with ChatSQL.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200 transition-all shadow-lg shadow-white/10">
              Get Started Now
            </Link>
            <Link to="/contact" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="py-12 border-t border-white/10 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-indigo-400" />
                <span className="text-lg font-bold text-white">ChatSQL</span>
              </div>
              <p className="text-slate-500 text-sm">
                Making database interaction as simple as a conversation.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-indigo-400">Features</a></li>
                <li><a href="#" className="hover:text-indigo-400">Integrations</a></li>
                <li><a href="#" className="hover:text-indigo-400">Pricing</a></li>
                <li><a href="#" className="hover:text-indigo-400">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-indigo-400">Documentation</a></li>
                <li><a href="#" className="hover:text-indigo-400">API Reference</a></li>
                <li><a href="#" className="hover:text-indigo-400">Community</a></li>
                <li><a href="#" className="hover:text-indigo-400">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-indigo-400">About</a></li>
                <li><a href="#" className="hover:text-indigo-400">Careers</a></li>
                <li><a href="#" className="hover:text-indigo-400">Legal</a></li>
                <li><a href="#" className="hover:text-indigo-400">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-slate-600 text-sm">
              © 2026 ChatSQL Inc. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-slate-500 hover:text-white transition-colors"><Globe className="w-4 h-4" /></a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors"><Activity className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
