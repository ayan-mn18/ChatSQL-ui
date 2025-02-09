import React, { useState } from 'react';
import { X, Database, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface DBSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { dbName: string; dbUri: string }) => void;
  initialSettings?: { dbName: string; dbUri: string };
}

const DEFAULT_DB_URI = 'postgresql://postgres.ewaasuzfvkbievcclxkh:Ayan@2001@aws-0-ap-south-1.pooler.supabase.com:6543/pagila';
const DEFAULT_DB_NAME = 'Dummy Database';
const MASKED_DB_URI = '********************';

export default function DBSettingsModal({ isOpen, onClose, onSave, initialSettings }: DBSettingsModalProps) {
  const [dbName, setDbName] = useState(initialSettings?.dbName || '');
  const [dbUri, setDbUri] = useState(initialSettings?.dbUri || '');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'error'>('none');
  const [errorMessage, setErrorMessage] = useState('');
  const [useDefaultDb, setUseDefaultDb] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useDefaultDb || connectionStatus === 'success') {
      onSave({
        dbName: useDefaultDb ? DEFAULT_DB_NAME : dbName,
        dbUri: useDefaultDb ? DEFAULT_DB_URI : dbUri,
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
      const response = await fetch('http://localhost:8080/api/testConnection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uri: dbUri }),
      });

      const result = await response.json();

      if (response.ok) {
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
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Database Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
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
                Use default database
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