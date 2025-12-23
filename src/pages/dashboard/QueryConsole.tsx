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
              ? 'bg-[#1e293b] text-white border-t-2 border-purple-500'
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
          {tab.isDirty && <span className="text-purple-400">•</span>}
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

  // Load chat session on mount
  useEffect(() => {
    if (connectionId && isOpen) {
      loadChatSession();
    }
  }, [connectionId, isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
          setStreamingContent(prev => prev + chunk.content);
        } else if (chunk.type === 'done') {
          // Add assistant message
          const assistantMessage: ChatMessage = {
            id: chunk.messageId || `msg-${Date.now()}`,
            sessionId: sessionId || '',
            role: 'assistant',
            content: streamingContent + (chunk.content || ''),
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
          setIsStreaming(false);
        } else if (chunk.type === 'error') {
          toast.error(chunk.error || 'Chat failed');
          setIsStreaming(false);
        }
      },
      (error) => {
        toast.error(error.message || 'Chat failed');
        setIsStreaming(false);
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

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="fixed right-4 top-20 z-50 bg-purple-600 hover:bg-purple-700 text-white"
        onClick={onToggle}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        AI Chat
      </Button>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0f172a] border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-white">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleClearChat} className="text-gray-400 hover:text-white">
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear Chat</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="sm" onClick={onToggle} className="text-gray-400 hover:text-white">
            <PanelRightClose className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Ask me to write SQL queries!</p>
              <p className="text-xs mt-1">e.g., "Show me all users who signed up last week"</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-lg p-3 ${msg.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#1e293b] text-gray-200'
                  }`}
              >
                <div className="text-sm whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
                {msg.role === 'assistant' && msg.sqlGenerated && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                      onClick={() => onInsertSQL(msg.sqlGenerated!)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Insert SQL to Editor
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isStreaming && streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-lg p-3 bg-[#1e293b] text-gray-200">
                <div className="text-sm whitespace-pre-wrap break-words">
                  {streamingContent}
                  <span className="animate-pulse">▌</span>
                </div>
              </div>
            </div>
          )}

          {isStreaming && !streamingContent && (
            <div className="flex justify-start">
              <div className="bg-[#1e293b] rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to generate SQL..."
            className="flex-1 bg-[#1e293b] border-white/10 text-white placeholder:text-gray-500 min-h-[60px] max-h-[120px] resize-none"
            disabled={isStreaming}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isStreaming}
            className="bg-purple-600 hover:bg-purple-700 px-4"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
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
      <DialogContent className="bg-[#1e293b] border-white/10 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-purple-400" />
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
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : filteredQueries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No saved queries found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredQueries.map(query => (
                <div
                  key={query.id}
                  className="p-3 rounded-lg bg-[#0f172a] border border-white/5 hover:border-purple-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-white flex items-center gap-2">
                        {query.name}
                        {query.isShared && (
                          <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">
                            Shared
                          </Badge>
                        )}
                      </h4>
                      {query.description && (
                        <p className="text-xs text-gray-400 mt-1">{query.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(query.queryText, query.id)}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                          >
                            {copiedId === query.id ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy SQL</TooltipContent>
                      </Tooltip>
                      {!isViewer && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(query.id)}
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  <pre className="text-xs text-gray-300 bg-black/20 p-2 rounded overflow-x-auto max-h-[80px]">
                    {query.queryText.substring(0, 200)}
                    {query.queryText.length > 200 && '...'}
                  </pre>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {query.lastUsedAt
                        ? `Used ${new Date(query.lastUsedAt).toLocaleDateString()}`
                        : 'Never used'}
                      <span>•</span>
                      <span>{query.useCount} uses</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleLoad(query)}
                      className="bg-purple-600 hover:bg-purple-700 text-xs"
                    >
                      Load Query
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
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
      <DialogContent className="bg-[#1e293b] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-purple-400" />
            Save Query
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Save this query to your collection for quick access later
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            <div>
              <Label htmlFor="query-shared" className="text-gray-300">Share with viewers</Label>
              <p className="text-xs text-gray-500">Viewers with access to this connection can use this query</p>
            </div>
            <Switch
              id="query-shared"
              checked={isShared}
              onCheckedChange={setIsShared}
            />
          </div>

          <div>
            <Label className="text-gray-300">Query Preview</Label>
            <pre className="mt-1 text-xs text-gray-400 bg-black/20 p-2 rounded max-h-[100px] overflow-auto">
              {queryText.substring(0, 300)}
              {queryText.length > 300 && '...'}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="bg-purple-600 hover:bg-purple-700"
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
  const [activeResultTab, setActiveResultTab] = useState('table');
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [showSavedQueries, setShowSavedQueries] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  // Chart config
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'bar',
    xAxis: '',
    yAxis: [],
    title: 'Query Results',
  });

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
      const schemasData = (response as any).schemas || response.data;
      if (response.success && schemasData) {
        setSchemas(schemasData);
        const preSelected = schemasData
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

    // Configure SQL language
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: () => {
        const suggestions: any[] = [];

        // Add table suggestions from schema
        if (schemaMetadata?.tables) {
          schemaMetadata.tables.forEach(table => {
            if (selectedSchemas.includes(table.schema)) {
              // Table name
              suggestions.push({
                label: `${table.schema}.${table.name}`,
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: `${table.schema}.${table.name}`,
                detail: 'Table',
              });

              // Column names
              table.columns.forEach(col => {
                suggestions.push({
                  label: `${table.name}.${col.name}`,
                  kind: monaco.languages.CompletionItemKind.Field,
                  insertText: col.name,
                  detail: `${col.type} - ${table.name}`,
                });
              });
            }
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

  const chartData = useMemo(() => {
    if (!activeTab?.results?.data?.length || !chartConfig.xAxis || !chartConfig.yAxis.length) {
      return null;
    }

    const labels = activeTab.results.data.map(row => String(row[chartConfig.xAxis] ?? 'N/A'));
    const colors = [
      { bg: 'rgba(139, 92, 246, 0.7)', border: '#8b5cf6' },
      { bg: 'rgba(6, 182, 212, 0.7)', border: '#06b6d4' },
      { bg: 'rgba(16, 185, 129, 0.7)', border: '#10b981' },
    ];

    const datasets = chartConfig.yAxis.map((field, idx) => ({
      label: field,
      data: activeTab.results!.data.map(row => Number(String(row[field]).replace(/[,$]/g, '')) || 0),
      backgroundColor: chartConfig.type === 'pie' || chartConfig.type === 'doughnut'
        ? colors.map(c => c.bg)
        : colors[idx % colors.length].bg,
      borderColor: colors[idx % colors.length].border,
      borderWidth: 2,
      tension: 0.4,
    }));

    return { labels, datasets };
  }, [activeTab?.results, chartConfig]);

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
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Run
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
              <DropdownMenuContent className="bg-[#273142] border-white/10 text-white">
                <DropdownMenuLabel className="text-gray-400 text-xs">Select schemas</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {schemas.map(schema => (
                  <DropdownMenuCheckboxItem
                    key={schema.id}
                    checked={selectedSchemas.includes(schema.schema_name)}
                    onCheckedChange={() => toggleSchema(schema.schema_name)}
                    className="text-white hover:bg-white/10"
                  >
                    {schema.schema_name}
                    <Badge variant="outline" className="ml-2 text-xs">{schema.table_count}</Badge>
                  </DropdownMenuCheckboxItem>
                ))}
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
                  className={showChatSidebar ? 'bg-purple-600' : 'border-purple-500/50 text-purple-400'}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  AI Chat
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle AI Assistant</TooltipContent>
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
                    theme="vs-dark"
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
                        <TabsTrigger value="table" className="data-[state=active]:bg-[#3b82f6]">
                          <TableIcon className="w-4 h-4 mr-2" />
                          Table
                        </TabsTrigger>
                        <TabsTrigger value="chart" className="data-[state=active]:bg-[#3b82f6]">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Chart
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="data-[state=active]:bg-[#3b82f6]">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Logs
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <TabsContent value="table" className="h-full m-0">
                        {activeTab?.results ? (
                          <DataTable
                            data={activeTab.results.data}
                            columns={activeTab.results.columns.map(col => ({
                              key: col,
                              header: col,
                            }))}
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

                      <TabsContent value="chart" className="h-full m-0 p-4">
                        {chartData ? (
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

                      <TabsContent value="logs" className="h-full m-0">
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
              <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
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
      </div>
    </TooltipProvider>
  );
}
