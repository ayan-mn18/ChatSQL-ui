
import os

file_path = '/Users/bizer/Development/Projects/ChatSQL/ChatSQL-ui/src/pages/ChatSQLLanding.tsx'

new_content = """import { ArrowRight, Check, Database, Zap, Shield, Code, Cpu, Server, Layers, Terminal, Sparkles, Lock, GitBranch, Search, ChevronDown } from 'lucide-react';
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

  const maskImage = useMotionTemplate`radial-gradient(350px circle at ${x}% ${y}%, black, transparent)`;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/80 to-[#020617]" />
    </div>
  );
};

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Database className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">ChatSQL</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</a>
        <a href="#how-it-works" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">How it works</a>
        <a href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pricing</a>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/auth/signin" className="text-sm font-medium text-gray-300 hover:text-white transition-colors hidden sm:block">Sign In</Link>
        <Link to="/dashboard" className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-md text-sm font-semibold transition-all">
          Get Started
        </Link>
      </div>
    </div>
  </nav>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="p-6 rounded-xl bg-[#0f172a] border border-white/5 hover:border-indigo-500/30 transition-all group">
    <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
      <Icon className="w-6 h-6 text-indigo-400" />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
  </div>
);

const ChatSQLLanding = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <SquareGrid />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8"
          >
            <Sparkles className="w-3 h-3" />
            <span>v2.0 is now available</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
          >
            Talk to your database <br />
            <span className="text-indigo-400">in plain English</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Build, query, and manage your SQL databases using natural language. 
            The modern SQL editor designed for the AI era.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/dashboard" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25">
              Start Building Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-3.5 rounded-lg font-semibold text-gray-300 border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
              <Terminal className="w-4 h-4" />
              View Documentation
            </button>
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-6xl mx-auto mt-20 relative z-10"
        >
          <div className="rounded-xl bg-[#0f172a] border border-white/10 shadow-2xl overflow-hidden">
            <div className="h-10 bg-[#1e293b] border-b border-white/5 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                <div className="w-3 h-3 rounded-full bg-green-500/20" />
              </div>
              <div className="ml-4 text-xs text-gray-500 font-mono">Query Console</div>
            </div>
            <div className="grid grid-cols-12 h-[500px] bg-[#020617]">
              {/* Sidebar Mockup */}
              <div className="col-span-2 border-r border-white/5 p-4 hidden md:block">
                <div className="space-y-3">
                  <div className="h-2 w-20 bg-white/10 rounded" />
                  <div className="h-2 w-16 bg-white/10 rounded" />
                  <div className="h-2 w-24 bg-white/10 rounded" />
                </div>
              </div>
              {/* Editor Mockup */}
              <div className="col-span-12 md:col-span-10 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-3 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-mono">SELECT * FROM users WHERE active = true</div>
                </div>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex gap-4 text-gray-500 border-b border-white/5 pb-2">
                    <span className="w-10">id</span>
                    <span className="w-32">email</span>
                    <span className="w-24">role</span>
                    <span className="w-20">status</span>
                  </div>
                  <div className="flex gap-4 text-gray-300">
                    <span className="w-10 text-indigo-400">1</span>
                    <span className="w-32">alex@example.com</span>
                    <span className="w-24">admin</span>
                    <span className="w-20 text-green-400">active</span>
                  </div>
                  <div className="flex gap-4 text-gray-300">
                    <span className="w-10 text-indigo-400">2</span>
                    <span className="w-32">sarah@example.com</span>
                    <span className="w-24">editor</span>
                    <span className="w-20 text-green-400">active</span>
                  </div>
                  <div className="flex gap-4 text-gray-300">
                    <span className="w-10 text-indigo-400">3</span>
                    <span className="w-32">mike@example.com</span>
                    <span className="w-24">viewer</span>
                    <span className="w-20 text-green-400">active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow effect behind dashboard */}
          <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl -z-10 rounded-[3rem] opacity-50" />
        </motion.div>
      </section>

      {/* Trusted By */}
      <section className="py-10 border-y border-white/5 bg-[#020617]/50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-gray-500 mb-8">TRUSTED BY ENGINEERING TEAMS AT</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <img src={amazonLogo} alt="Amazon" className="h-6 object-contain" />
            <img src={googleLogo} alt="Google" className="h-6 object-contain" />
            <img src={microsoftLogo} alt="Microsoft" className="h-6 object-contain" />
            <img src={coinbaseLogo} alt="Coinbase" className="h-6 object-contain" />
            <img src={nikeLogo} alt="Nike" className="h-8 object-contain" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to manage data</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Stop wrestling with complex SQL clients. ChatSQL gives you a modern, 
              AI-powered environment to visualize, query, and manage your databases.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Zap}
              title="AI-Powered Queries"
              description="Write queries in plain English. Our advanced AI understands your schema and generates optimized SQL instantly."
            />
            <FeatureCard 
              icon={Layers}
              title="Visual Schema Builder"
              description="Design your database schema visually. Drag and drop tables, define relationships, and export SQL."
            />
            <FeatureCard 
              icon={Shield}
              title="Enterprise Security"
              description="Bank-grade encryption for your connections. Role-based access control and audit logs included."
            />
            <FeatureCard 
              icon={GitBranch}
              title="Version Control"
              description="Track changes to your schema and queries. Rollback to previous versions with a single click."
            />
            <FeatureCard 
              icon={Search}
              title="Smart Search"
              description="Find anything in your database instantly. Search across tables, columns, and saved queries."
            />
            <FeatureCard 
              icon={Code}
              title="API Generation"
              description="Automatically generate REST and GraphQL APIs from your database schema in seconds."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-b from-[#0f172a] to-[#020617] border border-white/10 rounded-2xl p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to modernize your workflow?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Join thousands of developers who are building faster with ChatSQL. 
            Start for free, no credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard" className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-lg font-semibold transition-all w-full sm:w-auto">
              Get Started Now
            </Link>
            <Link to="/contact" className="text-gray-300 hover:text-white font-medium px-8 py-3 w-full sm:w-auto">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-[#020617]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-indigo-500" />
              <span className="font-bold text-lg">ChatSQL</span>
            </div>
            <p className="text-gray-500 text-sm">
              The modern database client for the AI era.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Legal</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-gray-600 text-sm">
          © 2025 ChatSQL Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default ChatSQLLanding;
"""

with open(file_path, 'w') as f:
    f.write(new_content)
