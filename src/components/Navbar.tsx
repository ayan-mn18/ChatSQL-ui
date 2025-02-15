import { Link } from 'react-router-dom';
import { Database, Settings as SettingsIcon } from 'lucide-react';

interface NavbarProps {
  showSettings?: boolean;
  onSettingsClick?: () => void;
  settingsStatus?: {
    hasDbUri: boolean;
    showTooltip: boolean;
  };
}

export default function Navbar({ showSettings, onSettingsClick, settingsStatus }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">ChatSQL</span>
          </Link>

          {showSettings ? (
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={onSettingsClick}
                  onMouseEnter={() => !settingsStatus?.hasDbUri}
                  onMouseLeave={() => !settingsStatus?.hasDbUri}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${settingsStatus?.hasDbUri
                      ? 'text-gray-700 border-gray-300 hover:bg-gray-50'
                      : 'text-red-600 border-red-300 hover:bg-red-50'
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
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#product" className="text-gray-600 hover:text-gray-900">Product</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
              <Link
                to="/chat"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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