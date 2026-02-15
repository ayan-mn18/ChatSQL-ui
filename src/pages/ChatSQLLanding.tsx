import {
  Database, Zap, Shield, Layers, Sparkles,
  ArrowRight, MessageSquare, CheckCircle2,
  Globe, Activity, ChevronRight, Code2, BarChart3,
  LogOut, User as UserIcon, CreditCard, LayoutDashboard,
  Lock, Cpu, GitBranch, Terminal,
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/UserAvatar';
import { ChatSQLLogo } from '@/components/ChatSQLLogo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Import logos
import amazonLogo from '../public/amazon.png';
import coinbaseLogo from '../public/coinbase.png';
import googleLogo from '../public/google.png';
import microsoftLogo from '../public/microsoft.png';
import nikeLogo from '../public/nike.png';

// --- Atmospheric Background with noise & layered depth ---
const Background = () => (
  <div className="fixed inset-0 z-[-1] bg-[#030712] overflow-hidden">
    {/* Subtle grid with crosshair dots */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle,#80808015_1px,transparent_1px)] bg-[size:32px_32px]" />

    {/* Ambient glow - top center (warm indigo) */}
    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-indigo-500/15 blur-[150px] rounded-full mix-blend-screen" />
    {/* Ambient glow - bottom right (fuchsia mist) */}
    <div className="absolute -bottom-32 -right-32 w-[900px] h-[700px] bg-fuchsia-500/8 blur-[150px] rounded-full mix-blend-screen" />
    {/* Ambient glow - mid left accent */}
    <div className="absolute top-1/2 -left-48 w-[600px] h-[600px] bg-violet-500/5 blur-[130px] rounded-full mix-blend-screen" />

    {/* Film grain overlay */}
    <div className="grain-overlay absolute inset-0" />
  </div>
);

// --- Glassmorphism Navbar ---
const Navbar = () => {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/signin');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${scrolled
        ? 'bg-[#030712]/80 backdrop-blur-2xl border-b border-white/5 shadow-lg shadow-black/20'
        : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3 group">
            <ChatSQLLogo size={36} glow />
            <span className="text-base font-bold text-white tracking-tight font-display">ChatSQL</span>
          </Link>

          {/* Nav links - pill style */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] rounded-full px-1.5 py-1 border border-white/5">
            <a href="#features" className="px-4 py-1.5 text-sm font-medium text-slate-400 hover:text-white transition-all rounded-full hover:bg-white/10">
              Features
            </a>
            <a href="#pricing" className="px-4 py-1.5 text-sm font-medium text-slate-400 hover:text-white transition-all rounded-full hover:bg-white/10">
              Pricing
            </a>
            <Link to="/contact" className="px-4 py-1.5 text-sm font-medium text-slate-400 hover:text-white transition-all rounded-full hover:bg-white/10">
              Contact
            </Link>
          </nav>

          {/* Auth actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated && !isLoading ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-800/60 transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50">
                    <UserAvatar
                      user={user}
                      className="w-8 h-8 border-2 border-slate-700"
                      fallbackClassName="bg-slate-700 text-slate-300 text-sm"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-slate-900/95 backdrop-blur-xl border-slate-700 shadow-2xl rounded-xl p-1">
                  <div className="px-3 py-2.5 mb-1">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        user={user}
                        className="w-10 h-10 border-2 border-slate-700"
                        fallbackClassName="bg-slate-700 text-slate-200 text-base"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user?.username || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-800 mx-1" />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg mx-1 my-0.5">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/connections')} className="cursor-pointer text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg mx-1 my-0.5">
                    <Database className="mr-2 h-4 w-4" /> Connections
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/profile')} className="cursor-pointer text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg mx-1 my-0.5">
                    <UserIcon className="mr-2 h-4 w-4" /> Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/usage')} className="cursor-pointer text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg mx-1 my-0.5">
                    <Zap className="mr-2 h-4 w-4" /> Usage & Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/pricing')} className="cursor-pointer text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg mx-1 my-0.5">
                    <CreditCard className="mr-2 h-4 w-4" /> Plans & Pricing
                  </DropdownMenuItem>
                  {user?.role === 'super_admin' && (
                    <>
                      <DropdownMenuSeparator className="bg-slate-800 mx-1" />
                      <DropdownMenuItem onClick={() => navigate('/dashboard/users')} className="cursor-pointer text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg mx-1 my-0.5">
                        <Shield className="mr-2 h-4 w-4" /> User Management
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-slate-800 mx-1" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300 rounded-lg mx-1 my-1">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !isLoading ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/auth/signin')}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
                >
                  Sign in
                </button>
                <Button
                  size="sm"
                  onClick={() => navigate('/auth/signup')}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 h-9 text-sm font-medium transition-all rounded-xl"
                >
                  Get Started
                  <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

// --- Typing animation hook ---
const useTypingEffect = (text: string, speed = 40, startDelay = 1200) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    setDisplayed('');
    setDone(false);

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);

  return { displayed, done };
};

// --- Feature Card with glow border on hover ---
const FeatureCard = ({ icon: Icon, iconColor, iconBg, title, description, delay = 0, className = '', children }: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  delay?: number;
  className?: string;
  children?: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 ${className}`}
  >
    {/* Hover glow border effect */}
    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.05), transparent)' }}
    />

    <div className="relative p-8 h-full flex flex-col">
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <h3 className="text-xl font-bold text-white mb-3 font-display">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed flex-1">{description}</p>
      {children}
    </div>
  </motion.div>
);

