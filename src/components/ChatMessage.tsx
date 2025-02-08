import { Message } from '../types';
import { User, Bot } from 'lucide-react';
import DataTable from './DataTable';
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
          <div className="mt-4">
            {message.result.error ? (
              <div className="text-red-600 bg-red-50 p-3 rounded">
                Error: {message.result.error}
              </div>
            ) : (
              <>
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