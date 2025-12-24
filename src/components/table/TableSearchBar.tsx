import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Play, Loader2, ChevronDown, ChevronUp, Command, CornerDownLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// ============================================
// TYPES
// ============================================

export interface SearchMatch {
  rowIndex: number;
  columnName: string;
  value: string;
}

export interface TableSearchState {
  query: string;
  matches: SearchMatch[];
  currentMatchIndex: number;
  isHighlighting: boolean;
}

interface TableSearchBarProps {
  // Data to search through
  rows: Record<string, any>[];
  columns: string[];

  // Search state management
  searchState: TableSearchState;
  onSearchStateChange: (state: TableSearchState) => void;

  // Query execution
  connectionId: string;
  schemaName: string;
  tableName: string;
  onExecuteQuery?: (query: string) => Promise<void>;
  isExecutingQuery?: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TableSearchBar({
  rows,
  columns,
  searchState,
  onSearchStateChange,
  onExecuteQuery,
  isExecutingQuery,
}: TableSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isQueryMode, setIsQueryMode] = useState(false);
  const [queryText, setQueryText] = useState('');

  // Focus input on Cmd/Ctrl+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      // Escape to clear search
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        handleClearSearch();
        inputRef.current?.blur();
      }
      // Enter to navigate to next match
      if (e.key === 'Enter' && document.activeElement === inputRef.current && !isQueryMode) {
        if (e.shiftKey) {
          navigateToPreviousMatch();
        } else {
          navigateToNextMatch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchState, isQueryMode]);

  // Search logic
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      onSearchStateChange({
        query: '',
        matches: [],
        currentMatchIndex: -1,
        isHighlighting: false,
      });
      return;
    }

    const searchTerm = query.toLowerCase();
    const matches: SearchMatch[] = [];

    rows.forEach((row, rowIndex) => {
      columns.forEach(column => {
        const value = row[column];
        if (value === null || value === undefined) return;

        const strValue = String(value);
        if (strValue.toLowerCase().includes(searchTerm)) {
          matches.push({
            rowIndex,
            columnName: column,
            value: strValue,
          });
        }
      });
    });

    onSearchStateChange({
      query,
      matches,
      currentMatchIndex: matches.length > 0 ? 0 : -1,
      isHighlighting: matches.length > 0,
    });

    if (matches.length > 0) {
      toast.success(`Found ${matches.length} match${matches.length > 1 ? 'es' : ''}`, {
        duration: 2000,
        icon: '🔍'
      });
    }
  }, [rows, columns, onSearchStateChange]);

  const handleClearSearch = useCallback(() => {
    onSearchStateChange({
      query: '',
      matches: [],
      currentMatchIndex: -1,
      isHighlighting: false,
    });
    setQueryText('');
    setIsQueryMode(false);
  }, [onSearchStateChange]);

  const navigateToNextMatch = useCallback(() => {
    if (searchState.matches.length === 0) return;

    const nextIndex = (searchState.currentMatchIndex + 1) % searchState.matches.length;
    onSearchStateChange({
      ...searchState,
      currentMatchIndex: nextIndex,
    });
  }, [searchState, onSearchStateChange]);

  const navigateToPreviousMatch = useCallback(() => {
    if (searchState.matches.length === 0) return;

    const prevIndex = searchState.currentMatchIndex <= 0
      ? searchState.matches.length - 1
      : searchState.currentMatchIndex - 1;
    onSearchStateChange({
      ...searchState,
      currentMatchIndex: prevIndex,
    });
  }, [searchState, onSearchStateChange]);

  const handleQuerySubmit = useCallback(async () => {
    if (!queryText.trim() || !onExecuteQuery) return;

    // Basic validation for read-only query
    const upperQuery = queryText.toUpperCase().trim();
    if (!upperQuery.startsWith('SELECT')) {
      toast.error('Only SELECT queries are allowed');
      return;
    }

    // Check for dangerous keywords
    const dangerousKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE', 'ALTER', 'CREATE'];
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        toast.error(`${keyword} operations are not allowed`);
        return;
      }
    }

    try {
      await onExecuteQuery(queryText);
    } catch (error) {
      toast.error('Query execution failed');
    }
  }, [queryText, onExecuteQuery]);

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "relative flex items-center rounded-md transition-all duration-200",
        "bg-[#273142] border",
        isQueryMode
          ? "border-purple-500/50 w-[400px]"
          : searchState.isHighlighting
            ? "border-green-500/50 w-[280px]"
            : "border-white/10 w-[240px] focus-within:w-[280px] focus-within:border-white/20"
      )}>
        {/* Search/Query icon */}
        <div className="flex items-center justify-center w-9 h-8 shrink-0">
          {isQueryMode ? (
            <Play className="w-4 h-4 text-purple-400" />
          ) : (
            <Search className="w-4 h-4 text-gray-400" />
          )}
        </div>

        {/* Input */}
        <Input
          ref={inputRef}
          value={isQueryMode ? queryText : searchState.query}
          onChange={(e) => {
            if (isQueryMode) {
              setQueryText(e.target.value);
            } else {
              performSearch(e.target.value);
            }
          }}
          placeholder={isQueryMode ? "SELECT * FROM ..." : "Search in table..."}
          className={cn(
            "flex-1 h-8 bg-transparent border-0 px-0 text-sm",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "placeholder:text-gray-500"
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isQueryMode) {
              handleQuerySubmit();
            }
          }}
        />

        {/* Match counter / Clear button */}
        {(searchState.query || queryText) && (
          <div className="flex items-center gap-1 pr-2">
            {!isQueryMode && searchState.matches.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 bg-green-500/20 text-green-400 text-xs">
                {searchState.currentMatchIndex + 1}/{searchState.matches.length}
              </Badge>
            )}
            <button
              onClick={handleClearSearch}
              className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation buttons for search */}
      {!isQueryMode && searchState.matches.length > 1 && (
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateToPreviousMatch}
            className="h-7 w-7 text-gray-400 hover:text-white"
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateToNextMatch}
            className="h-7 w-7 text-gray-400 hover:text-white"
            title="Next match (Enter)"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Toggle query mode */}
      {onExecuteQuery && (
        <Button
          variant={isQueryMode ? "default" : "outline"}
          size="sm"
          onClick={() => {
            if (isQueryMode) {
              handleClearSearch();
            } else {
              setIsQueryMode(true);
              onSearchStateChange({
                query: '',
                matches: [],
                currentMatchIndex: -1,
                isHighlighting: false,
              });
            }
          }}
          className={cn(
            "h-8 gap-1.5 text-xs",
            isQueryMode
              ? "bg-purple-600 hover:bg-purple-700"
              : "border-white/10 bg-transparent text-gray-400 hover:bg-white/5"
          )}
        >
          <Play className="w-3 h-3" />
          SQL
        </Button>
      )}

      {/* Execute query button */}
      {isQueryMode && onExecuteQuery && (
        <Button
          size="sm"
          onClick={handleQuerySubmit}
          disabled={isExecutingQuery || !queryText.trim()}
          className="h-8 bg-purple-600 hover:bg-purple-700 gap-1.5"
        >
          {isExecutingQuery ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <CornerDownLeft className="w-3 h-3" />
              Run
            </>
          )}
        </Button>
      )}

      {/* Keyboard shortcut hint */}
      {!searchState.query && !isQueryMode && (
        <div className="hidden md:flex items-center gap-1 text-xs text-gray-500">
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px]">
            <Command className="w-2.5 h-2.5 inline" />F
          </kbd>
          <span>to search</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// HIGHLIGHT HELPER
// Used in table cells to highlight search matches
// ============================================

export function highlightSearchMatch(
  value: string,
  searchQuery: string,
  isCurrentMatch: boolean = false
): React.ReactNode {
  if (!searchQuery || !value) return value;

  const lowerValue = value.toLowerCase();
  const lowerQuery = searchQuery.toLowerCase();
  const index = lowerValue.indexOf(lowerQuery);

  if (index === -1) return value;

  const before = value.slice(0, index);
  const match = value.slice(index, index + searchQuery.length);
  const after = value.slice(index + searchQuery.length);

  return (
    <>
      {before}
      <mark className={cn(
        "px-0.5 rounded-sm",
        isCurrentMatch
          ? "bg-green-500 text-white font-medium"
          : "bg-yellow-500/40 text-yellow-100"
      )}>
        {match}
      </mark>
      {after}
    </>
  );
}
