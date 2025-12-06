import { ArrowRight, Check, ChevronDown, Database, Zap, Shield, Users, Code, Cpu, Keyboard, Server, Cloud, Layers, Box } from 'lucide-react';
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

const SquareGrid = () => {
  const x = useMotionValue(50);
  const y = useMotionValue(50);

  useEffect(() => {
    const controlsX = animate(x, [0, 100, 50, 20, 80, 0], {
      duration: 35,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "linear",
    });

    const controlsY = animate(y, [0, 30, 100, 70, 0], {
      duration: 40,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "linear",
    });

    return () => {
      controlsX.stop();
      controlsY.stop();
    };
  }, []);

  const maskImage = useMotionTemplate`radial-gradient(250px circle at ${x}% ${y}%, black, transparent)`;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Base Grid (Dim) */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Glowing Grid (Revealed by mask) */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      />

      {/* Fade out at bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/60 to-[#050505] pointer-events-none" />
    </div>
  );
}; const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-black rounded-sm" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">ChatSQL</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</a>
        <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Resources</a>
        <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Testimonials</a>
        <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pricing</a>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/auth/signin" className="text-sm font-medium text-white hover:text-gray-300 hidden sm:block">Sign In</Link>
        <Link to="/dashboard" className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)]">
          Get Started
        </Link>
      </div>
    </div>
  </nav>
);

const Hero = () => (
  <section className="pt-40 pb-20 px-6 relative overflow-hidden min-h-screen flex flex-col justify-center">
    <SquareGrid />
    {/* Background Gradients */}
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#6366f1]/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#6366f1]/5 blur-[120px] rounded-full" />
    </div>

    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-8 hover:bg-white/10 transition-colors cursor-pointer group">
          <span className="flex items-center gap-2 text-white font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse"></span>
            New Update
          </span>
          <span className="text-gray-600">|</span>
          <span className="group-hover:text-white transition-colors">Introducing ChatSQL v3</span>
          <ArrowRight className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors ml-1" />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-[1.1] tracking-tight">
          Visual Tools To Build <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-500">Smarter Databases</span>
        </h1>

        <p className="text-lg text-gray-400 mb-10 max-w-lg leading-relaxed">
          Transform ideas into scalable schemas through a visual and developer-friendly builder.
        </p>

        <div className="flex flex-wrap gap-4 mb-16">
          <Link to="/dashboard" className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:-translate-y-0.5">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button className="px-8 py-4 rounded-full font-semibold text-white border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2 backdrop-blur-sm hover:-translate-y-0.5">
            Watch Demo
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-sm text-gray-500 font-medium">Support 100+ Database Integrations</span>
          <div className="flex gap-4">
            {[Database, Cloud, Server, Layers, Box].map((Icon, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                <Icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3D Dashboard Visual */}
      <div className="relative perspective-1000">
        <div className="relative transform rotate-y-[-12deg] rotate-x-[5deg] hover:rotate-y-[-5deg] hover:rotate-x-[2deg] transition-transform duration-700 ease-out">
          <div className="absolute inset-0 bg-[#6366f1]/20 blur-[80px] rounded-full -z-10" />
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            {/* Fake Browser Header */}
            <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                <div className="w-3 h-3 rounded-full bg-green-500/20" />
              </div>
              <div className="ml-4 px-3 py-1 rounded-md bg-black/50 border border-white/5 text-[10px] text-gray-500 font-mono flex items-center gap-2">
                <Shield className="w-3 h-3" />
                chatsql.app/builder
              </div>
            </div>

            {/* Dashboard Content Placeholder */}
            <div className="p-6 min-h-[500px] bg-gradient-to-br from-[#0A0A0A] to-black relative">
              <div className="grid grid-cols-3 gap-6">
                {/* Sidebar */}
                <div className="col-span-1 space-y-4">
                  <div className="h-8 w-3/4 bg-white/5 rounded animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-white/5 rounded animate-pulse delay-75" />
                    <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse delay-100" />
                    <div className="h-4 w-4/5 bg-white/5 rounded animate-pulse delay-150" />
                  </div>
                </div>
                {/* Main Area */}
                <div className="col-span-2 space-y-6">
                  <div className="flex gap-4">
                    <div className="h-32 w-full bg-white/5 rounded-lg border border-white/5 animate-pulse delay-200" />
                    <div className="h-32 w-full bg-white/5 rounded-lg border border-white/5 animate-pulse delay-300" />
                  </div>
                  <div className="h-64 w-full bg-white/5 rounded-lg border border-white/5 animate-pulse delay-500" />
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute top-1/4 right-10 bg-[#1a1a1a] border border-white/10 p-4 rounded-lg shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#6366f1]" />
                  <span className="text-xs text-gray-300 font-mono">users_table</span>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 w-24 bg-white/10 rounded" />
                  <div className="h-1.5 w-16 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const LogoTicker = () => {
  const logos = [amazonLogo, googleLogo, microsoftLogo, nikeLogo, coinbaseLogo];

  return (
    <section className="py-24 border-y border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center mb-12">
        <p className="text-sm font-medium text-gray-500">Powering teams from early-stage to unicorns</p>
      </div>

      <div className="flex relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10" />

        <motion.div
          className="flex gap-16 px-4"
          animate={{ x: "-50%" }}
          transition={{
            duration: 30,
            ease: "linear",
            repeat: Infinity
          }}
        >
          {[...logos, ...logos, ...logos, ...logos].map((logo, i) => (
            <div key={i} className="w-48 h-24 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer">
              <img
                src={logo}
                alt="Logo"
                className="w-32 h-12 object-contain brightness-0 invert opacity-50 group-hover:brightness-100 group-hover:invert-0 group-hover:opacity-100 transition-all duration-300"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const FeatureSpotlight = () => (
  <section className="py-32 px-6">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Build Databases With Clarity <br /> and Confidence</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">From planning to execution, ChatSQL ensures your workflow stays clear, secure, and reliable.</p>
      </div>

      {/* Feature 1 */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-12 mb-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-[#6366f1]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-black rounded-2xl border border-white/10 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(99,102,241,0.3)]">
            <Cpu className="w-8 h-8 text-[#6366f1]" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">The Core Of Smarter <br /> Database Building</h3>
          <p className="text-gray-400 max-w-lg">Built on a foundation of precision and performance, ChatSQL gives you the stability to scale.</p>
          <button className="mt-8 px-6 py-2 rounded-full border border-white/20 text-white text-sm hover:bg-white/5 transition-colors">Explore Docs</button>
        </div>
      </div>

      {/* Feature 2 */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-12 relative overflow-hidden">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 flex justify-center">
            {/* Keyboard Visual Placeholder */}
            <div className="grid grid-cols-2 gap-2">
              <div className="w-16 h-16 bg-black border border-white/20 rounded-lg flex items-center justify-center text-white font-mono">A</div>
              <div className="w-16 h-16 bg-black border border-white/20 rounded-lg flex items-center justify-center text-white font-mono">S</div>
              <div className="w-16 h-16 bg-black border border-white/20 rounded-lg flex items-center justify-center text-white font-mono">Z</div>
              <div className="w-16 h-16 bg-black border border-white/20 rounded-lg flex items-center justify-center text-white font-mono">X</div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 mb-6">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              Faster Workflows
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Efficiency Built Into <br /> Every Step You Take</h3>
            <p className="text-gray-400 mb-8">From shortcuts to smart workflows, ChatSQL keeps your focus on building, not struggling with complexity.</p>
            <button className="px-6 py-2 rounded-full border border-white/20 text-white text-sm hover:bg-white/5 transition-colors">Explore Docs</button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const BentoGrid = () => (
  <section className="py-32 px-6 bg-black/20">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Everything You Need To <br /> Build Smarter Databases</h2>
        <p className="text-gray-400">A complete platform that transforms the way teams create, organize, and grow.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
          <div className="h-40 bg-white/5 rounded-xl mb-6 flex items-center justify-center">
            <Database className="text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Connect With Your Favorite Tools</h3>
          <p className="text-sm text-gray-400">ChatSQL integrates with GitHub, AWS, MongoDB, and more.</p>
        </div>

        {/* Card 2 */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
          <div className="h-40 bg-white/5 rounded-xl mb-6 flex items-center justify-center">
            <Code className="text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Smart File and Status Management</h3>
          <p className="text-sm text-gray-400">Organize schema files, update progress, and never lose track.</p>
        </div>

        {/* Card 3 */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
          <div className="h-40 bg-white/5 rounded-xl mb-6 flex items-center justify-center">
            <Zap className="text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Multi-Database Compatibility</h3>
          <p className="text-sm text-gray-400">Design schemas that work across MySQL, PostgreSQL, SQL Server.</p>
        </div>

        {/* Card 4 (Wide) */}
        <div className="md:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
          <div className="h-40 bg-white/5 rounded-xl mb-6 flex items-center justify-center">
            <span className="font-mono text-gray-600">SELECT * FROM users WHERE...</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Code-First Schema Design</h3>
          <p className="text-sm text-gray-400">Write, edit, and execute database schemas directly in ChatSQL.</p>
        </div>

        {/* Card 5 */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
          <div className="h-40 bg-white/5 rounded-xl mb-6 flex items-center justify-center">
            <Users className="text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Collaborate With Full Control</h3>
          <p className="text-sm text-gray-400">Invite teammates, assign roles, and manage permissions.</p>
        </div>
      </div>
    </div>
  </section>
);

const KeyboardSection = () => (
  <section className="py-32 px-6">
    <div className="max-w-5xl mx-auto text-center">
      <h2 className="text-4xl font-bold text-white mb-4">Master Every Command <br /> With Smart Shortcuts</h2>
      <p className="text-gray-400 mb-12">Work faster and stay in flow with keyboard-driven actions.</p>

      {/* Keyboard Visual Placeholder */}
      <div className="w-full aspect-[3/1] bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mb-12">
        <Keyboard className="w-20 h-20 text-gray-700" />
        <span className="ml-4 text-gray-600 font-mono">Full Keyboard Visualization</span>
      </div>

      {/* Shortcuts List */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
        {['Open Schema', 'Quick Find', 'New Table', 'Export SQL'].map((item) => (
          <div key={item} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
            <span className="text-sm text-gray-400">{item}</span>
            <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-gray-300">⌘ K</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Pricing = () => (
  <section className="py-32 px-6 bg-black/20">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="text-4xl font-bold text-white mb-6">Flexible Pricing That <br /> Scales With Growth</h2>
        <p className="text-gray-400">From startups to enterprises, ChatSQL offers pricing built to match your journey.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Starter */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-bold text-white">$10</span>
            <span className="text-gray-500">/month</span>
          </div>
          <p className="text-sm text-gray-400 mb-8">Perfect for individuals and small projects.</p>
          <button className="w-full py-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors mb-8">Start for Free</button>
          <ul className="space-y-4">
            {['Create up to 5 schemas', 'Up to 3 collaborators', 'Visual schema builder'].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-gray-400">
                <Check className="w-4 h-4 text-white" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className="bg-[#0A0A0A] border border-[#6366f1]/50 rounded-2xl p-8 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#6366f1] text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>
          <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-bold text-white">$29</span>
            <span className="text-gray-500">/month</span>
          </div>
          <p className="text-sm text-gray-400 mb-8">Best for growing teams who need collaboration.</p>
          <button className="w-full py-3 rounded-lg bg-[#6366f1] text-white font-medium hover:bg-[#5558dd] transition-colors mb-8">Upgrade to Pro</button>
          <ul className="space-y-4">
            {['Unlimited schemas', 'Up to 10 collaborators', 'Advanced relation management', 'Export to SQL, JSON'].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-gray-400">
                <Check className="w-4 h-4 text-[#6366f1]" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Enterprise */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-bold text-white">Custom</span>
          </div>
          <p className="text-sm text-gray-400 mb-8">Tailored for large organizations with complex needs.</p>
          <button className="w-full py-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors mb-8">Contact Sales</button>
          <ul className="space-y-4">
            {['Unlimited schemas & collaborators', 'SSO & advanced permissions', 'Dedicated account manager'].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-gray-400">
                <Check className="w-4 h-4 text-white" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const FAQ = () => (
  <section className="py-32 px-6">
    <div className="max-w-3xl mx-auto">
      <h2 className="text-4xl font-bold text-white mb-12 text-center">Frequently Asked <br /> Questions</h2>
      <div className="space-y-4">
        {['What is ChatSQL and how does it work?', 'Can I use ChatSQL for free before upgrading?', 'Which databases are supported?', 'How does collaboration work?'].map((q) => (
          <div key={q} className="border-b border-white/10 py-4">
            <button className="flex items-center justify-between w-full text-left text-white hover:text-gray-300">
              <span className="font-medium">{q}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-20 px-6 border-t border-white/10 bg-black">
    <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-12">
      <div className="col-span-2">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 bg-white rounded-md" />
          <span className="text-lg font-bold text-white">ChatSQL</span>
        </div>
        <div className="flex gap-4 text-gray-400">
          {/* Social Icons */}
          <div className="w-5 h-5 bg-white/10 rounded-full" />
          <div className="w-5 h-5 bg-white/10 rounded-full" />
          <div className="w-5 h-5 bg-white/10 rounded-full" />
        </div>
      </div>

      <div>
        <h4 className="text-white font-bold mb-6">Product</h4>
        <ul className="space-y-4 text-sm text-gray-400">
          <li><a href="#" className="hover:text-white">Schema Builder</a></li>
          <li><a href="#" className="hover:text-white">Visual ERD</a></li>
          <li><a href="#" className="hover:text-white">Relations Manager</a></li>
        </ul>
      </div>

      <div>
        <h4 className="text-white font-bold mb-6">Resources</h4>
        <ul className="space-y-4 text-sm text-gray-400">
          <li><a href="#" className="hover:text-white">Documentation</a></li>
          <li><a href="#" className="hover:text-white">Blog</a></li>
          <li><a href="#" className="hover:text-white">Community</a></li>
        </ul>
      </div>

      <div>
        <h4 className="text-white font-bold mb-6">Company</h4>
        <ul className="space-y-4 text-sm text-gray-400">
          <li><a href="#" className="hover:text-white">About</a></li>
          <li><a href="#" className="hover:text-white">Careers</a></li>
          <li><a href="#" className="hover:text-white">Contact</a></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 flex justify-between text-xs text-gray-600">
      <span>© 2025 ChatSQL Inc. All rights reserved.</span>
      <span>Made with love</span>
    </div>
  </footer>
);

export default function ChatSQLLanding() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#6366f1]/30">
      <Navbar />
      <Hero />
      <LogoTicker />
      <FeatureSpotlight />
      <BentoGrid />
      <KeyboardSection />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}
