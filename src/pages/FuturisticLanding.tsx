import { Link } from 'react-router-dom';
import { 
  Database, 
  Cpu, 
  Zap, 
  GitBranch, 
  Terminal, 
  Sparkles,
  ArrowRight,
  Github,
  Server,
  Code2,
  Brain,
  Network,
  Shield,
  Eye,
  Table2
} from 'lucide-react';

// Animated database node component
function DatabaseNode({ delay = 0, size = 'md' }: { delay?: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };
  
  return (
    <div 
      className={`${sizeClasses[size]} relative animate-float`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-cyan-500/20 rounded-lg blur-xl animate-pulse" />
      <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.2)]">
        <Database className="w-1/2 h-1/2 text-cyan-400" />
      </div>
    </div>
  );
}

// Glowing line component for connecting nodes
function ConnectionLine({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute ${className}`}>
      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent animate-pulse" />
    </div>
  );
}

// Circuit pattern background
function CircuitPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M0 50 H40 M60 50 H100" stroke="currentColor" strokeWidth="1" fill="none" className="text-cyan-400"/>
          <path d="M50 0 V40 M50 60 V100" stroke="currentColor" strokeWidth="1" fill="none" className="text-cyan-400"/>
          <circle cx="50" cy="50" r="4" fill="currentColor" className="text-cyan-400"/>
          <circle cx="0" cy="50" r="2" fill="currentColor" className="text-cyan-400"/>
          <circle cx="100" cy="50" r="2" fill="currentColor" className="text-cyan-400"/>
          <circle cx="50" cy="0" r="2" fill="currentColor" className="text-cyan-400"/>
          <circle cx="50" cy="100" r="2" fill="currentColor" className="text-cyan-400"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circuit)" />
    </svg>
  );
}

// Data stream animation
function DataStream() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-px bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent"
          style={{
            left: `${Math.random() * 100}%`,
            height: `${50 + Math.random() * 100}px`,
            animation: `dataFlow ${3 + Math.random() * 2}s linear infinite`,
            animationDelay: `${Math.random() * 3}s`
          }}
        />
      ))}
    </div>
  );
}

// Feature card component
function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  accentColor = 'cyan' 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  accentColor?: 'cyan' | 'purple' | 'emerald' | 'amber';
}) {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 hover:border-cyan-400/50 text-cyan-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-400/50 text-purple-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 hover:border-emerald-400/50 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 hover:border-amber-400/50 text-amber-400'
  };

  return (
    <div className={`group relative p-6 rounded-2xl bg-gradient-to-br ${colorClasses[accentColor]} border backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-2xl`}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className={`w-14 h-14 rounded-xl bg-slate-900/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
        <Icon className={`w-7 h-7 ${colorClasses[accentColor].split(' ').pop()}`} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

// SQL code preview component
function SQLPreview() {
  const sqlCode = `SELECT customers.name, 
       SUM(orders.total) as revenue
FROM customers
JOIN orders ON customers.id = orders.customer_id
WHERE orders.date >= '2024-01-01'
GROUP BY customers.name
ORDER BY revenue DESC
LIMIT 10;`;

  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-50" />
      <div className="relative bg-slate-900/90 rounded-2xl border border-slate-700/50 overflow-hidden backdrop-blur-xl">
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-sm text-gray-400 font-mono ml-2">query.sql</span>
        </div>
        <pre className="p-4 text-sm font-mono overflow-x-auto">
          <code className="text-cyan-300">
            {sqlCode.split('\n').map((line, i) => (
              <div key={i} className="flex">
                <span className="text-gray-600 select-none w-8">{i + 1}</span>
                <span className="text-gray-300">
                  {line.split(' ').map((word, j) => {
                    const keywords = ['SELECT', 'FROM', 'JOIN', 'ON', 'WHERE', 'GROUP', 'BY', 'ORDER', 'LIMIT', 'AS', 'SUM', 'DESC', 'AND', 'OR'];
                    if (keywords.includes(word.replace(',', '').replace('(', ''))) {
                      return <span key={j} className="text-purple-400">{word} </span>;
                    }
                    return word + ' ';
                  })}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

// AI Chat preview component
function AIChatPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-50" />
      <div className="relative bg-slate-900/90 rounded-2xl border border-slate-700/50 overflow-hidden backdrop-blur-xl">
        <div className="p-4 space-y-4">
          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[80%] bg-cyan-600/20 border border-cyan-500/30 rounded-2xl rounded-br-md px-4 py-3">
              <p className="text-gray-200 text-sm">Show me top 10 customers by revenue this year</p>
            </div>
          </div>
          
          {/* AI response */}
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-slate-800/50 border border-slate-600/30 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-xs font-medium">AI Generated</span>
              </div>
              <p className="text-gray-200 text-sm mb-2">I've generated the SQL query for you:</p>
              <code className="text-xs text-cyan-300 bg-slate-900/50 px-2 py-1 rounded">SELECT name, SUM(total)...</code>
            </div>
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 bg-slate-800/30 border border-slate-600/30 rounded-xl px-4 py-3">
            <Brain className="w-5 h-5 text-gray-500" />
            <span className="text-gray-500 text-sm">Ask a question about your data...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats component
function Stats() {
  const stats = [
    { value: '100+', label: 'Database Types', icon: Database },
    { value: '10K+', label: 'Queries Generated', icon: Terminal },
    { value: '99.9%', label: 'Uptime', icon: Zap },
    { value: 'Open', label: 'Source', icon: GitBranch }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <div 
          key={i}
          className="relative group p-6 bg-slate-900/50 rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <stat.icon className="w-6 h-6 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
          <div className="text-gray-500 text-sm">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function FuturisticLanding() {
  return (
    <div className="min-h-screen bg-[#020817] text-white overflow-x-hidden">
      {/* Custom styles for animations */}
      <style>{`
        @keyframes dataFlow {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/30 rounded-xl blur-lg group-hover:blur-xl transition-all" />
                <div className="relative p-2.5 bg-slate-900 rounded-xl border border-cyan-500/30">
                  <Database className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                ChatSQL
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm font-medium">Features</a>
              <a href="#preview" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm font-medium">Preview</a>
              <a href="#stats" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm font-medium">Stats</a>
              <a 
                href="https://github.com/ayan-mn18/ChatSQL-ui" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
              <Link
                to="/chat"
                className="relative group px-6 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-cyan-500 to-cyan-600 text-black hover:from-cyan-400 hover:to-cyan-500 transition-all duration-300 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
              >
                Launch App
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <CircuitPattern />
          <DataStream />
          
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          
          {/* Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        {/* Floating database nodes */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          <div className="absolute top-32 left-16"><DatabaseNode delay={0} size="sm" /></div>
          <div className="absolute top-48 right-24"><DatabaseNode delay={500} size="md" /></div>
          <div className="absolute bottom-32 left-32"><DatabaseNode delay={1000} size="lg" /></div>
          <div className="absolute bottom-48 right-16"><DatabaseNode delay={1500} size="sm" /></div>
          
          {/* Connection lines */}
          <ConnectionLine className="top-40 left-28 w-32 rotate-45" />
          <ConnectionLine className="top-56 right-48 w-24 -rotate-12" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-gray-400">Open Source</span>
            <span className="text-gray-600">•</span>
            <span className="text-cyan-400 font-medium">AI-Powered</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight tracking-tight">
            <span className="block text-white mb-2">Query Databases</span>
            <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient bg-300%">
              With Natural Language
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Transform how you interact with databases. ChatSQL uses advanced AI to convert your questions 
            into precise SQL queries, visualize results, and unlock insights from your data.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/chat"
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-lg font-semibold bg-gradient-to-r from-cyan-500 to-cyan-600 text-black hover:from-cyan-400 hover:to-cyan-500 transition-all duration-300 shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_50px_rgba(34,211,238,0.5)]"
            >
              <Terminal className="w-5 h-5" />
              Start Querying
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <a
              href="https://github.com/ayan-mn18/ChatSQL-ui"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-lg font-semibold bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </a>
          </div>

          {/* Tech stack */}
          <div className="mt-16 flex flex-wrap justify-center gap-6 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span>PostgreSQL</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>MySQL</span>
            </div>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span>MongoDB</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>SQLite</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">+ more</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-cyan-400 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful Features for
              <span className="block bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mt-2">
                Modern Data Teams
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to explore, query, and visualize your databases
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon={Brain}
              title="AI Query Generation"
              description="Convert natural language to SQL. No more memorizing complex syntax."
              accentColor="purple"
            />
            <FeatureCard 
              icon={Eye}
              title="Visual Data Explorer"
              description="Browse tables, relationships, and schema with an intuitive interface."
              accentColor="cyan"
            />
            <FeatureCard 
              icon={Table2}
              title="Smart Results"
              description="Auto-generated charts and tables. Export in multiple formats."
              accentColor="emerald"
            />
            <FeatureCard 
              icon={Shield}
              title="Secure & Private"
              description="Your data stays yours. No queries stored, full encryption."
              accentColor="amber"
            />
          </div>

          {/* Additional features grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <FeatureCard 
              icon={Network}
              title="Multi-Database Support"
              description="Connect to PostgreSQL, MySQL, MongoDB, SQLite, and more from a single interface."
              accentColor="cyan"
            />
            <FeatureCard 
              icon={Cpu}
              title="Query Optimization"
              description="AI-powered suggestions to improve query performance and efficiency."
              accentColor="purple"
            />
            <FeatureCard 
              icon={Code2}
              title="Open Source"
              description="Fully open source. Contribute, customize, and self-host freely."
              accentColor="emerald"
            />
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section id="preview" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                From Question to
                <span className="block bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mt-2">
                  Query in Seconds
                </span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Ask questions in plain English. Our AI understands your intent and generates 
                optimized SQL queries instantly. No SQL expertise required.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span>Natural language to SQL conversion</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-purple-400" />
                  </div>
                  <span>Instant query execution and results</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span>Automatic data visualization</span>
                </div>
              </div>
            </div>
            
            <AIChatPreview />
          </div>

          {/* SQL Preview */}
          <div className="mt-24 grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <SQLPreview />
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Complex Queries,
                <span className="block bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mt-2">
                  Made Simple
                </span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Generate JOINs, aggregations, and complex queries without writing a single line. 
                Review, edit, and learn from the generated SQL.
              </p>
              
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
              >
                Try it yourself
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Built for Scale
            </h2>
            <p className="text-xl text-gray-400">
              Trusted by developers and data teams worldwide
            </p>
          </div>
          
          <Stats />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="relative p-12 rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
            
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Data Workflow?
              </h2>
              <p className="text-xl text-gray-400 mb-10">
                Join thousands of developers using ChatSQL to query databases smarter.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/chat"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-lg font-semibold bg-gradient-to-r from-cyan-500 to-cyan-600 text-black hover:from-cyan-400 hover:to-cyan-500 transition-all duration-300 shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                
                <a
                  href="https://github.com/ayan-mn18/ChatSQL-ui"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-lg font-semibold border border-slate-600 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all duration-300"
                >
                  <Github className="w-5 h-5" />
                  Star on GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800/50 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg border border-cyan-500/20">
                <Database className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="font-semibold text-white">ChatSQL</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-500 text-sm">Open Source DB Visualizer</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a 
                href="https://github.com/ayan-mn18/ChatSQL-ui" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <span className="text-sm text-gray-500">
                © 2025 ChatSQL. MIT License.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
