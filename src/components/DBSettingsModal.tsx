import React, { useState } from 'react';
import { X, Database, CheckCircle2, XCircle, Loader2, Bot, Settings as SettingsIcon, Sparkles, Brain, Eye, EyeOff, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Settings, TestConnectionRequest, TestConnectionResponse } from '../types';
import { connectionService } from '../services/connection.service';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Settings) => void;
  initialSettings?: Settings;
}

const DEFAULT_DB_URI = 'postgresql://postgres.ewaasuzfvkbievcclxkh:Ayan@2001@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';
const DEFAULT_DB_NAME = 'Dummy Database';

// Default connection values for dummy database
const DEFAULT_CONNECTION: TestConnectionRequest = {
  host: 'aws-0-ap-south-1.pooler.supabase.com',
  port: 5432,
  db_name: 'postgres',
  username: 'postgres.ewaasuzfvkbievcclxkh',
  password: 'Ayan@2001',
  ssl: true,
};

export default function SettingsModal({ isOpen, onClose, onSave, initialSettings }: SettingsModalProps) {
  // Connection form state
  const [dbName, setDbName] = useState(initialSettings?.dbName || '');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(5432);
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ssl, setSsl] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Legacy URI support (for backwards compatibility)
  const [dbUri, setDbUri] = useState(initialSettings?.dbUri || '');

  // AI Model state
  const [aiModel, setAiModel] = useState<'openai' | 'claude'>(initialSettings?.aiModel || 'openai');

  // UI state
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'error'>('none');
  const [errorMessage, setErrorMessage] = useState('');
  const [useDefaultDb, setUseDefaultDb] = useState(false);
  const [activeTab, setActiveTab] = useState<'database' | 'ai'>('database');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [availableSchemas, setAvailableSchemas] = useState<string[]>([]);

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
      setHost(DEFAULT_CONNECTION.host);
      setPort(DEFAULT_CONNECTION.port);
      setDatabase(DEFAULT_CONNECTION.db_name);
      setUsername(DEFAULT_CONNECTION.username);
      setPassword(DEFAULT_CONNECTION.password);
      setSsl(DEFAULT_CONNECTION.ssl || false);
      setConnectionStatus('success');
      setErrorMessage('');
      setLatencyMs(null);
      setAvailableSchemas([]);
    } else {
      setDbName('');
      setDbUri('');
      setHost('');
      setPort(5432);
      setDatabase('');
      setUsername('');
      setPassword('');
      setSsl(false);
      setConnectionStatus('none');
      setLatencyMs(null);
      setAvailableSchemas([]);
    }
  };

  const testConnection = async () => {
    // Validate required fields
    if (!host.trim() || !database.trim() || !username.trim() || !password.trim()) {
      toast.error('Please fill in all connection fields');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('none');
    setErrorMessage('');
    setLatencyMs(null);
    setAvailableSchemas([]);

    try {
      const connectionData: TestConnectionRequest = {
        host: host.trim(),
        port,
        db_name: database.trim(),
        username: username.trim(),
        password: password.trim(),
        ssl,
      };

      const result: TestConnectionResponse = await connectionService.testConnection(connectionData);

      if (result.success) {
        setConnectionStatus('success');
        setLatencyMs(result.latency_ms || null);
        setAvailableSchemas(result.schemas || []);

        // Build URI for backwards compatibility
        const sslParam = ssl ? '?sslmode=require' : '';
        const uri = `postgresql://${username}:${password}@${host}:${port}/${database}${sslParam}`;
        setDbUri(uri);

        toast.success(`Connection successful! (${result.latency_ms}ms)`, {
          icon: '✅',
          duration: 3000,
        });

        if (result.schemas && result.schemas.length > 0) {
          toast.success(`Found ${result.schemas.length} schema(s): ${result.schemas.join(', ')}`, {
            icon: '📊',
            duration: 4000,
          });
        }
      } else {
        setConnectionStatus('error');
        setErrorMessage(result.message || result.error || 'Failed to connect to database');
        toast.error(result.message || 'Connection failed', {
          duration: 4000,
        });
      }
    } catch (error: any) {
      setConnectionStatus('error');
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Network error: Could not test connection';
      setErrorMessage(message);
      toast.error(message, {
        duration: 4000,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1e293b] rounded-lg shadow-xl w-full max-w-md mx-4 border border-white/10">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-white/10">
          <nav className="flex -mb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('database')}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'database'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-white/20'
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
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-white/20'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Bot className="w-4 h-4" />
                AI Model
              </div>
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-4 max-h-[70vh] overflow-y-auto">
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
                <label htmlFor="useDefaultDb" className="ml-2 block text-sm text-white">
                  Use Dummy database for testing
                </label>
              </div>

              {/* Connection Name */}
              <div>
                <label htmlFor="dbName" className="block text-sm font-medium text-gray-300 mb-1">
                  Connection Name
                </label>
                <input
                  type="text"
                  id="dbName"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  className="w-full px-3 py-2 border border-white/10 bg-[#0f172a] text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-white/5 disabled:text-gray-500"
                  placeholder="My Production DB"
                  required
                  disabled={useDefaultDb}
                />
              </div>

              {/* Host & Port */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label htmlFor="host" className="block text-sm font-medium text-gray-300 mb-1">
                    Host
                  </label>
                  <input
                    type="text"
                    id="host"
                    value={host}
                    onChange={(e) => {
                      setHost(e.target.value);
                      setConnectionStatus('none');
                    }}
                    className="w-full px-3 py-2 border border-white/10 bg-[#0f172a] text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-white/5 disabled:text-gray-500"
                    placeholder="localhost"
                    required
                    disabled={useDefaultDb}
                  />
                </div>
                <div>
                  <label htmlFor="port" className="block text-sm font-medium text-gray-300 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    id="port"
                    value={port}
                    onChange={(e) => {
                      setPort(parseInt(e.target.value) || 5432);
                      setConnectionStatus('none');
                    }}
                    className="w-full px-3 py-2 border border-white/10 bg-[#0f172a] text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-white/5 disabled:text-gray-500"
                    placeholder="5432"
                    required
                    disabled={useDefaultDb}
                  />
                </div>
              </div>

              {/* Database Name */}
              <div>
                <label htmlFor="database" className="block text-sm font-medium text-gray-300 mb-1">
                  Database
                </label>
                <input
                  type="text"
                  id="database"
                  value={database}
                  onChange={(e) => {
                    setDatabase(e.target.value);
                    setConnectionStatus('none');
                  }}
                  className="w-full px-3 py-2 border border-white/10 bg-[#0f172a] text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-white/5 disabled:text-gray-500"
                  placeholder="postgres"
                  required
                  disabled={useDefaultDb}
                />
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setConnectionStatus('none');
                  }}
                  className="w-full px-3 py-2 border border-white/10 bg-[#0f172a] text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-white/5 disabled:text-gray-500"
                  placeholder="postgres"
                  required
                  disabled={useDefaultDb}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setConnectionStatus('none');
                    }}
                    className="w-full px-3 py-2 pr-10 border border-white/10 bg-[#0f172a] text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-white/5 disabled:text-gray-500"
                    placeholder="••••••••"
                    required
                    disabled={useDefaultDb}
                  />
                  {!useDefaultDb && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* SSL Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ssl"
                  checked={ssl}
                  onChange={(e) => {
                    setSsl(e.target.checked);
                    setConnectionStatus('none');
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={useDefaultDb}
                />
                <label htmlFor="ssl" className="ml-2 block text-sm text-white">
                  Use SSL connection
                </label>
              </div>

              {/* Test Connection Button */}
              {!useDefaultDb && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={testConnection}
                    disabled={isTestingConnection || !host.trim() || !database.trim() || !username.trim() || !password.trim()}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${connectionStatus === 'success'
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : connectionStatus === 'error'
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : 'bg-gray-100 text-gray-300 border border-gray-300 hover:bg-gray-200'
                      }`}
                  >
                    {isTestingConnection ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Testing connection...
                      </>
                    ) : connectionStatus === 'success' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Connection successful
                        {latencyMs && (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <Clock className="w-3 h-3" /> {latencyMs}ms
                          </span>
                        )}
                      </>
                    ) : connectionStatus === 'error' ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        Connection failed - Try again
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        Test Connection
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Error Message */}
              {connectionStatus === 'error' && !useDefaultDb && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}

              {/* Success Info - Available Schemas */}
              {connectionStatus === 'success' && !useDefaultDb && availableSchemas.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-medium text-green-700 mb-1">
                    Available Schemas ({availableSchemas.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {availableSchemas.map((schema) => (
                      <span
                        key={schema}
                        className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded"
                      >
                        {schema}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Default DB Success */}
              {useDefaultDb && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className="text-sm text-green-600">Using dummy database for testing</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="aiModel" className="block text-sm font-medium text-gray-300 mb-1">
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
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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