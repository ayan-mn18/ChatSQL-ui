import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sparkles,
  Trash2,
  MessageSquare,
  Loader2,
  PanelRightClose,
  ExternalLink,
  X,
} from 'lucide-react';
import { chatService, ChatMessage, StreamChunk } from '@/services/chat.service';
import { SQLCodeBlock } from '@/components/ui/sql-code-block';
import toast from 'react-hot-toast';

interface ChatPanelProps {
  connectionId: string;
  selectedSchemas: string[];
  connectionName?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  onInsertSQL?: (sql: string) => void;
  /** If true, renders as a full-page standalone chat */
  standalone?: boolean;
  /** If true, hides the external link button */
  hideExternalLink?: boolean;
}

export function ChatPanel({
  connectionId,
  selectedSchemas,
  connectionName,
  isOpen = true,
  onToggle,
  onInsertSQL,
  standalone = false,
  hideExternalLink = false,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef<string>('');

  // Helper function to render formatted text with bold, headings, bullets, etc.
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      const trimmedLine = line.trim();

      // Handle bold headings like **Reasoning:** or **Generated SQL:**
      const boldHeadingMatch = trimmedLine.match(/^\*\*([^*]+):\*\*$/);
      if (boldHeadingMatch) {
        return (
          <div key={lineIdx} className="mt-4 mb-2 first:mt-0">
            <span className="text-[13px] font-bold text-white tracking-wide uppercase">{boldHeadingMatch[1]}:</span>
          </div>
        );
      }

      // Handle regular headings (lines ending with colon)
      if (/^[A-Z][a-zA-Z\s]+:$/.test(trimmedLine)) {
        return (
          <div key={lineIdx} className="mt-4 mb-2 first:mt-0">
            <span className="text-[13px] font-bold text-white tracking-wide uppercase">{trimmedLine}</span>
          </div>
        );
      }

      // Handle bullet points (•, -, or * but NOT ** which is bold)
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('- ') || (trimmedLine.startsWith('* ') && !trimmedLine.startsWith('**'))) {
        const bulletContent = trimmedLine.replace(/^[•\-\*]\s*/, '').trim();
        return (
          <div key={lineIdx} className="flex gap-2.5 ml-0.5 my-1">
            <span className="text-indigo-400 text-lg leading-none">•</span>
            <span className="text-slate-300">{renderInlineFormatting(bulletContent)}</span>
          </div>
        );
      }

      // Handle numbered lists
      if (/^\d+\.\s/.test(trimmedLine)) {
        const match = trimmedLine.match(/^(\d+)\.\s(.*)/);
        if (match) {
          return (
            <div key={lineIdx} className="flex gap-2.5 ml-0.5 my-1">
              <span className="text-indigo-400 font-semibold min-w-[1.5rem] text-right">{match[1]}.</span>
              <span className="text-slate-300">{renderInlineFormatting(match[2])}</span>
            </div>
          );
        }
      }

      // Regular line with inline formatting
      if (trimmedLine) {
        return <div key={lineIdx} className="text-slate-300">{renderInlineFormatting(line)}</div>;
      }

      return null;
    });
  };

  // Helper for inline formatting (bold, code, etc.)
  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        if (content.endsWith(':')) {
          return <strong key={i} className="font-bold text-white">{content}</strong>;
        }
        return <strong key={i} className="font-semibold text-white">{content}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1.5 py-0.5 bg-slate-700/80 rounded text-indigo-300 text-[12px] font-mono">{part.slice(1, -1)}</code>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Load chat session on mount
  useEffect(() => {
    if (connectionId && isOpen) {
      loadChatSession();
    }
  }, [connectionId, isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [messages, streamingContent]);

  const loadChatSession = async () => {
    try {
      const response = await chatService.getOrCreateSession(connectionId);
      if (response.success && response.data) {
        setSessionId(response.data.session.id);
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load chat session:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsStreaming(true);
    setStreamingContent('');
    streamingContentRef.current = '';

    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: sessionId || '',
      role: 'user',
      content: userMessage,
      isError: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    abortControllerRef.current = chatService.streamMessage(
      connectionId,
      userMessage,
      sessionId || undefined,
      selectedSchemas,
      (chunk: StreamChunk) => {
        if (chunk.type === 'session' && chunk.sessionId) {
          setSessionId(chunk.sessionId);
        } else if (chunk.type === 'content' && chunk.content) {
          streamingContentRef.current += chunk.content;
          setStreamingContent(prev => prev + chunk.content);
        } else if (chunk.type === 'done') {
          const fullContent = streamingContentRef.current;
          const assistantMessage: ChatMessage = {
            id: chunk.messageId || `msg-${Date.now()}`,
            sessionId: sessionId || '',
            role: 'assistant',
            content: fullContent,
            sqlGenerated: chunk.sql,
            reasoning: chunk.reasoning,
            tablesUsed: chunk.tablesUsed,
            isError: false,
            createdAt: new Date().toISOString(),
          };
          setMessages(prev => [...prev.filter(m => !m.id.startsWith('temp-')),
          { ...tempUserMessage, id: `user-${Date.now()}` },
            assistantMessage
          ]);
          setStreamingContent('');
          streamingContentRef.current = '';
          setIsStreaming(false);
        } else if (chunk.type === 'error') {
          toast.error(chunk.error || 'Chat failed');
          setIsStreaming(false);
          streamingContentRef.current = '';
        }
      },
      (error) => {
        toast.error(error.message || 'Chat failed');
        setIsStreaming(false);
        streamingContentRef.current = '';
      },
      () => {
        setIsStreaming(false);
      }
    );
  };

  const handleClearChat = async () => {
    try {
      const response = await chatService.clearSession(connectionId);
      if (response.success && response.data) {
        setSessionId(response.data.session.id);
        setMessages([]);
        toast.success('Chat cleared');
      }
    } catch (error) {
      toast.error('Failed to clear chat');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInsertSQL = (sql: string) => {
    if (onInsertSQL) {
      onInsertSQL(sql);
    } else {
      // For standalone, copy to clipboard
      navigator.clipboard.writeText(sql);
      toast.success('SQL copied to clipboard');
    }
  };

  const handleClose = () => {
    if (standalone) {
      window.close();
    } else if (onToggle) {
      onToggle();
    }
  };

  // Collapsed state button (only for sidebar mode)
  if (!standalone && !isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="fixed right-4 top-20 z-50 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
        onClick={onToggle}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Chat
      </Button>
    );
  }

  // Render message content with SQL code blocks
  const renderMessageContent = (content: string) => {
    return content.split('\n\n').map((paragraph, idx) => {
      if (!paragraph.trim()) return null;

      // Check if paragraph contains a SQL code block
      if (paragraph.includes('```sql')) {
        const codeMatch = paragraph.match(/```sql\n?([\s\S]*?)\n?```/);
        if (codeMatch) {
          const sqlCode = codeMatch[1].trim();
          const beforeCode = paragraph.split('```sql')[0].trim();
          const afterCode = paragraph.split('```')[2]?.trim();
          return (
            <div key={idx} className="space-y-3">
              {beforeCode && (
                <p className="whitespace-pre-wrap break-words">{renderFormattedText(beforeCode)}</p>
              )}
              <SQLCodeBlock
                code={sqlCode}
                showLineNumbers={sqlCode.split('\n').length > 1}
                showInsertButton={!!onInsertSQL}
                showCopyButton={!onInsertSQL}
                onInsert={handleInsertSQL}
                maxHeight={standalone ? '300px' : '250px'}
              />
              {afterCode && (
                <p className="whitespace-pre-wrap break-words">{renderFormattedText(afterCode)}</p>
              )}
            </div>
          );
        }
      }

      // Handle regular text with formatting
      return (
        <div key={idx} className="whitespace-pre-wrap break-words">
          {renderFormattedText(paragraph)}
        </div>
      );
    });
  };

  // Standalone full-page layout
  if (standalone) {
    return (
      <div className="flex flex-col h-screen bg-slate-900 text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-slate-800 shrink-0 bg-slate-900/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">AI Chat Assistant</h1>
              {connectionName && (
                <p className="text-xs text-slate-400">{connectionName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto px-6 py-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 && !isStreaming && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-medium text-white mb-2">Welcome to AI Chat Assistant</h2>
                  <p className="text-slate-400 text-center mb-6 max-w-md">
                    Ask me anything about your database. I can help you explore tables, generate SQL queries, and more.
                  </p>
                  <div className="w-full max-w-sm space-y-2">
                    <button
                      onClick={() => setInputValue("What tables do I have?")}
                      className="w-full text-left px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-sm text-slate-400 hover:text-slate-300 transition-colors border border-slate-700/50"
                    >
                      "What tables do I have?"
                    </button>
                    <button
                      onClick={() => setInputValue("Show me recent orders")}
                      className="w-full text-left px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-sm text-slate-400 hover:text-slate-300 transition-colors border border-slate-700/50"
                    >
                      "Show me recent orders"
                    </button>
                    <button
                      onClick={() => setInputValue("Count users by status")}
                      className="w-full text-left px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-sm text-slate-400 hover:text-slate-300 transition-colors border border-slate-700/50"
                    >
                      "Count users by status"
                    </button>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] ${msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-3'
                      : 'text-slate-300 py-2'
                      }`}
                  >
                    <div className="text-sm leading-relaxed space-y-1">
                      {msg.content && renderMessageContent(msg.content)}
                    </div>

                    {/* SQL Insert/Copy Button - show if there's sqlGenerated but no code block in content */}
                    {msg.role === 'assistant' && msg.sqlGenerated && !msg.content?.includes('```sql') && (
                      <div className="mt-3">
                        <SQLCodeBlock
                          code={msg.sqlGenerated}
                          showLineNumbers={msg.sqlGenerated.split('\n').length > 1}
                          showCopyButton
                          maxHeight="300px"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isStreaming && streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] text-slate-300 py-2">
                    <div className="text-sm leading-relaxed space-y-1">
                      {renderMessageContent(streamingContent)}
                      <span className="animate-pulse text-indigo-400">▌</span>
                    </div>
                  </div>
                </div>
              )}

              {isStreaming && !streamingContent && (
                <div className="flex justify-start">
                  <div className="py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                      <span className="text-sm text-slate-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-900/95 backdrop-blur">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or request a SQL query..."
              className="flex-1 bg-slate-800 border-slate-700 focus:border-indigo-500/50 text-slate-200 text-sm placeholder:text-slate-500 min-h-[52px] max-h-[150px] resize-none rounded-xl"
              disabled={isStreaming}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isStreaming}
              className="h-[52px] px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40"
            >
              {isStreaming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar layout (default)
  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 min-w-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-200 text-sm">Chat</span>
        </div>
        <div className="flex items-center">
          {!hideExternalLink && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const schemas = selectedSchemas.join(',');
                    const url = `/chat/${connectionId}?schemas=${encodeURIComponent(schemas)}`;
                    window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                  }}
                  className="h-7 w-7 p-0 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in New Window</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleClearChat} className="h-7 w-7 p-0 text-slate-500 hover:text-slate-300 hover:bg-slate-800">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear Chat</TooltipContent>
          </Tooltip>
          {onToggle && (
            <Button variant="ghost" size="sm" onClick={onToggle} className="h-7 w-7 p-0 text-slate-500 hover:text-slate-300 hover:bg-slate-800">
              <PanelRightClose className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto px-3 py-4">
          <div className="space-y-4">
            {messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center py-8 px-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-400 text-center mb-4">Ask anything about your database</p>
                <div className="w-full space-y-1.5">
                  <button
                    onClick={() => setInputValue("What tables do I have?")}
                    className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    "What tables do I have?"
                  </button>
                  <button
                    onClick={() => setInputValue("Show me recent orders")}
                    className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    "Show me recent orders"
                  </button>
                  <button
                    onClick={() => setInputValue("Count users by status")}
                    className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    "Count users by status"
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm px-3.5 py-2.5'
                    : 'text-slate-300 py-2'
                    }`}
                >
                  <div className="text-sm leading-relaxed space-y-1">
                    {msg.content && renderMessageContent(msg.content)}
                  </div>

                  {/* SQL Insert Button - show if there's sqlGenerated but no code block in content */}
                  {msg.role === 'assistant' && msg.sqlGenerated && !msg.content?.includes('```sql') && (
                    <div className="mt-3">
                      <SQLCodeBlock
                        code={msg.sqlGenerated}
                        showLineNumbers={msg.sqlGenerated.split('\n').length > 1}
                        showInsertButton={!!onInsertSQL}
                        showCopyButton={!onInsertSQL}
                        onInsert={handleInsertSQL}
                        maxHeight="200px"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isStreaming && streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[90%] text-slate-300 py-2">
                  <div className="text-sm leading-relaxed space-y-1">
                    {renderMessageContent(streamingContent)}
                    <span className="animate-pulse text-indigo-400">▌</span>
                  </div>
                </div>
              </div>
            )}

            {isStreaming && !streamingContent && (
              <div className="flex justify-start">
                <div className="py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    <span className="text-sm text-slate-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800 shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything or request a SQL query..."
            className="flex-1 bg-slate-800 border-slate-700 focus:border-slate-600 text-slate-200 text-sm placeholder:text-slate-500 min-h-[44px] max-h-[120px] resize-none rounded-lg"
            disabled={isStreaming}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isStreaming}
            className="h-[44px] px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-40"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
