import { Link } from 'react-router-dom';
import { MessageSquare, Users, ArrowRight, Github, Twitter, Linkedin, Database } from 'lucide-react';
import { ContactForm, Navbar } from '../components';
import Globe from '../components/ui/Globe';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white overflow-x-hidden selection:bg-blue-500/30">
      <Navbar darkMode={true} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-0 px-4 min-h-screen flex flex-col items-center justify-start overflow-hidden">
        {/* Background Grid & Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full opacity-50"></div>

          {/* Shooting Stars */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px]">
            <div className="absolute top-10 right-10 w-1 h-1 bg-white rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.1)] animate-meteor"></div>
            <div className="absolute top-20 right-40 w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_0_4px_rgba(59,130,246,0.1)] animate-meteor delay-700"></div>
            <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full shadow-[0_0_0_4px_rgba(168,85,247,0.1)] animate-meteor delay-1000"></div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto w-full relative text-center flex flex-col items-center mt-10 md:mt-20 hero-texts">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-blue-300 mb-8 backdrop-blur-sm animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            v2.0 is now live
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-[1.1] tracking-tight">
            Data intelligence, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 animate-gradient bg-300%">
              reimagined.
            </span>
          </h1>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link
              to="/chat"
              className="group relative inline-flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-full hover:bg-gray-100 transition-all duration-300 text-lg font-medium overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Querying
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>

            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white border border-white/10 hover:bg-white/5 transition-all text-lg font-medium backdrop-blur-sm"
            >
              View Demo
            </a>
          </div>
        </div>

        {/* Globe Container - Positioned absolutely at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[600px] overflow-hidden flex justify-center items-end z-10 pointer-events-none"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent, black 25%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25%)'
          }}
        >
          <div className="w-[800px] h-[800px] md:w-[2400px] md:h-[2400px] relative translate-y-[70%]">
            <Globe className="w-full h-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
            Why Choose ChatSQL?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-colors group">
              <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                <MessageSquare className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Natural Language</h3>
              <p className="text-gray-400 leading-relaxed">
                Ask questions in plain English and get your answers instantly. No SQL knowledge required.
              </p>
            </div>
            <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 hover:border-green-500/50 transition-colors group">
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-500/20 transition-colors">
                <Database className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Smart Analysis</h3>
              <p className="text-gray-400 leading-relaxed">
                Get intelligent insights and visualizations from your data automatically.
              </p>
            </div>
            <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition-colors group">
              <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <Users className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Team Friendly</h3>
              <p className="text-gray-400 leading-relaxed">
                Perfect for teams of all technical levels. Democratize data access in your organization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section id="product" className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
                Powerful Features for <br />
                <span className="text-blue-400">Data Analysis</span>
              </h2>
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Instant Visual Insights
                    </h3>
                    <p className="text-gray-400">
                      Automatically generate charts and graphs from your query results.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Query Optimization
                    </h3>
                    <p className="text-gray-400">
                      AI-powered query optimization for faster results.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Export & Share
                    </h3>
                    <p className="text-gray-400">
                      Export results in multiple formats and share insights with your team.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 rounded-2xl p-1 border border-slate-800 shadow-2xl">
              <div className="bg-slate-950 rounded-xl aspect-video flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5"></div>
                <div className="text-gray-500 text-sm font-medium flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:scale-110 transition-transform cursor-pointer">
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                  </div>
                  <span>Watch Demo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Get in Touch
            </h2>
            <p className="text-gray-400 mb-10 text-lg">
              Have questions about ChatSQL? We're here to help! Reach out to our team.
            </p>
            <div className="flex justify-center gap-8 mb-16">
              <a href="https://github.com/ayan-mn18" target='_blank' className="text-gray-400 hover:text-white transition-colors transform hover:scale-110">
                <Github className="w-8 h-8" />
              </a>
              <a href="https://x.com/AyanMn18" target='_blank' className="text-gray-400 hover:text-white transition-colors transform hover:scale-110">
                <Twitter className="w-8 h-8" />
              </a>
              <a href="https://www.linkedin.com/in/ayan-mn18/" target='_blank' className="text-gray-400 hover:text-white transition-colors transform hover:scale-110">
                <Linkedin className="w-8 h-8" />
              </a>
            </div>
            <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-white">ChatSQL</span>
            </div>
            <div className="text-sm text-gray-500">
              © 2025 ChatSQL. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}