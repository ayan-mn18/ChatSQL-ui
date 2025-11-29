import React, { useState } from 'react';
import { X, Database, CheckCircle2, XCircle, Loader2, Bot, Settings as SettingsIcon, Sparkles, Brain } from 'lucide-react';
import { Settings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Settings) => void;
  initialSettings?: Settings;
}

const DEFAULT_DB_URI = 'postgresql://postgres.ewaasuzfvkbievcclxkh:Ayan@2001@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';
const DEFAULT_DB_NAME = 'Dummy Database';
const MASKED_DB_URI = '********************';

export default function SettingsModal({ isOpen, onClose, onSave, initialSettings }: SettingsModalProps) {
  const [dbName, setDbName] = useState(initialSettings?.dbName || '');
  const [dbUri, setDbUri] = useState(initialSettings?.dbUri || '');
  const [aiModel, setAiModel] = useState<'openai' | 'claude'>(initialSettings?.aiModel || 'openai');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'error'>('none');
  const [errorMessage, setErrorMessage] = useState('');
  const [useDefaultDb, setUseDefaultDb] = useState(false);
  const [activeTab, setActiveTab] = useState<'database' | 'ai'>('database');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useDefaultDb || connectionStatus === 'success') {
      onSave({
        dbName: useDefaultDb ? DEFAULT_DB_NAME : dbName,
        dbUri: useDefaultDb ? DEFAULT_DB_URI : dbUri,
        aiModel,
      });
      onClose();
    }
  };

  const handleUseDefaultDb = (checked: boolean) => {
    setUseDefaultDb(checked);
    if (checked) {
      setDbName(DEFAULT_DB_NAME);
      setDbUri(DEFAULT_DB_URI);
      setConnectionStatus('success');
      setErrorMessage('');
    } else {
      setDbName('');
      setDbUri('');
      setConnectionStatus('none');
    }
  };

  const testConnection = async () => {
    if (!dbUri.trim()) return;

    setIsTestingConnection(true);
    setConnectionStatus('none');
    setErrorMessage('');

    try {
      // const connUrl = 'http://localhost:8080/api/testConnection';
      const connUrl = 'https://api.sql.bizer.dev/api/testConnection';
      const response = await fetch(connUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uri: dbUri }),
      });

      const result = await response.json();

      if (result.connection) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setErrorMessage(result.error || 'Failed to connect to database');
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage('Network error: Could not test connection');
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('database')}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'database'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Database className="w-4 h-4" />
                Database
              </div>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'ai'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Bot className="w-4 h-4" />
                AI Model
              </div>
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {activeTab === 'database' ? (
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="useDefaultDb"
                  checked={useDefaultDb}
                  onChange={(e) => handleUseDefaultDb(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="useDefaultDb" className="ml-2 block text-sm text-gray-900">
                  Use Dummy database for testing
                </label>
              </div>

              <div>
                <label htmlFor="dbName" className="block text-sm font-medium text-gray-700 mb-1">
                  Database Name
                </label>
                <input
                  type="text"
                  id="dbName"
                  value={useDefaultDb ? DEFAULT_DB_NAME : dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Enter database name"
                  required
                  disabled={useDefaultDb}
                />
              </div>

              <div>
                <label htmlFor="dbUri" className="block text-sm font-medium text-gray-700 mb-1">
                  Database URI
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="dbUri"
                    value={useDefaultDb ? MASKED_DB_URI : dbUri}
                    onChange={(e) => {
                      setDbUri(e.target.value);
                      setConnectionStatus('none');
                    }}
                    disabled={isTestingConnection || useDefaultDb}
                    className={`w-full px-3 py-2 pr-24 border rounded-md shadow-sm focus:ring-2 focus:ring-opacity-50 disabled:bg-gray-100 disabled:text-gray-500 ${useDefaultDb
                      ? 'border-green-500'
                      : connectionStatus === 'success'
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
                        : connectionStatus === 'error'
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                      }`}
                    placeholder="Enter connection URI"
                    required
                  />
                  {!useDefaultDb && (
                    <button
                      type="button"
                      onClick={testConnection}
                      disabled={isTestingConnection || !dbUri.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium rounded-md 
                        focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                        bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      {isTestingConnection ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : connectionStatus === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : connectionStatus === 'error' ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        'Test'
                      )}
                    </button>
                  )}
                </div>
                {connectionStatus === 'error' && !useDefaultDb && (
                  <div className="mt-1 text-sm text-red-600">
                    {errorMessage}
                  </div>
                )}
                {(connectionStatus === 'success' || useDefaultDb) && (
                  <div className="mt-1 text-sm text-green-600">
                    Connection successful!
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="aiModel" className="block text-sm font-medium text-gray-700 mb-1">
                  AI Model
                </label>
                <div className="relative">
                  <select
                    id="aiModel"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value as 'openai' | 'claude')}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  >
                    <option value="openai">OpenAI (Default)</option>
                    <option value="claude">Claude</option>
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {aiModel === 'openai' ? (
                      <Sparkles className="w-4 h-4 text-green-600" />
                    ) : (
                      <Brain className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Select the AI model that will process your database queries
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!useDefaultDb && connectionStatus !== 'success'}
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${useDefaultDb || connectionStatus === 'success'
                ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}