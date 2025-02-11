import React from 'react';
import { Message } from '../types';
import { User, Bot, Database, ArrowRight, Lightbulb, Table2, Columns, Copy, Download, Check } from 'lucide-react';
import DataVisualization from './DataVisualization';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);

  console.log("message: ", message.result)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadData = (data: any[], filename: string) => {
    // Convert data to CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const cell = row[header]?.toString() || '';
        return cell.includes(',') ? `"${cell}"` : cell;
      }).join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm font-medium">SQL Query</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(message.result?.info.query!)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-400 hover:text-white bg-gray-800 rounded transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy SQL
                          </>
                        )}
                      </button>
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

                {message.result.data.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
                        // 
                        onClick={() => downloadData(message.result?.data || [], 'query_results')}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Download className="w-4 h-4" />
                        Download CSV
                      </button>
                    </div>
                    {/* <DataTable data={message.result.data} columns={message.result.info.columns} /> */}
                    <DataVisualization data={message.result.data} />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}