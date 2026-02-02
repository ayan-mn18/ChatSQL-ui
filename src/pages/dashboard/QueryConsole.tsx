import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor, { Monaco } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Plus,
  Save,
  BarChart3,
  Table as TableIcon,
  AlertCircle,
  Loader2,
  Database,
  ChevronDown,
  X,
  MessageSquare,
  FolderOpen,
  Copy,
  Check,
  Trash2,
  PanelRightClose,
  Search,
  Clock,
  Sparkles,
  Code,
  Settings2,
  Palette,
  ExternalLink,
} from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import DataTable from '@/components/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';

// Chart imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

// Services
import { connectionService } from '@/services/connection.service';
import { chatService, ChatMessage, StreamChunk } from '@/services/chat.service';
import { savedQueriesService, SavedQuery } from '@/services/saved-queries.service';
import { useQueryTabs, QueryResult } from '@/contexts/QueryTabsContext';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseSchemaPublic } from '@/types';
import { SQLCodeBlock } from '@/components/ui/sql-code-block';

// ============================================
// TYPES
// ============================================

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  xAxis: string;
  yAxis: string[];
  title: string;
}

interface SchemaMetadata {
  tables: Array<{
    schema: string;
    name: string;
    columns: Array<{ name: string; type: string }>;
  }>;
}

// ============================================
// QUERY TAB BAR COMPONENT
// ============================================

