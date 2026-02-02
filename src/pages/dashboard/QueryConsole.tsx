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
  AlignLeft,
  Columns,
  Terminal,
  Undo2,
  Redo2,
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
    <div className="flex items-center gap-0.5 px-2 h-9 bg-slate-900 border-b border-slate-800 overflow-x-auto">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`
            group flex items-center gap-2 px-3 h-8 rounded-md text-[13px] cursor-pointer
            transition-all duration-150 min-w-[100px] max-w-[180px]
            ${activeTabId === tab.id
              ? 'bg-slate-800 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }
          `}
          onClick={() => onTabSelect(tab.id)}
          onDoubleClick={() => handleDoubleClick(tab.id, tab.title)}
        >
          {tab.isRunning && <Loader2 className="w-3 h-3 animate-spin text-emerald-400 shrink-0" />}
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
              className="bg-transparent border-none outline-none w-full text-white text-[13px]"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{tab.title}</span>
          )}
          {tab.isDirty && <span className="text-indigo-400 shrink-0">•</span>}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity ml-auto shrink-0"
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
            className="h-7 w-7 p-0 text-slate-500 hover:text-white hover:bg-slate-800 ml-1"
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

  // Helper function to render formatted text with bold, headings, bullets, etc.
  const renderFormattedText = (text: string) => {
    // Split by lines to handle headings and bullets
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
    // Handle **bold** and `code`
    const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        // Check if it's a heading-like pattern inside text
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
        className="fixed right-4 top-20 z-50 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
        onClick={onToggle}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Chat
      </Button>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 min-w-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-200 text-sm">Chat</span>
        </div>
        <div className="flex items-center">
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleClearChat} className="h-7 w-7 p-0 text-slate-500 hover:text-slate-300 hover:bg-slate-800">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear Chat</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="sm" onClick={onToggle} className="h-7 w-7 p-0 text-slate-500 hover:text-slate-300 hover:bg-slate-800">
            <PanelRightClose className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages - Fixed height container */}
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
                  <button className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-300 transition-colors">
                    "What tables do I have?"
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-300 transition-colors">
                    "Show me recent orders"
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-300 transition-colors">
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
                  {/* Message Content */}
                  <div className="text-sm leading-relaxed space-y-1">
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
                <div className="max-w-[90%] text-slate-300 py-2">
                  <div className="text-sm leading-relaxed space-y-1">
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
    removeTab: removeTabFromStore,
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
  // Store editor models per tab (each model has its own undo/redo stack)
  const editorModelsRef = useRef<Map<string, any>>(new Map());
  const editorViewStatesRef = useRef<Map<string, any>>(new Map());
  const previousTabIdRef = useRef<string | null>(null);

  // Wrapper to clean up model when tab is removed
  const removeTab = (tabId: string) => {
    // Dispose of the model for this tab
    const model = editorModelsRef.current.get(tabId);
    if (model) {
      model.dispose();
      editorModelsRef.current.delete(tabId);
    }
    editorViewStatesRef.current.delete(tabId);
    removeTabFromStore(tabId);
  };

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
  const activeTabIdRef = useRef<string | null>(activeTabId);

  // Update activeTabIdRef when activeTabId changes
  useEffect(() => {
    activeTabIdRef.current = activeTabId;
  }, [activeTabId]);

  // ============================================
  // SAVE/RESTORE EDITOR MODEL PER TAB (separate undo/redo stacks)
  // ============================================

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !activeTabId) return;

    const monaco = monacoRef.current;
    const editor = editorRef.current;

    // Save view state of previous tab
    if (previousTabIdRef.current && previousTabIdRef.current !== activeTabId) {
      const viewState = editor.saveViewState();
      if (viewState) {
        editorViewStatesRef.current.set(previousTabIdRef.current, viewState);
      }
    }

    // Get or create model for this tab
    let model = editorModelsRef.current.get(activeTabId);
    if (!model) {
      // Create a new model for this tab with a unique URI
      const uri = monaco.Uri.parse(`inmemory://tab-${activeTabId}.sql`);
      model = monaco.editor.createModel(activeTab?.query || '', 'sql', uri);
      editorModelsRef.current.set(activeTabId, model);

      // Add content change listener to sync with tab state
      model.onDidChangeContent(() => {
        const currentTabId = activeTabIdRef.current;
        if (currentTabId && model) {
          updateTabQuery(currentTabId, model.getValue());
        }
      });
    }

    // Set the model on the editor (this switches undo/redo stack)
    if (editor.getModel() !== model) {
      editor.setModel(model);
    }

    // Restore view state for current tab (cursor position, scroll, etc.)
    const savedViewState = editorViewStatesRef.current.get(activeTabId);
    if (savedViewState) {
      editor.restoreViewState(savedViewState);
    }

    // Update previous tab reference
    previousTabIdRef.current = activeTabId;
  }, [activeTabId]);

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

    // Define custom theme with enhanced SQL syntax highlighting
    monaco.editor.defineTheme('chatsql-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // SQL Keywords - bright blue
        { token: 'keyword', foreground: '7dd3fc', fontStyle: 'bold' },
        { token: 'keyword.sql', foreground: '7dd3fc', fontStyle: 'bold' },
        // Strings - green
        { token: 'string', foreground: '4ade80' },
        { token: 'string.sql', foreground: '4ade80' },
        // Numbers - orange
        { token: 'number', foreground: 'fb923c' },
        { token: 'number.sql', foreground: 'fb923c' },
        // Comments - gray italic
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'comment.sql', foreground: '64748b', fontStyle: 'italic' },
        // Types/Functions - purple
        { token: 'type', foreground: 'c084fc' },
        { token: 'predefined.sql', foreground: 'c084fc' },
        // Operators - yellow
        { token: 'operator', foreground: 'fbbf24' },
        { token: 'operator.sql', foreground: 'fbbf24' },
        // Identifiers - light cyan
        { token: 'identifier', foreground: 'e2e8f0' },
        // Delimiters - slate
        { token: 'delimiter', foreground: '94a3b8' },
      ],
      colors: {
        'editor.background': '#0a0f1a',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#1e293b50',
        'editor.lineHighlightBorder': '#334155',
        'editor.selectionBackground': '#6366f180',
        'editor.inactiveSelectionBackground': '#4f46e540',
        'editor.selectionHighlightBackground': '#3730a340',
        'editor.wordHighlightBackground': '#1e3a8a40',
        'editor.wordHighlightStrongBackground': '#1e3a8a60',
        'editor.findMatchBackground': '#fbbf2480',
        'editor.findMatchHighlightBackground': '#f59e0b40',
        'editorCursor.foreground': '#7dd3fc',
        'editorCursor.background': '#0a0f1a',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editorIndentGuide.background': '#1e293b',
        'editorIndentGuide.activeBackground': '#334155',
        'editorWidget.background': '#0f172a',
        'editorWidget.border': '#1e293b',
        'editorSuggestWidget.background': '#0f172a',
        'editorSuggestWidget.border': '#1e293b',
        'editorSuggestWidget.foreground': '#e2e8f0',
        'editorSuggestWidget.selectedBackground': '#3b82f6',
        'editorSuggestWidget.highlightForeground': '#7dd3fc',
        'editorHoverWidget.background': '#0f172a',
        'editorHoverWidget.border': '#1e293b',
        'list.activeSelectionBackground': '#3b82f6',
        'list.inactiveSelectionBackground': '#1e40af',
        'list.hoverBackground': '#1e293b',
        'input.background': '#0f172a',
        'input.border': '#1e293b',
        'input.foreground': '#e2e8f0',
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#334155',
        'scrollbarSlider.hoverBackground': '#475569',
        'scrollbarSlider.activeBackground': '#64748b',
        'editorGutter.background': '#0a0f1a',
        'editorBracketMatch.background': '#6366f140',
        'editorBracketMatch.border': '#6366f1',
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
  // SQL FORMATTER
  // ============================================

  const formatSQL = (sql: string): string => {
    if (!sql.trim()) return sql;

    // Keywords that should start on a new line
    const newlineKeywords = [
      'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
      'INNER JOIN', 'OUTER JOIN', 'FULL JOIN', 'CROSS JOIN', 'ON', 'GROUP BY',
      'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'EXCEPT', 'INTERSECT',
      'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE',
      'ALTER TABLE', 'DROP TABLE', 'CREATE INDEX', 'WITH', 'CASE', 'WHEN',
      'THEN', 'ELSE', 'END'
    ];

    let formatted = sql.trim();

    // First, extract string literals and replace with placeholders
    // This prevents commas/keywords inside strings from being processed
    const strings: string[] = [];
    formatted = formatted.replace(/'(?:[^'\\]|\\.)*'/g, (match) => {
      const idx = strings.length;
      strings.push(match);
      return `___STR${idx}___`;
    });

    // Normalize all whitespace to single spaces
    formatted = formatted.replace(/\s+/g, ' ');

    // Add newlines before major keywords
    newlineKeywords.forEach(keyword => {
      const regex = new RegExp(`\\s${keyword}\\s`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword} `);
    });

    // Handle commas - only add newlines for top-level commas (not inside parentheses)
    let result = '';
    let parenDepth = 0;
    for (let i = 0; i < formatted.length; i++) {
      const char = formatted[i];
      if (char === '(') {
        parenDepth++;
        result += char;
      } else if (char === ')') {
        parenDepth--;
        result += char;
      } else if (char === ',' && parenDepth === 0) {
        // Top-level comma - add newline and indent
        result += ',\n  ';
        // Skip any following whitespace
        while (i + 1 < formatted.length && formatted[i + 1] === ' ') {
          i++;
        }
      } else {
        result += char;
      }
    }
    formatted = result;

    // Restore string literals
    for (let i = 0; i < strings.length; i++) {
      formatted = formatted.replace(`___STR${i}___`, strings[i]);
    }

    // Indent lines that don't start with main keywords
    const lines = formatted.split('\n');
    const mainKeywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'WITH'];

    formatted = lines.map((line, idx) => {
      const trimmed = line.trim();
      if (idx === 0) return trimmed;

      const startsWithMain = mainKeywords.some(kw =>
        trimmed.toUpperCase().startsWith(kw)
      );

      if (!startsWithMain && trimmed) {
        return '  ' + trimmed;
      }
      return trimmed;
    }).join('\n');

    return formatted;
  };

  const handleFormatSQL = () => {
    if (!activeTab?.query.trim() || !activeTabId) return;

    const formatted = formatSQL(activeTab.query);
    // Get the model for this tab and update it (this preserves undo stack)
    const model = editorModelsRef.current.get(activeTabId);
    if (model) {
      // Use pushEditOperations to allow undo
      model.pushEditOperations(
        [],
        [{
          range: model.getFullModelRange(),
          text: formatted
        }],
        () => null
      );
    }
    toast.success('SQL formatted');
  };

  // Undo/Redo handlers
  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'undo', null);
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'redo', null);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleNewTab = () => {
    if (!connectionId) return;
    const tabCount = getTabsForConnection(connectionId).length;
    addTab(connectionId, `Query ${tabCount + 1}`, '-- New query\nSELECT * FROM ');
  };

  const handleInsertSQL = (sql: string) => {
    if (!activeTab || !activeTabId) return;
    // Clean up the SQL
    const cleanSQL = sql.replace(/\\n/g, '\n');
    // Get the model for this tab and update it
    const model = editorModelsRef.current.get(activeTabId);
    if (model) {
      // Use pushEditOperations to allow undo
      model.pushEditOperations(
        [],
        [{
          range: model.getFullModelRange(),
          text: cleanSQL
        }],
        () => null
      );
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
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center text-slate-500">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <h2 className="text-lg font-medium text-slate-300 mb-1">No Connection Selected</h2>
          <p className="text-sm">Select a database connection to start querying</p>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-slate-950">
        {/* Toolbar */}
        <div className="h-12 border-b border-slate-800 flex items-center justify-between px-3 bg-slate-900 shrink-0">
          {/* Left: Run & Actions */}
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[13px]"
                  onClick={handleRunQuery}
                  disabled={activeTab?.isRunning || !!error}
                >
                  {activeTab?.isRunning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Running
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      Run
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Run Query (Ctrl+Enter)</TooltipContent>
            </Tooltip>

            <div className="h-5 w-px bg-slate-700 mx-1" />

            {/* Format SQL Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFormatSQL}
                  disabled={!activeTab?.query.trim()}
                  className="h-8 px-2.5 text-slate-400 hover:text-white hover:bg-slate-800 text-[13px]"
                >
                  <AlignLeft className="w-3.5 h-3.5 mr-1.5" />
                  Format
                </Button>
              </TooltipTrigger>
              <TooltipContent>Format SQL</TooltipContent>
            </Tooltip>

            {/* Undo Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (⌘Z)</TooltipContent>
            </Tooltip>

            {/* Redo Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
            </Tooltip>

            <div className="h-5 w-px bg-slate-700 mx-1" />

            {/* Schema Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2.5 text-slate-400 hover:text-white hover:bg-slate-800 text-[13px]">
                  <Database className="w-3.5 h-3.5 mr-1.5" />
                  {selectedSchemas.length === 1 ? selectedSchemas[0] : `${selectedSchemas.length} schemas`}
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white min-w-[200px]">
                <DropdownMenuLabel className="text-slate-400 text-xs px-2 py-1.5">Select schemas</DropdownMenuLabel>
                <div className="px-2 pb-2 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs flex-1 text-slate-400 hover:text-white hover:bg-slate-700"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleAllSchemas(true);
                    }}
                  >
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs flex-1 text-slate-400 hover:text-white hover:bg-slate-700"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleAllSchemas(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
                <DropdownMenuSeparator className="bg-slate-700" />
                <div className="max-h-[300px] overflow-y-auto">
                  {schemas.map(schema => (
                    <DropdownMenuCheckboxItem
                      key={schema.id}
                      checked={selectedSchemas.includes(schema.schema_name)}
                      onCheckedChange={() => toggleSchema(schema.schema_name)}
                      className="text-slate-300 hover:bg-slate-700 cursor-pointer text-[13px]"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <span className="flex items-center justify-between w-full gap-2">
                        <span className="truncate">{schema.schema_name}</span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {schema.table_count}
                        </span>
                      </span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-5 w-px bg-slate-700 mx-1" />

            {/* Save & Load */}
            {!isViewer && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    disabled={!activeTab?.query.trim()}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <Save className="w-3.5 h-3.5" />
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
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Saved Queries</TooltipContent>
            </Tooltip>
          </div>

          {/* Right: AI Chat Toggle */}
          <div className="flex items-center gap-2">
            {isViewer && (
              <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-xs">
                Viewer
              </Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showChatSidebar ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowChatSidebar(!showChatSidebar)}
                  className={`h-8 px-2.5 text-[13px] ${showChatSidebar
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                  Chat
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Chat</TooltipContent>
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
                <div className="h-full flex flex-col bg-[#0a0f1a]">
                  <Editor
                    height="100%"
                    defaultLanguage="sql"
                    onMount={handleEditorDidMount}
                    theme="chatsql-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code", "Consolas", monospace',
                      fontLigatures: true,
                      fontWeight: '400',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on',
                      suggestOnTriggerCharacters: true,
                      quickSuggestions: true,
                      padding: { top: 16, bottom: 16 },
                      lineHeight: 22,
                      letterSpacing: 0.5,
                      renderLineHighlight: 'all',
                      renderLineHighlightOnlyWhenFocus: false,
                      cursorBlinking: 'smooth',
                      cursorSmoothCaretAnimation: 'on',
                      cursorStyle: 'line',
                      cursorWidth: 2,
                      smoothScrolling: true,
                      bracketPairColorization: { enabled: true },
                      guides: {
                        bracketPairs: true,
                        indentation: true,
                        highlightActiveBracketPair: true,
                      },
                      renderWhitespace: 'none',
                      scrollbar: {
                        vertical: 'auto',
                        horizontal: 'auto',
                        useShadows: false,
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10,
                      },
                      overviewRulerBorder: false,
                      hideCursorInOverviewRuler: true,
                      matchBrackets: 'always',
                      lineDecorationsWidth: 8,
                      lineNumbersMinChars: 4,
                    }}
                  />
                  {error && (
                    <div className="bg-red-950/50 border-t border-red-900/50 px-3 py-2 flex items-center gap-2 text-red-400 text-xs">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-slate-800 h-1.5" />

              {/* Results Panel */}
              <ResizablePanel defaultSize={60} minSize={20}>
                <div className="h-full bg-slate-950 flex flex-col">
                  <Tabs value={activeResultTab} onValueChange={setActiveResultTab} className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between px-3 h-10 border-b border-slate-800 bg-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-slate-300">Results</span>
                        {activeTab?.results && (
                          <span className="text-xs text-slate-500">
                            {activeTab.results.rowCount} rows • {activeTab.results.executionTime}ms
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <TabsList className="bg-slate-800 border-0 h-7 p-0.5">
                          <TabsTrigger value="table" className="h-6 px-2 text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
                            <TableIcon className="w-3 h-3 mr-1" />
                            Table
                          </TabsTrigger>
                          <TabsTrigger value="chart" className="h-6 px-2 text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Chart
                          </TabsTrigger>
                          <TabsTrigger value="logs" className="h-6 px-2 text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
                            <Terminal className="w-3 h-3 mr-1" />
                            Logs
                          </TabsTrigger>
                        </TabsList>

                        {/* Chart Config Button */}
                        {activeResultTab === 'chart' && activeTab?.results && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowChartConfig(true)}
                            className="h-7 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <Settings2 className="w-3 h-3 mr-1" />
                            Configure
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                      <TabsContent value="table" className="h-full w-full m-0 absolute inset-0">
                        {activeTab?.isRunning ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-400" />
                              <p className="text-slate-300 text-sm">Executing query...</p>
                            </div>
                          </div>
                        ) : activeTab?.results ? (
                          <DataTable
                            data={activeTab.results.data}
                            columns={activeTab.results.columns}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-500">
                            <div className="text-center">
                              <TableIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">Run a query to see results</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="chart" className="h-full w-full m-0 p-4 absolute inset-0">
                        {activeTab?.isRunning ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-400" />
                              <p className="text-slate-300 text-sm">Generating chart...</p>
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
                          <div className="flex items-center justify-center h-full text-slate-500">
                            <div className="text-center">
                              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">Run a query to visualize data</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="logs" className="h-full w-full m-0 absolute inset-0">
                        <ScrollArea className="h-full p-3">
                          <div className="font-mono text-xs space-y-0.5">
                            {executionLogs.length === 0 ? (
                              <p className="text-slate-500">No execution logs yet</p>
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
