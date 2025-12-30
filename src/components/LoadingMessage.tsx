
import { Bot } from 'lucide-react';

export default function LoadingMessage() {
  return (
    <div className="flex gap-4 p-4 bg-[#1e293b]/30">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-green-400" />
        </div>
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-400 mb-1">
          Assistant • Processing
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-gray-400">Please wait a few seconds</span>
        </div>
      </div>
    </div>
  );
}