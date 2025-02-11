import React, { useState, useRef, useEffect } from 'react';
import { Message, QueryRequest } from './types';
import ChatMessage from './components/ChatMessage';
import { Send, Settings } from 'lucide-react';
import LoadingMessage from './components/LoadingMessage';
import DBSettingsModal from './components/DBSettingsModal';
import SampleQueries from './components/SampleQueries';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dbSettings, setDbSettings] = useState(() => {
    const savedSettings = localStorage.getItem('dbSettings');
    return savedSettings ? JSON.parse(savedSettings) : { dbName: '', dbUri: '' };
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const [showSampleQueries, setShowSampleQueries] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setShowSampleQueries(false);

    if (!dbSettings.dbUri) {
      setIsSettingsOpen(true);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Please configure your database settings before running queries.',
        timestamp: new Date(),
        result: {
          data: [],
          info: {
            error: 'Database not configured',
            columns: []
          }
        },
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // const getResultsApiUrl = 'http://localhost:8080/api/getResult';
      const getResultsApiUrl = 'https://api.chatsql.ayanmn18.live/api/getResult';
      const response = await fetch(getResultsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input,
          uri: dbSettings.dbUri,
        } as QueryRequest),
      });

      if (response.status !== 200) {
        throw new Error("Cannot procss the query")
      }

      const result = await response.json();

      console.log("Response from BE: ", result)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Here are the results of your query:',
        timestamp: new Date(),
        result: result,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error executing your query.',
        timestamp: new Date(),
        result: {
          data: [],
          info: {
            error: error instanceof Error ? error.message : 'Unknown error',
            columns: []
          }
        },
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = (settings: { dbName: string; dbUri: string }) => {
    setDbSettings(settings);
    setIsSettingsOpen(false);
    setShowTooltip(false);
  };

  const handleSampleQueryClick = (query: string) => {
    setInput(query);
    setShowSampleQueries(false);
  };


  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">
          ChatSQL</h1>
        <div className="relative">
          <button
            onClick={() => setIsSettingsOpen(true)}
            onMouseEnter={() => !dbSettings.dbUri && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${dbSettings.dbUri
              ? 'text-gray-700 border-gray-300 hover:bg-gray-50'
              : 'text-red-600 border-red-300 hover:bg-red-50'
              }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>

          {showTooltip && !dbSettings.dbUri && (
            <div className="absolute right-0 mt-2 w-64 px-4 py-2 bg-red-100 text-red-700 text-sm rounded-md shadow-lg z-50 border border-red-200">
              Please configure your database settings to start querying
              <div className="absolute -top-2 right-4 w-4 h-4 bg-red-100 border-t border-l border-red-200 transform rotate-45"></div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {!dbSettings.dbUri ? (
            <div className="text-center text-gray-500 mt-8">
              Please configure your database settings first
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              Start by entering a database query or question
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && <LoadingMessage />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto p-4">
          {dbSettings.dbUri && messages.length === 0 && showSampleQueries && (
            <SampleQueries onQueryClick={handleSampleQueryClick} />
          )}
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={dbSettings.dbUri ? "Enter your query or question..." : "Configure database settings first"}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Running...' : 'Send'}
            </button>
          </form>
        </div>
      </footer>

      <DBSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        initialSettings={dbSettings}
      />
    </div>
  );
}

export default App;