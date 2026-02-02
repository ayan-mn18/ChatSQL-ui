import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Trash2,
  Copy,
  Download,
  MessageSquare,
  Loader2,
  Code,
  X,
} from 'lucide-react';
import { chatService, ChatMessage, StreamChunk } from '@/services/chat.service';
import { connectionService } from '@/services/connection.service';
import { DatabaseSchemaPublic } from '@/types';
import { SQLCodeBlock } from '@/components/ui/sql-code-block';
import toast from 'react-hot-toast';

export default function StandaloneChatPage() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const [searchParams] = useSearchParams();
  const selectedSchemas = searchParams.get('schemas')?.split(',') || [];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectionName, setConnectionName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef<string>('');

  // Load connection info and chat session
  useEffect(() => {
    if (connectionId) {
      loadConnectionInfo();
      loadChatSession();
    }
  }, [connectionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [messages, streamingContent]);

  const loadConnectionInfo = async () => {
    try {
      const response = await connectionService.getConnection(connectionId!);
      if (response.success && response.data) {
        setConnectionName(response.data.name);
      }
    } catch (error) {
      console.error('Failed to load connection info:', error);
    }
  };

  const loadChatSession = async () => {
    try {
      const response = await chatService.getOrCreateSession(connectionId!);
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
      connectionId!,
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
      const response = await chatService.clearSession(connectionId!);
      if (response.success && response.data) {
        setSessionId(response.data.session.id);
        setMessages([]);
        toast.success('Chat cleared');
      }
    } catch (error) {
      toast.error('Failed to clear chat');
    }
  };

  const handleCopySQL = (sql: string) => {
    navigator.clipboard.writeText(sql);
    toast.success('SQL copied to clipboard');
  };

  const handleSaveSQL = (sql: string, filename?: string) => {
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `query-${Date.now()}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('SQL saved to file');
  };

  // Helper function to render formatted text with bold
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0f172a]">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="text-lg font-semibold">AI Chat Assistant</h1>
            <p className="text-sm text-gray-400">{connectionName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="text-gray-400 hover:text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Chat
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.length === 0 && !isStreaming && (
              <div className="text-center text-gray-500 py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h2 className="text-xl font-medium mb-2">Welcome to AI Chat Assistant</h2>
                <div className="text-sm space-y-2 text-gray-600 max-w-md mx-auto">
                  <p>💬 Ask me anything about your database</p>
                  <p>🔍 Request SQL queries when you need them</p>
                  <p>📋 Copy or save generated SQL queries</p>
                  <p className="mt-4 italic">Try: "What tables do I have?" or "Show me all users"</p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-4 ${msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1e293b] text-gray-200'
                    }`}
                >
                  <div className="text-sm space-y-3">
                    {msg.content && msg.content.split('\n\n').map((paragraph, idx) => {
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
                                showCopyButton
                                maxHeight="300px"
                              />
                              {afterCode && (
                                <p className="whitespace-pre-wrap break-words">{renderFormattedText(afterCode)}</p>
                              )}
                            </div>
                          );
                        }
                      }

                      // Handle regular text with bold formatting
                      return (
                        <p key={idx} className="whitespace-pre-wrap break-words">
                          {renderFormattedText(paragraph)}
                        </p>
                      );
                    })}
                  </div>

                  {/* Show SQL actions if there's sqlGenerated but no code block in content */}
                  {msg.role === 'assistant' && msg.sqlGenerated && !msg.content?.includes('```sql') && (
                    <div className="mt-4">
                      <SQLCodeBlock
                        code={msg.sqlGenerated}
                        showLineNumbers={msg.sqlGenerated.split('\n').length > 1}
                        showCopyButton
                        maxHeight="300px"
                      />
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-green-500/40 text-green-200 hover:bg-green-500/10"
                          onClick={() => handleSaveSQL(msg.sqlGenerated!)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Save to File
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isStreaming && streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg p-4 bg-[#1e293b] text-gray-200">
                  <div className="text-sm space-y-3">
                    {streamingContent.split('\n\n').map((paragraph, idx) => {
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
                                showCopyButton
                                maxHeight="300px"
                              />
                              {afterCode && (
                                <p className="whitespace-pre-wrap break-words">{renderFormattedText(afterCode)}</p>
                              )}
                            </div>
                          );
                        }
                      }

                      // Handle regular text with bold formatting
                      return (
                        <p key={idx} className="whitespace-pre-wrap break-words">
                          {renderFormattedText(paragraph)}
                        </p>
                      );
                    })}
                    <span className="animate-pulse text-blue-400">▌</span>
                  </div>
                </div>
              </div>
            )}

            {isStreaming && !streamingContent && (
              <div className="flex justify-start">
                <div className="bg-[#1e293b] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-3">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything or request a SQL query..."
            className="flex-1 bg-[#1e293b] border-white/10 text-white placeholder:text-gray-500 min-h-[60px] max-h-[120px] resize-none"
            disabled={isStreaming}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isStreaming}
            className="bg-blue-600 text-white hover:bg-blue-700 px-6 self-end"
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