// --- Pricing Card with glassmorphism ---
const PricingCard = ({ tier, price, period, features, recommended = false, isLifetime = false, delay = 0 }: {
  tier: string;
  price: string;
  period?: string;
  features: string[];
  recommended?: boolean;
  isLifetime?: boolean;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    whileHover={{ y: -6, transition: { duration: 0.3 } }}
    className={`group relative rounded-2xl border backdrop-blur-sm flex flex-col h-full overflow-hidden ${recommended
      ? 'border-indigo-500/30 bg-indigo-500/[0.04]'
      : isLifetime
        ? 'border-purple-500/20 bg-purple-500/[0.02]'
        : 'border-white/[0.06] bg-white/[0.02]'
      }`}
  >
    {/* Subtle gradient shine on hover */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br from-white/[0.03] via-transparent to-transparent" />

    {recommended && (
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    )}
    {isLifetime && (
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
    )}

    <div className="relative p-8 flex flex-col h-full">
      {/* Badge */}
      {recommended && (
        <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
          Popular
        </div>
      )}
      {isLifetime && (
        <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 text-[11px] font-bold text-purple-300 uppercase tracking-wider">
          Best Value
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider font-display">{tier}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-5xl font-bold text-white font-display tracking-tight">{price}</span>
          {period && <span className="text-slate-500 text-sm">{period}</span>}
        </div>
        {isLifetime && <p className="text-emerald-400 text-xs mt-2 font-medium">Pay once, use forever</p>}
      </div>

      <div className="flex-1 space-y-3.5 mb-8">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3 text-sm text-slate-400">
            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${recommended ? 'text-indigo-400' : isLifetime ? 'text-purple-400' : 'text-slate-600'
              }`} />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <a
        href={price === 'Custom' ? '/contact?plan=enterprise' : '/auth/signup'}
        className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all text-center block ${recommended
          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30'
          : isLifetime
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20'
            : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.06]'
          }`}
      >
        {price === 'Custom' ? 'Contact Sales' : price === '$0' ? 'Get Started Free' : 'Get Started'}
      </a>
    </div>
  </motion.div>
);

// --- Stat counter component ---
const StatBlock = ({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="text-center"
  >
    <div className="text-3xl md:text-4xl font-bold text-white font-display tracking-tight">{value}</div>
    <div className="text-sm text-slate-500 mt-1">{label}</div>
  </motion.div>
);

// =========================================================================
// MAIN LANDING PAGE
// =========================================================================
export default function ChatSQLLanding() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const heroRef = useRef<HTMLDivElement>(null);

  // Scroll-driven parallax for hero section
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.97]);

  const smoothHeroY = useSpring(heroY, { stiffness: 100, damping: 30 });
  const smoothMockupY = useSpring(mockupY, { stiffness: 100, damping: 30 });

  // Typing animation for the hero demo
  const queryText = "Show me monthly revenue growth for last quarter, grouped by region";
  const { displayed: typedQuery, done: queryDone } = useTypingEffect(queryText, 35, 1500);

  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-white">
      <Background />
      <Navbar />

      {/* === HERO SECTION === */}
      <section ref={heroRef} className="relative pt-32 pb-20 md:pt-44 md:pb-28 px-6 overflow-hidden">
        <motion.div
          style={{ y: smoothHeroY }}
          className="max-w-7xl mx-auto relative z-10"
        >
          {/* Top row: Badge + Stats side by side on desktop */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12 lg:gap-20">

            {/* Left: Text content - left-aligned for asymmetry */}
            <div className="lg:max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8 hover:bg-indigo-500/15 transition-colors cursor-default"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                v2.0 — Now with real-time schema sync
                <ChevronRight className="w-3 h-3" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold text-white mb-8 tracking-tight leading-[1.05] font-display"
              >
                Your database,{' '}
                <span className="relative inline-block">
                  <span
                    className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                    style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    fluent in human.
                  </span>
                  {/* Decorative underline swoosh */}
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-indigo-500/30" viewBox="0 0 200 8" preserveAspectRatio="none">
                    <path d="M0 7 C50 0, 150 0, 200 7" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-xl text-slate-400 mb-10 max-w-xl leading-relaxed"
              >
                Stop writing boilerplate SQL. Ask questions in plain English — get optimized queries,
                live schema maps, and instant dashboards.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-start gap-4 mb-10"
              >
                <Link
                  to="/dashboard"
                  className="group px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold hover:shadow-2xl hover:shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                >
                  Start for free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="flex items-center gap-5 text-sm text-slate-500 self-center sm:self-auto sm:ml-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 14-day trial
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right: Quick stats - overlapping the hero area */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="hidden lg:flex flex-col gap-8 pt-12"
            >
              <StatBlock value="10k+" label="Active developers" delay={0.5} />
              <StatBlock value="2M+" label="Queries generated" delay={0.6} />
              <StatBlock value="99.9%" label="Uptime SLA" delay={0.7} />
            </motion.div>
          </div>

          {/* Dashboard Mockup - with parallax scroll */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 60 }}
            style={{ y: smoothMockupY, scale: mockupScale }}
            className="relative mt-16 md:mt-20 mx-auto max-w-6xl"
          >
            {/* Glow behind mockup */}
            <div className="absolute -inset-4 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-2xl rounded-3xl pointer-events-none" />

            <div className="relative rounded-2xl border border-white/[0.08] bg-[#0f172a]/90 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
              {/* Window Chrome */}
              <div className="h-11 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs font-mono text-slate-500 flex items-center gap-2">
                    <Lock className="w-3 h-3 text-emerald-500/70" />
                    postgres://production-db:5432
                  </div>
                </div>
                <div className="w-16" />
              </div>

              {/* Interface Layout */}
              <div className="flex h-[500px] md:h-[550px]">
                {/* Sidebar - table tree */}
                <div className="w-56 border-r border-white/5 bg-white/[0.01] p-4 hidden md:flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold px-2 mb-3 uppercase tracking-wider">
                    <Database className="w-3.5 h-3.5" /> Tables
                  </div>
                  {['users', 'transactions', 'products', 'regions', 'analytics'].map((table, i) => (
                    <div
                      key={table}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-colors ${i === 1 ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'text-slate-500 hover:bg-white/[0.03]'
                        }`}
                    >
                      <GitBranch className="w-3 h-3 opacity-50" />
                      {table}
                    </div>
                  ))}
                  <div className="mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Connected
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-5 md:p-6 flex flex-col gap-5 overflow-hidden">
                  {/* Chat Input - with typing effect */}
                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/20">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 bg-white/[0.04] rounded-xl p-4 border border-white/[0.08]">
                      <p className="text-slate-300 text-base font-light leading-relaxed">
                        {typedQuery}
                        {!queryDone && <span className="animate-caret ml-0.5">&nbsp;</span>}
                      </p>
                    </div>
                  </div>

                  {/* Generated SQL - appears after typing */}
                  <AnimatePresence>
                    {queryDone && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        transition={{ duration: 0.4 }}
                        className="ml-12 space-y-4"
                      >
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <Code2 className="w-3.5 h-3.5" />
                          Generated SQL
                        </div>
                        <div className="bg-[#020617] rounded-xl border border-white/[0.06] p-4 font-mono text-sm overflow-x-auto">
                          <span className="text-purple-400">SELECT</span> <span className="text-slate-300">region,</span>{' '}
                          <span className="text-indigo-400">DATE_TRUNC</span><span className="text-slate-500">(</span>
                          <span className="text-emerald-400">'month'</span><span className="text-slate-500">,</span>{' '}
                          <span className="text-slate-300">created_at</span><span className="text-slate-500">)</span>{' '}
                          <span className="text-purple-400">AS</span> <span className="text-slate-300">month,</span><br />
                          {'  '}<span className="text-indigo-400">SUM</span><span className="text-slate-500">(</span>
                          <span className="text-slate-300">amount</span><span className="text-slate-500">)</span>{' '}
                          <span className="text-purple-400">AS</span> <span className="text-slate-300">total</span><br />
                          <span className="text-purple-400">FROM</span> <span className="text-slate-300">transactions</span><br />
                          <span className="text-purple-400">WHERE</span> <span className="text-slate-300">created_at</span>{' '}
                          <span className="text-slate-500">&gt;</span> <span className="text-indigo-400">NOW</span>
                          <span className="text-slate-500">()</span> <span className="text-slate-500">-</span>{' '}
                          <span className="text-purple-400">INTERVAL</span> <span className="text-emerald-400">'3 months'</span><br />
                          <span className="text-purple-400">GROUP BY</span> <span className="text-slate-500">1, 2</span>{' '}
                          <span className="text-purple-400">ORDER BY</span> <span className="text-slate-500">2 DESC</span><span className="text-slate-500">;</span>
                        </div>

                        {/* Animated chart bars */}
                        <div className="h-48 bg-gradient-to-b from-indigo-500/[0.04] to-transparent rounded-xl border border-white/[0.04] relative overflow-hidden flex items-end justify-around px-6 pb-0 pt-6">
                          {/* Y-axis labels */}
                          <div className="absolute left-3 top-4 bottom-0 flex flex-col justify-between text-[10px] text-slate-600 font-mono pb-2">
                            <span>$90k</span>
                            <span>$60k</span>
                            <span>$30k</span>
                            <span>$0</span>
                          </div>
                          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <motion.div
                              key={i}
                              initial={{ height: 0 }}
                              animate={{ height: `${h}%` }}
                              transition={{ duration: 0.6, delay: 0.2 + i * 0.08, ease: [0.21, 0.47, 0.32, 0.98] }}
                              className="w-8 md:w-10 bg-gradient-to-t from-indigo-600/60 to-indigo-400/30 rounded-t-md hover:from-indigo-500/70 hover:to-indigo-300/40 transition-colors cursor-pointer relative group"
                            >
                              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono">
                                ${h}k
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* === SOCIAL PROOF - Infinite Marquee === */}
      <section className="py-14 border-y border-white/5 bg-white/[0.01] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <p className="text-center text-xs font-semibold text-slate-600 uppercase tracking-[0.2em]">
            Trusted by engineering teams worldwide
          </p>
        </div>
        {/* Infinite scroll marquee */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#030712] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#030712] to-transparent z-10 pointer-events-none" />

          <div className="flex animate-marquee">
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex shrink-0 items-center gap-16 px-8">
                {[amazonLogo, googleLogo, microsoftLogo, nikeLogo, coinbaseLogo].map((logo, i) => (
                  <img
                    key={`${setIdx}-${i}`}
                    src={logo}
                    alt="Partner"
                    className="h-7 object-contain brightness-150 contrast-0 opacity-40 hover:brightness-100 hover:contrast-100 hover:opacity-100 transition-all duration-300 shrink-0"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURES - Bento Grid with creative layout === */}
      <section id="features" className="py-28 md:py-36 relative">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section header - left aligned */}
          <div className="mb-16 md:mb-20 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 text-xs font-medium mb-6"
            >
              <Cpu className="w-3 h-3" />
              Features
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-[1.1] font-display"
            >
              Everything you need to{' '}
              <span className="text-indigo-400">master your data.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-slate-400 text-lg leading-relaxed"
            >
              From natural language queries to enterprise-grade security — all in one beautiful interface.
            </motion.p>
          </div>

          {/* Bento grid - asymmetric layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-[280px]">
            {/* Hero feature - spans 7 cols, 2 rows */}
            <FeatureCard
              icon={MessageSquare}
              iconColor="text-indigo-400"
              iconBg="bg-indigo-500/15"
              title="Natural Language Querying"
              description="Forget complex JOINs and subqueries. Ask questions in plain English and get optimized SQL with instant visualizations."
              className="md:col-span-7 md:row-span-2"
              delay={0}
            >
              {/* Live demo snippet */}
              <div className="mt-5 relative h-40 bg-[#020617] rounded-xl border border-white/[0.06] p-4 font-mono text-xs overflow-hidden group-hover:border-indigo-500/20 transition-colors">
                <div className="space-y-2">
                  <div>
                    <span className="text-indigo-400">user</span><span className="text-slate-600"> &#8594; </span>
                    <span className="text-slate-300">Show active users by country</span>
                  </div>
                  <div className="mt-3 text-slate-500">
                    <span className="text-purple-400">SELECT</span> country, <span className="text-indigo-400">COUNT</span>(*) <span className="text-purple-400">AS</span> active_users<br />
                    <span className="text-purple-400">FROM</span> users <span className="text-purple-400">WHERE</span> status = <span className="text-emerald-400">'active'</span><br />
                    <span className="text-purple-400">GROUP BY</span> country <span className="text-purple-400">ORDER BY</span> 2 <span className="text-purple-400">DESC</span>;
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#020617] to-transparent" />
              </div>
            </FeatureCard>

            {/* Schema Viz - 5 cols, 1 row */}
            <FeatureCard
              icon={Layers}
              iconColor="text-fuchsia-400"
              iconBg="bg-fuchsia-500/15"
              title="Schema Visualization"
              description="Interactive ER diagrams that update in real-time as your database evolves."
              className="md:col-span-5"
              delay={0.1}
            >
              {/* Animated schema nodes */}
              <div className="absolute bottom-6 right-6 opacity-30 group-hover:opacity-60 transition-opacity duration-500">
                <div className="relative w-32 h-24">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 left-0 w-14 h-10 rounded-lg border border-indigo-500/30 bg-indigo-500/10"
                  />
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-0 right-0 w-14 h-10 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10"
                  />
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line x1="50" y1="20" x2="80" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="3 3" />
                  </svg>
                </div>
              </div>
            </FeatureCard>

            {/* Real-time Sync - 5 cols, 1 row */}
            <FeatureCard
              icon={Zap}
              iconColor="text-emerald-400"
              iconBg="bg-emerald-500/15"
              title="Real-time Sync"
              description="Schema changes, DDL updates, and query results sync instantly across your entire team."
              className="md:col-span-5"
              delay={0.2}
            >
              <div className="absolute bottom-6 right-6 flex items-center gap-1.5 opacity-30 group-hover:opacity-60 transition-opacity">
                {[0, 1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scaleY: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                    className="w-1 h-8 bg-emerald-500/50 rounded-full"
                  />
                ))}
              </div>
            </FeatureCard>

            {/* Enterprise Security - 6 cols */}
            <FeatureCard
              icon={Shield}
              iconColor="text-amber-400"
              iconBg="bg-amber-500/15"
              title="Enterprise Security"
              description="SOC2 Type II compliant with end-to-end encryption. Your data never trains our models. Row-level security and audit logs included."
              className="md:col-span-6"
              delay={0.15}
            />

            {/* Query History - 6 cols */}
            <FeatureCard
              icon={Terminal}
              iconColor="text-cyan-400"
              iconBg="bg-cyan-500/15"
              title="Query History & Exports"
              description="Full query audit trail with one-click CSV/JSON exports. Bookmark and share your most-used queries across your team."
              className="md:col-span-6"
              delay={0.25}
            />
          </div>
        </div>
      </section>

      {/* === STATS INTERLUDE (mobile-visible version) === */}
      <section className="py-16 border-y border-white/5 lg:hidden">
        <div className="max-w-4xl mx-auto px-6 flex justify-around">
          <StatBlock value="10k+" label="Active devs" />
          <StatBlock value="2M+" label="Queries made" delay={0.1} />
          <StatBlock value="99.9%" label="Uptime" delay={0.2} />
        </div>
      </section>

      {/* === PRICING SECTION === */}
      <section id="pricing" className="py-28 md:py-36 relative">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 text-xs font-medium mb-6"
            >
              <CreditCard className="w-3 h-3" />
              Pricing
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight font-display"
            >
              Simple, transparent pricing
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-slate-400 text-lg mb-10 max-w-xl mx-auto"
            >
              Start for free, scale as you grow. No hidden fees.
            </motion.p>

            {/* Billing toggle */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="inline-flex items-center p-1 rounded-full bg-white/[0.04] border border-white/[0.08]"
            >
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === 'monthly'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${billingCycle === 'yearly'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Yearly
                <span className="text-emerald-400 text-[11px] font-bold">-20%</span>
              </button>
            </motion.div>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            <PricingCard
              tier="Free"
              price="$0"
              period="/month"
              delay={0}
              features={[
                "2 Database Connections",
                "10,000 AI Tokens / month",
                "500 Queries / month",
                "Basic Schema Visualization",
                "Query history (7 days)",
                "Community Support",
              ]}
            />
            <PricingCard
              tier="Pro"
              price={billingCycle === 'monthly' ? '$10' : '$8'}
              period="/month"
              recommended
              delay={0.1}
              features={[
                "10 Database Connections",
                "100,000 AI Tokens / month",
                "5,000 Queries / month",
                "Query history (90 days)",
                "Priority Email Support",
                "Export to CSV/JSON",
              ]}
            />
            <PricingCard
              tier="Lifetime"
              price="$100"
              period=" one-time"
              isLifetime
              delay={0.2}
              features={[
                "50 Database Connections",
                "Unlimited AI Tokens",
                "Unlimited Queries",
                "Unlimited Query History",
                "All Pro Features",
                "Future Updates Included",
              ]}
            />
            <PricingCard
              tier="Enterprise"
              price="Custom"
              delay={0.3}
              features={[
                "Unlimited Everything",
                "SSO & Audit Logs",
                "24/7 Dedicated Support",
                "Team Collaboration",
                "On-premise Deployment",
                "Custom SLA Guarantee",
              ]}
            />
          </div>
        </div>
      </section>

      {/* === CTA SECTION - Dramatic finale === */}
      <section className="py-32 md:py-40 relative overflow-hidden">
        {/* Layered background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.03] to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[160px] rounded-full" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 tracking-tight leading-[1.1] font-display"
          >
            Ready to modernize{' '}
            <br className="hidden md:block" />
            your data workflow?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-slate-400 mb-14 max-w-2xl mx-auto leading-relaxed"
          >
            Join 10,000+ developers who query faster and build better with ChatSQL.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/dashboard"
              className="group w-full sm:w-auto px-10 py-4 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-100 transition-all shadow-xl shadow-white/5 hover:shadow-white/10 flex items-center justify-center gap-2"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto px-10 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-semibold hover:bg-white/[0.08] transition-all"
            >
              Contact Sales
            </Link>
          </motion.div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="py-16 border-t border-white/[0.06] bg-[#020617]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
            {/* Brand column - wider */}
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <ChatSQLLogo size="sm" />
                <span className="text-lg font-bold text-white font-display">ChatSQL</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-6">
                Making database interaction as simple as a conversation. Built for developers who value their time.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.08] transition-all">
                  <Globe className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.08] transition-all">
                  <Activity className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Link columns */}
            <div>
              <h4 className="text-white font-semibold mb-5 text-sm font-display">Product</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-indigo-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Integrations</a></li>
                <li><a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-5 text-sm font-display">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-5 text-sm font-display">Company</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Legal</a></li>
                <li><Link to="/contact" className="hover:text-indigo-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-slate-600 text-xs">
              &copy; {new Date().getFullYear()} ChatSQL Inc. All rights reserved.
            </div>
            <div className="flex gap-6 text-xs text-slate-600">
              <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