function QueryTabBar({
  connectionId,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
}: {
  connectionId: string;
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
}) {
  const { getTabsForConnection, updateTabTitle } = useQueryTabs();
  const tabs = getTabsForConnection(connectionId);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleDoubleClick = (tabId: string, currentTitle: string) => {
    setEditingTabId(tabId);
    setEditingTitle(currentTitle);
  };

  const handleTitleSave = (tabId: string) => {
    if (editingTitle.trim()) {
      updateTabTitle(tabId, editingTitle.trim());
    }
    setEditingTabId(null);
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-[#0f172a] border-b border-white/5 overflow-x-auto">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`
            group flex items-center gap-2 px-3 py-1.5 rounded-t text-sm cursor-pointer
            transition-colors min-w-[120px] max-w-[200px]
            ${activeTabId === tab.id
              ? 'bg-[#6366f1] text-white border-t-2 border-[#8b5cf6] shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
            }
          `}
          onClick={() => onTabSelect(tab.id)}
          onDoubleClick={() => handleDoubleClick(tab.id, tab.title)}
        >
          {tab.isRunning && <Loader2 className="w-3 h-3 animate-spin text-green-400" />}
          {editingTabId === tab.id ? (
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={() => handleTitleSave(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave(tab.id);
                if (e.key === 'Escape') setEditingTabId(null);
              }}
              className="bg-transparent border-none outline-none w-full text-white text-sm"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{tab.title}</span>
          )}
          {tab.isDirty && <span className="text-blue-400">•</span>}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 hover:text-white"
            onClick={onNewTab}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>New Query Tab</TooltipContent>
      </Tooltip>
    </div>
  );
}

// ============================================
// AI CHAT SIDEBAR COMPONENT
// ============================================

function AIChatSidebar({
  connectionId,
  selectedSchemas,
  onInsertSQL,
  isOpen,
  onToggle,
}: {
  connectionId: string;
  selectedSchemas: string[];
  onInsertSQL: (sql: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef<string>(''); // Track accumulated content for closure

  // Helper function to render formatted text with bold, etc.
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
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
      // Use requestAnimationFrame for better performance
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
    streamingContentRef.current = ''; // Reset the ref too

    // Add user message to list optimistically
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: sessionId || '',
      role: 'user',
      content: userMessage,
      isError: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    // Stream the response
    abortControllerRef.current = chatService.streamMessage(
      connectionId,
      userMessage,
      sessionId || undefined,
      selectedSchemas,
      (chunk: StreamChunk) => {
        if (chunk.type === 'session' && chunk.sessionId) {
          setSessionId(chunk.sessionId);
        } else if (chunk.type === 'content' && chunk.content) {
          // Accumulate content in both state and ref
          streamingContentRef.current += chunk.content;
          setStreamingContent(prev => prev + chunk.content);
        } else if (chunk.type === 'done') {
          // Use the ref value which has the full accumulated content
          const fullContent = streamingContentRef.current;

          // Add assistant message
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
        // Cleanup on complete
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

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="fixed right-4 top-20 z-50 bg-[#0f172a] border border-blue-500/30 text-white hover:bg-white/5 hover:text-white"
        onClick={onToggle}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        SQL Copilot
      </Button>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0c1222] to-[#0f172a] border-l border-white/5 min-w-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0 bg-[#0c1222]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0c1222]" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white text-sm tracking-tight">SQL Copilot</span>
            <span className="text-[10px] text-emerald-400/80 font-medium">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
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
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open in New Window</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleClearChat} className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear Chat</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg">
            <PanelRightClose className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages - Fixed height container */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="space-y-5">
            {messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center mb-4 border border-white/5">
                  <Sparkles className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1.5">SQL Copilot</h3>
                <p className="text-sm text-slate-400 text-center mb-6">Your AI-powered database assistant</p>
                <div className="w-full space-y-2">
                  <button className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all group">
                    <p className="text-sm text-slate-300 group-hover:text-white transition-colors">💬 "What tables do I have?"</p>
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all group">
                    <p className="text-sm text-slate-300 group-hover:text-white transition-colors">🔍 "Show me all users"</p>
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all group">
                    <p className="text-sm text-slate-300 group-hover:text-white transition-colors">📊 "Count orders by status"</p>
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
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-lg shadow-blue-500/10'
                    : 'bg-white/[0.03] border border-white/5 text-slate-200 rounded-2xl rounded-bl-md px-4 py-3'
                    }`}
                >
                  {/* Message Content */}
                  <div className="text-[13px] leading-relaxed space-y-3">
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
                                showInsertButton
                                onInsert={onInsertSQL}
                                maxHeight="250px"
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

                  {/* SQL Insert Button - show if there's sqlGenerated but no code block in content */}
                  {msg.role === 'assistant' && msg.sqlGenerated && !msg.content?.includes('```sql') && (
                    <div className="mt-3">
                      <SQLCodeBlock
                        code={msg.sqlGenerated}
                        showLineNumbers={msg.sqlGenerated.split('\n').length > 1}
                        showInsertButton
                        onInsert={onInsertSQL}
                        maxHeight="200px"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isStreaming && streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[90%] bg-white/[0.03] border border-white/5 text-slate-200 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="text-[13px] leading-relaxed space-y-3">
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
                                maxHeight="250px"
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
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[13px] text-slate-400">Generating response...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 shrink-0 bg-[#0c1222]/50">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your data or request SQL..."
              className="w-full bg-white/[0.03] border-white/5 hover:border-white/10 focus:border-blue-500/50 text-white text-[13px] placeholder:text-slate-500 min-h-[52px] max-h-[120px] resize-none rounded-xl pr-4 transition-colors"
              disabled={isStreaming}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isStreaming}
            size="lg"
            className="h-[52px] w-[52px] p-0 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100"
          >
            {isStreaming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">Press Enter to send • Shift+Enter for new line</p>
      </div>
    </div>
  );
}

// ============================================
// SAVED QUERIES MODAL
// ============================================

function SavedQueriesModal({
  connectionId,
  isOpen,
  onClose,
  onLoadQuery,
  isViewer,
}: {
  connectionId: string;
  isOpen: boolean;
  onClose: () => void;
  onLoadQuery: (query: string, name: string) => void;
  isViewer: boolean;
}) {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && connectionId) {
      loadSavedQueries();
    }
  }, [isOpen, connectionId]);

  const loadSavedQueries = async () => {
    setLoading(true);
    try {
      const response = await savedQueriesService.getAll(connectionId, searchTerm || undefined);
      if (response.success) {
        setSavedQueries(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load saved queries');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadSavedQueries();
  };

  const handleDelete = async (queryId: string) => {
    try {
      await savedQueriesService.delete(connectionId, queryId);
      setSavedQueries(prev => prev.filter(q => q.id !== queryId));
      toast.success('Query deleted');
    } catch (error) {
      toast.error('Failed to delete query');
    }
  };

  const handleCopy = async (queryText: string, queryId: string) => {
    await navigator.clipboard.writeText(queryText);
    setCopiedId(queryId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLoad = (query: SavedQuery) => {
    onLoadQuery(query.queryText, query.name);
    savedQueriesService.recordUsage(connectionId, query.id).catch(() => { });
    onClose();
  };

  const filteredQueries = savedQueries.filter(
    q => q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.queryText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e293b] border-white/10 text-white max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-400" />
            Saved Queries
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isViewer ? 'Browse shared queries' : 'Manage your saved SQL queries'}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="flex gap-2 my-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search queries..."
              className="pl-10 bg-[#0f172a] border-white/10 text-white"
            />
          </div>
          <Button onClick={handleSearch} variant="outline" className="border-white/10">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Queries List */}
        <div className="max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : filteredQueries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No saved queries found</p>
            </div>
          ) : (
            <div className="space-y-2 pr-2">
              {filteredQueries.map(query => (
                <div
                  key={query.id}
                  className="p-4 rounded-lg bg-[#0f172a] border border-white/5 hover:border-blue-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white flex items-center gap-2 flex-wrap">
                        <span className="truncate">{query.name}</span>
                        {query.isShared && (
                          <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30 shrink-0">
                            Shared
                          </Badge>
                        )}
                      </h4>
                      {query.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{query.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(query.queryText, query.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                            >
                              {copiedId === query.id ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy SQL</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {!isViewer && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(query.id)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  <pre className="text-xs text-gray-300 bg-black/20 p-3 rounded overflow-x-auto max-h-[100px] overflow-y-auto mb-3 whitespace-pre-wrap break-all">
                    {query.queryText.length > 300 ? `${query.queryText.substring(0, 300)}...` : query.queryText}
                  </pre>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {query.lastUsedAt
                          ? `Used ${new Date(query.lastUsedAt).toLocaleDateString()}`
                          : 'Never used'}
                      </div>
                      <span>•</span>
                      <span>{query.useCount} uses</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleLoad(query)}
                      className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    >
                      Load Query
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// SAVE QUERY DIALOG
// ============================================

function SaveQueryDialog({
  connectionId,
  queryText,
  isOpen,
  onClose,
  onSaved,
  isViewer,
}: {
  connectionId: string;
  queryText: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  isViewer: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setSaving(true);
    try {
      await savedQueriesService.create(connectionId, {
        name: name.trim(),
        queryText,
        description: description.trim() || undefined,
        isShared,
      });
      toast.success('Query saved!');
      onSaved();
      onClose();
      // Reset form
      setName('');
      setDescription('');
      setIsShared(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save query');
    } finally {
      setSaving(false);
    }
  };

  if (isViewer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e293b] border-white/10 text-white max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-blue-400" />
            Save Query
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Save this query to your collection for quick access later
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label htmlFor="query-name" className="text-gray-300">Name *</Label>
            <Input
              id="query-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Monthly Active Users"
              className="mt-1 bg-[#0f172a] border-white/10 text-white"
            />
          </div>

          <div>
            <Label htmlFor="query-description" className="text-gray-300">Description</Label>
            <Textarea
              id="query-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="mt-1 bg-[#0f172a] border-white/10 text-white min-h-[80px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="query-shared" className="text-gray-300">Share with viewers</Label>
              <p className="text-xs text-gray-500">Viewers with access to this connection can use this query</p>
            </div>
            <Switch
              id="query-shared"
              checked={isShared}
              onCheckedChange={setIsShared}
              className="ml-4"
            />
          </div>

          <div>
            <Label className="text-gray-300">Query Preview</Label>
            <pre className="mt-1 text-xs text-gray-400 bg-black/20 p-3 rounded max-h-[120px] overflow-y-auto whitespace-pre-wrap break-all">
              {queryText.length > 500 ? `${queryText.substring(0, 500)}...` : queryText}
            </pre>
          </div>
        </div>

        <DialogFooter className="border-t border-white/10 pt-4">
          <Button variant="ghost" onClick={onClose} className="text-gray-400">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Query
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN SQL EDITOR COMPONENT
// ============================================

export default function QueryConsole() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';

  // Query tabs
  const {
    activeTabId,
    addTab,
    removeTab,
    setActiveTab,
    updateTabQuery,
    updateTabResults,
    updateTabTitle,
    setTabRunning,
    getActiveTab,
    getTabsForConnection,
  } = useQueryTabs();

  // Monaco editor ref
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // State
  const [error, setError] = useState<string | null>(null);
  const [schemas, setSchemas] = useState<DatabaseSchemaPublic[]>([]);
  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([]);
  const [, setLoadingSchemas] = useState(false);
  const [schemaMetadata, setSchemaMetadata] = useState<SchemaMetadata | null>(null);

  // Keep latest values for Monaco completion provider (provider is registered once)
  const schemaMetadataRef = useRef<SchemaMetadata | null>(null);
  const selectedSchemasRef = useRef<string[]>([]);

  useEffect(() => {
    schemaMetadataRef.current = schemaMetadata;
  }, [schemaMetadata]);

  useEffect(() => {
    selectedSchemasRef.current = selectedSchemas;
  }, [selectedSchemas]);
  const [activeResultTab, setActiveResultTab] = useState('table');
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [showSavedQueries, setShowSavedQueries] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [showChartConfig, setShowChartConfig] = useState(false);

  // Chart config with colors
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'bar',
    xAxis: '',
    yAxis: [],
    title: 'Query Results',
  });
  const [chartColors, setChartColors] = useState<string[]>([
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#ec4899', // pink
  ]);

  // Get active tab
  const activeTab = getActiveTab();

  // ============================================
  // INITIALIZE TABS FOR CONNECTION
  // ============================================

  useEffect(() => {
    if (connectionId) {
      const connectionTabs = getTabsForConnection(connectionId);
      if (connectionTabs.length === 0) {
        addTab(connectionId, 'Query 1', '-- Write your SQL query here\nSELECT * FROM ');
      } else if (!activeTabId || !connectionTabs.find(t => t.id === activeTabId)) {
        setActiveTab(connectionTabs[0].id);
      }
      fetchSchemas();
    }
  }, [connectionId]);

  // ============================================
  // FETCH SCHEMAS
  // ============================================

  const fetchSchemas = async () => {
    if (!connectionId) return;

    setLoadingSchemas(true);
    try {
      const response = await connectionService.getSchemas(connectionId);
      if (response.success && response.data) {
        setSchemas(response.data);
        const preSelected = response.data
          .filter((s: DatabaseSchemaPublic) => s.is_selected)
          .map((s: DatabaseSchemaPublic) => s.schema_name);
        setSelectedSchemas(preSelected.length > 0 ? preSelected : ['public']);
      }

      // Also fetch full schema metadata for autocomplete
      const schemaResponse = await connectionService.getFullSchema(connectionId);
      if (schemaResponse.success) {
        setSchemaMetadata(schemaResponse.data as any);
      }
    } catch (err) {
      console.error('Failed to fetch schemas:', err);
    } finally {
      setLoadingSchemas(false);
    }
  };

  // ============================================
  // MONACO SETUP
  // ============================================

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom theme with enhanced selection colors
    monaco.editor.defineTheme('chatsql-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'type', foreground: '4EC9B0' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#f1f5f9',
        'editor.lineHighlightBackground': '#1e293b',
        'editor.selectionBackground': '#6366f1', // Indigo selection background
        'editor.inactiveSelectionBackground': '#4f46e5', // Darker indigo for inactive selection
        'editor.selectionHighlightBackground': '#3730a3', // Even darker for highlight
        'editor.wordHighlightBackground': '#1e3a8a',
        'editor.wordHighlightStrongBackground': '#1e3a8a',
        'editor.findMatchBackground': '#fbbf24', // Yellow for find matches
        'editor.findMatchHighlightBackground': '#f59e0b', // Orange for find highlights
        'editorCursor.foreground': '#60a5fa',
        'editorLineNumber.foreground': '#64748b',
        'editorLineNumber.activeForeground': '#f1f5f9',
        'editorWidget.background': '#1e293b',
        'editorWidget.border': '#334155',
        'editorSuggestWidget.background': '#1e293b',
        'editorSuggestWidget.border': '#334155',
        'editorSuggestWidget.selectedBackground': '#3b82f6',
        'list.activeSelectionBackground': '#3b82f6',
        'list.inactiveSelectionBackground': '#1e40af',
        'input.background': '#1e293b',
        'input.border': '#334155',
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#334155',
        'scrollbarSlider.hoverBackground': '#475569',
        'scrollbarSlider.activeBackground': '#64748b',
      }
    });

    // Apply the custom dark theme
    monaco.editor.setTheme('chatsql-dark');

    // Configure SQL language
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model: any, position: any) => {
        const suggestions: any[] = [];

        const schemaMeta = schemaMetadataRef.current;
        const word = model.getWordUntilPosition(position);
        const replaceRange = new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        );

        const lineUntilCursor = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // Dotted-path completion
        // - schema.           => tables
        // - schema.table.     => columns
        // - schema.ta         => tables (prefix)
        // - schema.table.co   => columns (prefix)
        const schemaTableColPrefix = lineUntilCursor.match(/([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)$/);
        const schemaTableDot = lineUntilCursor.match(/([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)\.$/);
        const schemaTablePrefix = lineUntilCursor.match(/([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)$/);
        const schemaDot = lineUntilCursor.match(/([A-Za-z_][\w]*)\.$/);

        if (schemaMeta?.tables) {
          // Columns: schema.table. or schema.table.colprefix
          if (schemaTableColPrefix || schemaTableDot) {
            const schemaName = (schemaTableColPrefix?.[1] || schemaTableDot?.[1]) as string;
            const tableName = (schemaTableColPrefix?.[2] || schemaTableDot?.[2]) as string;

            const table = schemaMeta.tables.find(t => t.schema === schemaName && t.name === tableName);
            if (table) {
              table.columns.forEach((col) => {
                suggestions.push({
                  label: col.name,
                  kind: monaco.languages.CompletionItemKind.Field,
                  insertText: col.name,
                  detail: `${col.type} - ${schemaName}.${tableName}`,
                  range: replaceRange,
                });
              });
              return { suggestions };
            }
          }

          // Tables: schema. or schema.tabprefix
          if (schemaDot || schemaTablePrefix) {
            const schemaName = (schemaDot?.[1] || schemaTablePrefix?.[1]) as string;
            schemaMeta.tables
              .filter(t => t.schema === schemaName)
              .forEach((t) => {
                suggestions.push({
                  label: t.name,
                  kind: monaco.languages.CompletionItemKind.Class,
                  insertText: t.name,
                  detail: `Table in ${schemaName}`,
                  range: replaceRange,
                });
              });

            if (suggestions.length > 0) {
              return { suggestions };
            }
          }

          // General suggestions (tables/columns) scoped to selected schemas when available
          const allowedSchemas = selectedSchemasRef.current || [];
          schemaMeta.tables.forEach((table) => {
            if (allowedSchemas.length > 0 && !allowedSchemas.includes(table.schema)) return;

            suggestions.push({
              label: `${table.schema}.${table.name}`,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: `${table.schema}.${table.name}`,
              detail: 'Table',
              range: replaceRange,
            });

            table.columns.forEach((col) => {
              suggestions.push({
                label: `${table.schema}.${table.name}.${col.name}`,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: col.name,
                detail: `${col.type} - ${table.schema}.${table.name}`,
                range: replaceRange,
              });
            });
          });
        }

        // Add SQL keywords
        const keywords = [
          'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
          'ON', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL',
          'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'DISTINCT',
          'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
          'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE',
          'ALTER TABLE', 'DROP TABLE', 'UNION', 'UNION ALL', 'EXCEPT', 'INTERSECT'
        ];

        keywords.forEach(kw => {
          suggestions.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range: replaceRange,
          });
        });

        return { suggestions };
      },
    });

    // Add keyboard shortcut for run query
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunQuery();
    });
  };

  // ============================================
  // RUN QUERY
  // ============================================

  const handleRunQuery = async () => {
    if (!connectionId || !activeTab) {
      toast.error('No connection or query tab selected');
      return;
    }

    const editor = editorRef.current;
    let queryToRun = activeTab.query;

    // Check if there's a selection - run only selected text
    if (editor) {
      const selection = editor.getSelection();
      const selectedText = editor.getModel()?.getValueInRange(selection);
      if (selectedText && selectedText.trim()) {
        queryToRun = selectedText.trim();
        addLog(`Running selected query: ${queryToRun.substring(0, 50)}...`);
      }
    }

    if (!queryToRun.trim()) {
      setError('Query cannot be empty');
      return;
    }

    setTabRunning(activeTab.id, true);
    setError(null);
    addLog('Executing query...');

    try {
      const response = await connectionService.executeQuery(connectionId, queryToRun, true);
      const responseData = response.data || response;
      const rows = (responseData as any).rows || [];
      const rowCount = (responseData as any).rowCount || rows.length;
      const executionTime = (responseData as any).executionTime || 0;

      if (response.success) {
        const results: QueryResult = {
          data: rows,
          columns: rows.length > 0 ? Object.keys(rows[0]) : [],
          rowCount,
          executionTime,
        };
        updateTabResults(activeTab.id, results);
        addLog(`✓ Query returned ${rowCount} rows in ${executionTime}ms`);

        if (rows.length > 0) {
          autoDetectChartConfig(rows);
        }

        toast.success(`Query returned ${rowCount} rows in ${executionTime}ms`);
      } else {
        const errorMsg = response.error || 'Query failed';
        setError(errorMsg);
        addLog(`✗ Error: ${errorMsg}`);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to execute query';
      setError(message);
      addLog(`✗ Error: ${message}`);
      toast.error(message);
    } finally {
      setTabRunning(activeTab.id, false);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setExecutionLogs(prev => [...prev.slice(-50), `[${timestamp}] ${message}`]);
  };

  // ============================================
  // CHART AUTO-DETECTION
  // ============================================

  const autoDetectChartConfig = (rows: any[]) => {
    if (!rows.length) return;

    const columns = Object.keys(rows[0]);
    const numericFields = columns.filter(col => {
      const values = rows.map(r => r[col]).filter(v => v != null);
      return values.every(v => !isNaN(Number(String(v).replace(/[,$]/g, ''))));
    });
    const categoryFields = columns.filter(col => !numericFields.includes(col));

    let chartType: ChartConfig['type'] = 'bar';
    if (rows.length <= 10 && numericFields.length === 1) {
      chartType = 'pie';
    } else if (rows.length > 20) {
      chartType = 'line';
    }

    setChartConfig({
      type: chartType,
      xAxis: categoryFields[0] || columns[0],
      yAxis: numericFields.slice(0, 3),
      title: 'Query Results',
    });
  };

  // ============================================
  // CHART DATA
  // ============================================

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const chartData = useMemo(() => {
    if (!activeTab?.results?.data?.length || !chartConfig.xAxis || !chartConfig.yAxis.length) {
      return null;
    }

    const labels = activeTab.results.data.map(row => String(row[chartConfig.xAxis] ?? 'N/A'));

    const datasets = chartConfig.yAxis.map((field, idx) => {
      const color = chartColors[idx % chartColors.length];
      const rgbaColor = hexToRgba(color, 0.7);

      return {
        label: field,
        data: activeTab.results!.data.map(row => Number(String(row[field]).replace(/[,$]/g, '')) || 0),
        backgroundColor: chartConfig.type === 'pie' || chartConfig.type === 'doughnut'
          ? chartColors.map(c => hexToRgba(c, 0.7))
          : rgbaColor,
        borderColor: color,
        borderWidth: 2,
        tension: 0.4,
      };
    });

    return { labels, datasets };
  }, [activeTab?.results, chartConfig, chartColors]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleNewTab = () => {
    if (!connectionId) return;
    const tabCount = getTabsForConnection(connectionId).length;
    addTab(connectionId, `Query ${tabCount + 1}`, '-- New query\nSELECT * FROM ');
  };

  const handleInsertSQL = (sql: string) => {
    if (!activeTab) return;
    // Clean up the SQL
    const cleanSQL = sql.replace(/\\n/g, '\n');
    updateTabQuery(activeTab.id, cleanSQL);
    if (editorRef.current) {
      editorRef.current.setValue(cleanSQL);
    }
    toast.success('SQL inserted into editor');
  };

  const toggleSchema = (schemaName: string) => {
    setSelectedSchemas(prev =>
      prev.includes(schemaName)
        ? prev.filter(s => s !== schemaName)
        : [...prev, schemaName]
    );
  };

  const toggleAllSchemas = (select: boolean) => {
    if (select) {
      setSelectedSchemas(schemas.map(s => s.schema_name));
    } else {
      setSelectedSchemas([]);
    }
  };

  // ============================================
  // NO CONNECTION STATE
  // ============================================

  if (!connectionId) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1B2431]">
        <div className="text-center text-gray-400">
          <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-white mb-2">No Connection Selected</h2>
          <p>Please select a database connection to use the Query Console</p>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-[#1B2431]">
        {/* Toolbar */}
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-[#1B2431] shrink-0">
          {/* Left: Run & Actions */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="bg-[#10b981] hover:bg-[#059669] text-white"
                  onClick={handleRunQuery}
                  disabled={activeTab?.isRunning || !!error}
                >
                  {activeTab?.isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Run Query (Ctrl+Enter)</TooltipContent>
            </Tooltip>

            {/* Schema Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white">
                  <Database className="w-4 h-4 mr-2" />
                  {selectedSchemas.length === 1 ? selectedSchemas[0] : `${selectedSchemas.length} schemas`}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#273142] border-white/10 text-white min-w-[220px]">
                <DropdownMenuLabel className="text-gray-400 text-xs px-2 py-1.5">Select schemas</DropdownMenuLabel>
                <div className="px-2 pb-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleAllSchemas(true);
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleAllSchemas(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
                  {schemas.map(schema => (
                    <DropdownMenuCheckboxItem
                      key={schema.id}
                      checked={selectedSchemas.includes(schema.schema_name)}
                      onCheckedChange={() => toggleSchema(schema.schema_name)}
                      className="text-white hover:bg-white/10 cursor-pointer"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <span className="flex items-center justify-between w-full gap-2">
                        <span className="truncate">{schema.schema_name}</span>
                        <Badge variant="outline" className="text-[10px] border-white/10 bg-white/5 text-gray-400 shrink-0">
                          {schema.table_count}
                        </Badge>
                      </span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-6 w-px bg-white/10" />

            {/* Save & Load */}
            {!isViewer && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    disabled={!activeTab?.query.trim()}
                    className="text-gray-400 hover:text-white"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save Query</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSavedQueries(true)}
                  className="text-gray-400 hover:text-white"
                >
                  <FolderOpen className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Saved Queries</TooltipContent>
            </Tooltip>
          </div>

          {/* Right: AI Chat Toggle */}
          <div className="flex items-center gap-2">
            {isViewer && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                Viewer Mode
              </Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showChatSidebar ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowChatSidebar(!showChatSidebar)}
                  className={
                    showChatSidebar
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 border-0'
                      : 'border-blue-500/40 text-white hover:bg-white/5 hover:text-white'
                  }
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  SQL Copilot
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle SQL Copilot</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Tab Bar */}
        <QueryTabBar
          connectionId={connectionId}
          activeTabId={activeTabId}
          onTabSelect={setActiveTab}
          onTabClose={removeTab}
          onNewTab={handleNewTab}
        />

        {/* Main Content */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Editor + Results */}
          <ResizablePanel defaultSize={showChatSidebar ? 70 : 100} minSize={50}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Editor Panel */}
              <ResizablePanel defaultSize={40} minSize={20}>
                <div className="h-full flex flex-col bg-[#0f172a]">
                  <Editor
                    height="100%"
                    defaultLanguage="sql"
                    value={activeTab?.query || ''}
                    onChange={(value) => activeTab && updateTabQuery(activeTab.id, value || '')}
                    onMount={handleEditorDidMount}
                    theme="chatsql-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on',
                      suggestOnTriggerCharacters: true,
                      quickSuggestions: true,
                    }}
                  />
                  {error && (
                    <div className="bg-red-500/10 border-t border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-[#1e293b] h-2" />

              {/* Results Panel */}
              <ResizablePanel defaultSize={60} minSize={20}>
                <div className="h-full bg-[#1B2431] flex flex-col">
                  <Tabs value={activeResultTab} onValueChange={setActiveResultTab} className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#273142]">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-white">Results</h3>
                        {activeTab?.results && (
                          <Badge variant="outline" className="text-xs text-gray-400">
                            {activeTab.results.rowCount} rows in {activeTab.results.executionTime}ms
                          </Badge>
                        )}
                      </div>
                      <TabsList className="bg-[#1B2431] border border-white/5">
                        <TabsTrigger value="table" className="data-[state=active]:bg-[#6366f1] data-[state=active]:text-white">
                          <TableIcon className="w-4 h-4 mr-2" />
                          Table
                        </TabsTrigger>
                        <TabsTrigger value="chart" className="data-[state=active]:bg-[#6366f1] data-[state=active]:text-white">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Chart
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="data-[state=active]:bg-[#6366f1] data-[state=active]:text-white">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Logs
                        </TabsTrigger>
                      </TabsList>

                      {/* Chart Config Button */}
                      {activeResultTab === 'chart' && activeTab?.results && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowChartConfig(true)}
                          className="border-white/10 bg-white/5 hover:bg-white/10 text-gray-300"
                        >
                          <Settings2 className="w-4 h-4 mr-2" />
                          Configure Chart
                        </Button>
                      )}
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                      <TabsContent value="table" className="h-full w-full m-0 absolute inset-0">
                        {activeTab?.isRunning ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-cyan-400" />
                              <p className="text-gray-300 text-lg">Executing query...</p>
                              <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your data</p>
                            </div>
                          </div>
                        ) : activeTab?.results ? (
                          <DataTable
                            data={activeTab.results.data}
                            columns={activeTab.results.columns}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                              <TableIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                              <p>Run a query to see results</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="chart" className="h-full w-full m-0 p-4 absolute inset-0">
                        {activeTab?.isRunning ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-cyan-400" />
                              <p className="text-gray-300 text-lg">Generating chart...</p>
                              <p className="text-gray-500 text-sm mt-2">Analyzing your data</p>
                            </div>
                          </div>
                        ) : chartData ? (
                          <div className="h-full">
                            {chartConfig.type === 'bar' && <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />}
                            {chartConfig.type === 'line' && <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />}
                            {chartConfig.type === 'pie' && <Pie data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />}
                            {chartConfig.type === 'doughnut' && <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                              <p>Run a query to visualize data</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="logs" className="h-full w-full m-0 absolute inset-0">
                        <ScrollArea className="h-full p-4">
                          <div className="font-mono text-xs space-y-1">
                            {executionLogs.length === 0 ? (
                              <p className="text-gray-500">No execution logs yet</p>
                            ) : (
                              executionLogs.map((log, i) => (
                                <div
                                  key={i}
                                  className={`${log.includes('✓') ? 'text-green-400' :
                                    log.includes('✗') ? 'text-red-400' :
                                      'text-gray-400'
                                    }`}
                                >
                                  {log}
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* AI Chat Sidebar */}
          {showChatSidebar && (
            <>
              <ResizableHandle withHandle className="bg-[#1e293b] w-2" />
              <ResizablePanel defaultSize={30} minSize={25} maxSize={70}>
                <AIChatSidebar
                  connectionId={connectionId}
                  selectedSchemas={selectedSchemas}
                  onInsertSQL={handleInsertSQL}
                  isOpen={showChatSidebar}
                  onToggle={() => setShowChatSidebar(false)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>

        {/* Modals */}
        <SavedQueriesModal
          connectionId={connectionId}
          isOpen={showSavedQueries}
          onClose={() => setShowSavedQueries(false)}
          onLoadQuery={(query, name) => {
            if (activeTab) {
              updateTabQuery(activeTab.id, query);
              updateTabTitle(activeTab.id, name);
              if (editorRef.current) {
                editorRef.current.setValue(query);
              }
            }
          }}
          isViewer={isViewer}
        />

        <SaveQueryDialog
          connectionId={connectionId}
          queryText={activeTab?.query || ''}
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onSaved={() => { }}
          isViewer={isViewer}
        />

        {/* Chart Configuration Modal */}
        <Dialog open={showChartConfig} onOpenChange={setShowChartConfig}>
          <DialogContent className="bg-[#1B2431] border-white/10 text-white max-w-3xl max-h-[85vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-blue-400" />
                Chart Configuration
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Customize your chart appearance and data visualization
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto max-h-[calc(85vh-180px)] pr-2 space-y-6 py-4">
              {/* Chart Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Chart Type
                </Label>
                <div className="grid grid-cols-4 gap-3">
                  {(['bar', 'line', 'pie', 'doughnut'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={chartConfig.type === type ? 'default' : 'outline'}
                      size="sm"
                      className={chartConfig.type === type
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'border-white/10 hover:bg-white/5'}
                      onClick={() => setChartConfig(prev => ({ ...prev, type }))}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Chart Title */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-300">Chart Title</Label>
                <Input
                  value={chartConfig.title}
                  onChange={(e) => setChartConfig(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter chart title..."
                  className="bg-[#0f172a] border-white/10 text-white"
                />
              </div>

              {/* X-Axis (Category) */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-300">X-Axis (Category)</Label>
                <Select
                  value={chartConfig.xAxis}
                  onValueChange={(value) => setChartConfig(prev => ({ ...prev, xAxis: value }))}
                >
                  <SelectTrigger className="bg-[#0f172a] border-white/10 text-white">
                    <SelectValue placeholder="Select column for X-axis" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#273142] border-white/10 text-white">
                    {activeTab?.results?.columns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Y-Axis (Values) */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-300">Y-Axis (Values) - Select one or more</Label>
                <div className="flex flex-wrap gap-2">
                  {activeTab?.results?.columns.map((col) => (
                    <Button
                      key={col}
                      variant={chartConfig.yAxis.includes(col) ? 'default' : 'outline'}
                      size="sm"
                      className={chartConfig.yAxis.includes(col)
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'border-white/10 hover:bg-white/5'}
                      onClick={() => {
                        setChartConfig(prev => ({
                          ...prev,
                          yAxis: prev.yAxis.includes(col)
                            ? prev.yAxis.filter(y => y !== col)
                            : [...prev.yAxis, col],
                        }));
                      }}
                    >
                      {col}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Color Palette
                </Label>
                <div className="grid grid-cols-6 gap-3">
                  {chartColors.map((color, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const newColors = [...chartColors];
                            newColors[idx] = e.target.value;
                            setChartColors(newColors);
                          }}
                          className="w-full h-12 rounded-lg cursor-pointer border-2 border-white/10"
                        />
                      </div>
                      <span className="text-xs text-gray-400 text-center font-mono">
                        {color.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/5 text-xs"
                    onClick={() => setChartColors(['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'])}
                  >
                    Reset to Default
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/5 text-xs"
                    onClick={() => {
                      const randomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                      setChartColors(Array(6).fill(0).map(() => randomColor()));
                    }}
                  >
                    Random Colors
                  </Button>
                </div>
              </div>

              {/* Preset Palettes */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-300">Color Presets</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/5 justify-start"
                    onClick={() => setChartColors(['#3b82f6', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308'])}
                  >
                    <div className="flex gap-1 mr-2">
                      {['#3b82f6', '#06b6d4', '#14b8a6'].map(c => (
                        <div key={c} className="w-4 h-4 rounded" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    Cool Blues
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/5 justify-start"
                    onClick={() => setChartColors(['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e'])}
                  >
                    <div className="flex gap-1 mr-2">
                      {['#ef4444', '#f97316', '#f59e0b'].map(c => (
                        <div key={c} className="w-4 h-4 rounded" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    Warm Sunset
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/5 justify-start"
                    onClick={() => setChartColors(['#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff'])}
                  >
                    <div className="flex gap-1 mr-2">
                      {['#8b5cf6', '#a855f7', '#c084fc'].map(c => (
                        <div key={c} className="w-4 h-4 rounded" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    Purple Haze
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/5 justify-start"
                    onClick={() => setChartColors(['#ec4899', '#f472b6', '#fb7185', '#f43f5e', '#e11d48', '#be123c'])}
                  >
                    <div className="flex gap-1 mr-2">
                      {['#ec4899', '#f472b6', '#fb7185'].map(c => (
                        <div key={c} className="w-4 h-4 rounded" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    Pink Passion
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-white/10 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowChartConfig(false)}
                className="border-white/10 hover:bg-white/5"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
