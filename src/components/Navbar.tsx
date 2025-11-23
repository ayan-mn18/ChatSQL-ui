import { Link } from 'react-router-dom';
import { Database, Settings as SettingsIcon } from 'lucide-react';

interface NavbarProps {
  showSettings?: boolean;
  onSettingsClick?: () => void;
  settingsStatus?: {
    hasDbUri: boolean;
    showTooltip: boolean;
  };
  darkMode?: boolean;
}

export default function Navbar({ showSettings, onSettingsClick, settingsStatus, darkMode = false }: NavbarProps) {
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${darkMode
        ? 'bg-transparent backdrop-blur-sm border-b border-white/5'
        : 'bg-white/80 backdrop-blur-md border-b border-gray-200'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <div className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-blue-500/10 group-hover:bg-blue-500/20' : 'bg-blue-50'}`}>
              <Database className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <span className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              ChatSQL
            </span>
          </Link>

          {showSettings ? (
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={onSettingsClick}
                  onMouseEnter={() => !settingsStatus?.hasDbUri}
                  onMouseLeave={() => !settingsStatus?.hasDbUri}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${settingsStatus?.hasDbUri
                    ? darkMode
                      ? 'bg-slate-900/50 text-gray-200 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
                    }`}
                >
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </button>

                {settingsStatus?.showTooltip && !settingsStatus?.hasDbUri && (
                  <div className="absolute right-0 mt-2 w-64 px-4 py-2 bg-red-100 text-red-700 text-sm rounded-md shadow-lg z-50 border border-red-200">
                    Please configure your database settings to start querying
                    <div className="absolute -top-2 right-4 w-4 h-4 bg-red-100 border-t border-l border-red-200 transform rotate-45"></div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className={`text-sm font-medium hover:text-blue-400 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Features</a>
              <a href="#product" className={`text-sm font-medium hover:text-blue-400 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Product</a>
              <a href="#contact" className={`text-sm font-medium hover:text-blue-400 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Contact</a>
              <Link
                to="/chat"
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${darkMode
                    ? 'bg-white text-black hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                Launch App
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}