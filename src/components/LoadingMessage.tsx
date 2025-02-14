
import { Bot } from 'lucide-react';

export default function LoadingMessage() {
  return (
    <div className="flex gap-4 p-4 bg-gray-50">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-green-600" />
        </div>
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-500 mb-1">
          Assistant • Processing
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-gray-600">Please wait a few seconds</span>
        </div>
      </div>
    </div>
  );
}