
import { Message } from '../types';
import { User, Bot, Database, ArrowRight, Lightbulb, Table2, Columns } from 'lucide-react';
import DataVisualization from './DataVisualization';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`flex gap-4 p-4 ${message.role === 'assistant' ? 'bg-gray-50' : ''}`}>
      <div className="flex-shrink-0">
        {message.role === 'user' ? (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
        ) : (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-green-600" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-500 mb-1">
          {message.role === 'user' ? 'You' : 'Assistant'} • {new Date(message.timestamp).toLocaleTimeString()}
        </div>
        <div className="text-gray-900">{message.content}</div>
        {message.result && (
          <div className="mt-4 space-y-4">
            {message.result.info.error ? (
              <div className="text-red-600 bg-red-50 p-3 rounded">
                Error: {message.result.info.error}
              </div>
            ) : (
              <>
                {message.result.info.desc && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-blue-900 mb-1">Query Description</h3>
                        <p className="text-blue-800">{message.result.info.desc}</p>
                      </div>
                    </div>
                  </div>
                )}

                {message.result.info.query && (
                  <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-sm font-medium">SQL Query</span>
                    </div>
                    <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">{message.result.info.query}</pre>
                  </div>
                )}

                {message.result.info.reasoning && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <ArrowRight className="w-4 h-4 text-gray-600" />
                          Query Steps
                        </h3>
                        <ol className="list-decimal list-inside space-y-1 text-gray-700">
                          {message.result.info.reasoning.steps.map((step, index) => (
                            <li key={index} className="text-sm">{step}</li>
                          ))}
                        </ol>
                      </div>

                      <div>
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-gray-600" />
                          Optimization Notes
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {message.result.info.reasoning.optimization_notes.map((note, index) => (
                            <li key={index} className="text-sm">{note}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {(message.result.info.tables_used || message.result.info.columns_used) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {message.result.info.tables_used && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Table2 className="w-4 h-4 text-gray-600" />
                          Tables Used
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {message.result.info.tables_used.map((table) => (
                            <span key={table} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm">
                              {table}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.result.info.columns_used && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Columns className="w-4 h-4 text-gray-600" />
                          Columns Used
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {message.result.info.columns_used.map((column) => (
                            <span key={column} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm">
                              {column}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* <DataTable data={message.result.data} columns={message.result.columns} /> */}
                <DataVisualization data={message.result.data} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}