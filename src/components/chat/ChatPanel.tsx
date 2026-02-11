import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sparkles,
  Trash2,
  MessageSquare,
  Loader2,
  PanelRightClose,
  ExternalLink,
  X,
  Bot,
  Play,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  StopCircle,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  ArrowUp,
} from 'lucide-react';
import { chatService, ChatMessage, StreamChunk } from '@/services/chat.service';
import { useAgentChat, AgentMessage } from '@/hooks/useAgentChat';
import { connectionService } from '@/services/connection.service';
import { SQLCodeBlock } from '@/components/ui/sql-code-block';
import toast from 'react-hot-toast';

export type ChatMode = 'ask' | 'agent';

interface ChatPanelProps {
  connectionId: string;
  selectedSchemas: string[];
  connectionName?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  onInsertSQL?: (sql: string) => void;
  /** Callback to execute a query and return results (for agent mode) */
  onExecuteQuery?: (sql: string) => Promise<{
    success: boolean;
    rows?: any[];
    rowCount?: number;
    affectedRows?: number;
    executionTime?: number;
    error?: string;
    errorDetails?: { message: string; detail?: string; hint?: string; position?: number };
  }>;
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
  onExecuteQuery,
  standalone = false,
  hideExternalLink = false,
}: ChatPanelProps) {
  // Ask mode state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef<string>('');

  // Mode toggle
  const [chatMode, setChatMode] = useState<ChatMode>('ask');

  // Agent mode hook
  const agent = useAgentChat();

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

  // Scroll to bottom for agent messages too
  useEffect(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [messages, streamingContent, agent.agentMessages]);

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
    if (!inputValue.trim()) return;

    if (chatMode === 'agent') {
      // Agent mode: start the agent session
      if (agent.agentStatus !== 'idle' && agent.agentStatus !== 'completed' && agent.agentStatus !== 'error' && agent.agentStatus !== 'stopped') {
        toast.error('Agent is still running');
        return;
      }
      const userMessage = inputValue.trim();
      setInputValue('');
      agent.startAgent(connectionId, userMessage, sessionId || undefined, selectedSchemas);
      return;
    }

    // Ask mode (original behavior)
    if (isStreaming) return;

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
    // Reset agent state too
    agent.resetAgent();
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
  // ============================================
  // AGENT MODE HANDLERS
  // ============================================

  const handleAgentApprove = async (sql: string) => {
    // Insert SQL into editor
    if (onInsertSQL) {
      onInsertSQL(sql);
    }

    // Approve the step (backend will send agent_executing event)
    await agent.approveQuery(connectionId);

    // Execute the query and send results back to agent
    try {
      let result;
      if (onExecuteQuery) {
        result = await onExecuteQuery(sql);
      } else {
        // Fallback: use connectionService directly
        const response = await connectionService.executeQuery(connectionId, sql, true);
        const responseData = (response as any).data || response;
        result = {
          success: responseData.success !== false,
          rows: responseData.rows || [],
          rowCount: responseData.rowCount || 0,
          affectedRows: responseData.affectedRows,
          executionTime: responseData.executionTime,
          error: responseData.error,
          errorDetails: responseData.errorDetails,
        };
      }

      // Send results back to the agent
      await agent.sendExecutionResult(connectionId, result);
    } catch (err: any) {
      // Send error back to agent
      await agent.sendExecutionResult(connectionId, {
        success: false,
        error: err.message || 'Execution failed',
      });
    }
  };

  const handleAgentReject = async () => {
    await agent.rejectQuery(connectionId, 'User rejected the query');
  };

  const handleAgentStop = async () => {
    await agent.stopAgent(connectionId);
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

  // ============================================
  // AGENT MESSAGE RENDERER
  // ============================================

  const renderAgentMessage = (msg: AgentMessage) => {
    switch (msg.type) {
      case 'user':
        return (
          <div key={msg.id} className="flex justify-end">
            <div className="max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-br-sm px-3.5 py-2.5">
              <div className="text-sm leading-relaxed">{msg.content}</div>
            </div>
          </div>
        );

      case 'thinking':
        return (
          <div key={msg.id} className="flex justify-start">
            <div className="max-w-[90%] py-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>{msg.content}</span>
              </div>
            </div>
          </div>
        );

      case 'plan':
        return (
          <div key={msg.id} className="flex justify-start">
            <div className="max-w-[90%] py-2 space-y-2">
              <div className="text-sm text-slate-300">{msg.content}</div>
              {msg.plan && (
                <div className="space-y-1.5 mt-2">
                  {msg.plan.map((step, idx) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-slate-300">{step.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'proposal':
        return (
          <div key={msg.id} className="flex justify-start">
            <div className="max-w-[90%] py-2 space-y-2 w-full">
              {msg.isRetry && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400">
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry #{msg.retryCount} — {msg.content}</span>
                </div>
              )}
              {!msg.isRetry && msg.stepDescription && (
                <div className="text-sm text-slate-400 flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5" />
                  Step {(msg.stepIndex ?? 0) + 1}: {msg.stepDescription}
                </div>
              )}
              {msg.sql && (
                <SQLCodeBlock
                  code={msg.sql}
                  showLineNumbers={msg.sql.split('\n').length > 1}
                  showCopyButton
                  maxHeight="200px"
                />
              )}
              {agent.isWaitingForApproval && agent.currentProposal?.sql === msg.sql && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => handleAgentApprove(msg.sql!)}
                    className="bg-green-600 hover:bg-green-500 text-white text-xs h-8 px-3"
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />
                    Run
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAgentReject}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs h-8 px-3"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Skip
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 'executing':
        return (
          <div key={msg.id} className="flex justify-start">
            <div className="max-w-[90%] py-2">
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Executing query...</span>
              </div>
            </div>
          </div>
        );

      case 'result':
        return (
          <div key={msg.id} className="flex justify-start">
            <div className="max-w-[90%] py-2">
              {msg.success ? (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-300">
                    {msg.rowCount !== undefined && <span>{msg.rowCount} rows returned</span>}
                    {msg.affectedRows !== undefined && <span>{msg.affectedRows} rows affected</span>}
                    {msg.executionTime && <span className="text-green-400/60 ml-1">({msg.executionTime}ms)</span>}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-300">
                    {msg.error || 'Query failed'}
                    {msg.errorDetails?.detail && (
                      <div className="text-xs text-red-400/70 mt-1">{msg.errorDetails.detail}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div key={msg.id} className="flex justify-start">
            <div className="max-w-[90%] text-slate-300 py-2">
              <div className="text-sm leading-relaxed">{msg.content}</div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div key={msg.id} className="flex justify-start">
            <div className="max-w-[90%] py-2">
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm text-purple-300 font-medium">Agent completed</div>
                  <div className="text-xs text-purple-400/70 mt-0.5">
                    {msg.summary || `${msg.stepsCompleted}/${msg.totalSteps} steps completed`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div key={msg.id} className="flex justify-start">
            <div className="max-w-[90%] py-2">
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-300">{msg.error}</div>
              </div>
            </div>
          </div>
        );

      case 'stopped':
        return (
          <div key={msg.id} className="flex justify-start">
            <div className="max-w-[90%] py-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <StopCircle className="w-3.5 h-3.5" />
                <span>{msg.content || 'Agent stopped'}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================
  // MODE TOGGLE COMPONENT
  // ============================================

  const ChatModeDropdown = ({ className, compact = false }: { className?: string, compact?: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 h-auto py-1 px-2.5 rounded-full border transition-all duration-300 ${chatMode === 'agent'
            ? 'border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.1)]'
            : 'border-indigo-500/20 bg-indigo-500/5 text-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-200'} ${className}`}
        >
          {chatMode === 'agent' ? <Bot className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          {!compact && <span className="text-xs font-medium">{chatMode === 'agent' ? 'Agent' : 'Ask'}</span>}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-slate-900/95 backdrop-blur-xl border-slate-700 shadow-xl">
        <DropdownMenuItem onClick={() => setChatMode('ask')} className="text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 cursor-pointer mb-1">
          <Sparkles className="mr-2 h-4 w-4 text-indigo-400" />
          <div className="flex flex-col">
            <span className="font-medium">Ask Question</span>
            <span className="text-[10px] text-slate-500">Get answers and SQL queries</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setChatMode('agent')} className="text-slate-300 focus:bg-purple-500/10 focus:text-purple-300 cursor-pointer">
          <Bot className="mr-2 h-4 w-4 text-purple-400" />
          <div className="flex flex-col">
            <span className="font-medium">Agent Mode</span>
            <span className="text-[10px] text-slate-500">Autonomous plan & execution</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const isAgentBusy = chatMode === 'agent' && !['idle', 'completed', 'error', 'stopped'].includes(agent.agentStatus);

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
              {messages.length === 0 && !isStreaming && chatMode === 'ask' && agent.agentMessages.length === 0 && (
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

              {/* Agent mode messages */}
              {chatMode === 'agent' && agent.agentMessages.map(renderAgentMessage)}

              {/* Agent stop button */}
              {isAgentBusy && (
                <div className="flex justify-center pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAgentStop}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-7"
                  >
                    <StopCircle className="w-3.5 h-3.5 mr-1" />
                    Stop Agent
                  </Button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-900/95 backdrop-blur">
          <div className="max-w-3xl mx-auto">
            <div className={`relative flex items-end w-full p-2 border rounded-xl shadow-lg transition-all duration-300 group ${chatMode === 'agent'
              ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-purple-900/10 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.05)] focus-within:shadow-[0_0_20px_rgba(168,85,247,0.15)] focus-within:border-purple-500/50'
              : 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800/50 border-slate-700/60 focus-within:border-indigo-500/50 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.1)]'}`}>
              
              <div className="pb-1 pl-1">
                <ChatModeDropdown />
              </div>

              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={chatMode === 'agent' ? "Describe task..." : "Ask AI..."}
                className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-200 text-sm placeholder:text-slate-500 min-h-[44px] max-h-[150px] resize-none py-3 px-3 shadow-none"
                disabled={isStreaming || isAgentBusy}
              />
              
              <div className="pb-1 pr-1">
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isStreaming || isAgentBusy}
                  size="icon"
                  className={`h-8 w-8 rounded-lg shadow-md transition-all duration-300 ${chatMode === 'agent' 
                    ? 'bg-gradient-to-tr from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-purple-900/20' 
                    : 'bg-gradient-to-tr from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-900/20'} text-white disabled:opacity-40 disabled:bg-none disabled:bg-slate-700`}
                >
                  {isStreaming || isAgentBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            {chatMode === 'agent' && (
              <div className="mt-2 text-xs text-center text-slate-500 animate-in fade-in slide-in-from-bottom-1 duration-500">
                Agent mode can execute queries and modify your database.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Sidebar layout (default)
  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 min-w-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-12 border-b border-slate-800 shrink-0">
        <span className="font-medium text-slate-300 text-xs">AI Assistant</span>
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
            {messages.length === 0 && !isStreaming && chatMode === 'ask' && agent.agentMessages.length === 0 && (
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

            {/* Agent mode messages */}
            {chatMode === 'agent' && agent.agentMessages.map(renderAgentMessage)}

            {/* Agent stop button */}
            {isAgentBusy && (
              <div className="flex justify-center pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAgentStop}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-7"
                >
                  <StopCircle className="w-3.5 h-3.5 mr-1" />
                  Stop Agent
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800 shrink-0">
        <div className={`relative flex items-end w-full p-1.5 border rounded-xl shadow-sm transition-all duration-300 group ${chatMode === 'agent'
          ? 'bg-slate-900/40 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.05)] focus-within:shadow-[0_0_15px_rgba(168,85,247,0.1)] focus-within:border-purple-500/40'
          : 'bg-slate-800/40 border-slate-700/60 focus-within:border-indigo-500/40 focus-within:shadow-[0_0_15px_rgba(99,102,241,0.05)]'}`}>

          <div className="pb-0.5 pl-0.5">
            <ChatModeDropdown compact />
          </div>

          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chatMode === 'agent' ? "Describe task..." : "Ask AI..."}
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-200 text-sm placeholder:text-slate-500 min-h-[40px] max-h-[120px] resize-none py-2.5 px-2 shadow-none"
            disabled={isStreaming || isAgentBusy}
          />

          <div className="pb-0.5 pr-0.5">
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isStreaming || isAgentBusy}
              size="icon"
              className={`h-7 w-7 rounded-lg shadow-sm transition-all duration-300 ${chatMode === 'agent' 
                ? 'bg-gradient-to-tr from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500' 
                : 'bg-gradient-to-tr from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500'} text-white disabled:opacity-40 disabled:bg-none disabled:bg-slate-700`}
            >
              {isStreaming || isAgentBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
