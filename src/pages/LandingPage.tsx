import { Link } from 'react-router-dom';
import { MessageSquare, Users, ArrowRight, Github, Twitter, Linkedin, Database } from 'lucide-react';
import { ContactForm, Navbar } from '../components';

export default function LandingPage() {
  return (
    <div className="max-h-[300vh] bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Talk to Your Database <br />
              <span className="text-blue-600">Like a Human</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Transform your database interactions with natural language queries.
              Get insights faster, easier, and more intuitively than ever before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/chat"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                Try It Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors text-lg font-medium"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose ChatSQL?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Natural Language Queries</h3>
              <p className="text-gray-600">
                Ask questions in plain English and get your answers instantly. No SQL knowledge required.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Data Analysis</h3>
              <p className="text-gray-600">
                Get intelligent insights and visualizations from your data automatically.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Friendly</h3>
              <p className="text-gray-600">
                Perfect for teams of all technical levels. Democratize data access in your organization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section id="product" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Powerful Features for Data Analysis
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Instant Visual Insights
                    </h3>
                    <p className="text-gray-600">
                      Automatically generate charts and graphs from your query results.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Query Optimization
                    </h3>
                    <p className="text-gray-600">
                      AI-powered query optimization for faster results.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Export & Share
                    </h3>
                    <p className="text-gray-600">
                      Export results in multiple formats and share insights with your team.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-8 aspect-video">
              <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                Product Demo Video
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Get in Touch
            </h2>
            <p className="text-gray-600 mb-8">
              Have questions about ChatSQL? We're here to help! Reach out to our team.
            </p>
            <div className="flex justify-center gap-6 mb-12">
              <a href="https://github.com/ayan-mn18" target='_blank' className="text-gray-600 hover:text-gray-900">
                <Github className="w-6 h-6" />
              </a>
              <a href="https://x.com/AyanMn18" target='_blank' className="text-gray-600 hover:text-gray-900">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="https://www.linkedin.com/in/ayan-mn18/" target='_blank' className="text-gray-600 hover:text-gray-900">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
            < ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">ChatSQL</span>
            </div>
            <div className="text-sm text-gray-600">
              © 2025 ChatSQL. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}