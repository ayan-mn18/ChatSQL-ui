import { useCallback, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, ChevronUp, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

  // Optional - kept for backward compatibility but no longer used
  connectionId?: string;
  schemaName?: string;
  tableName?: string;
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
}: TableSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

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
      if (e.key === 'Enter' && document.activeElement === inputRef.current) {
        if (e.shiftKey) {
          navigateToPreviousMatch();
        } else {
          navigateToNextMatch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchState]);

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
  }, [rows, columns, onSearchStateChange]);

  const handleClearSearch = useCallback(() => {
    onSearchStateChange({
      query: '',
      matches: [],
      currentMatchIndex: -1,
      isHighlighting: false,
    });
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

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "relative flex items-center rounded-md transition-all duration-200",
        "bg-[#273142] border",
        searchState.isHighlighting
          ? "border-green-500/50 w-[240px]"
          : "border-white/10 w-[200px] focus-within:w-[240px] focus-within:border-white/20"
      )}>
        {/* Search icon */}
        <div className="flex items-center justify-center w-8 h-7 shrink-0">
          <Search className="w-3.5 h-3.5 text-gray-400" />
        </div>

        {/* Input */}
        <Input
          ref={inputRef}
          value={searchState.query}
          onChange={(e) => performSearch(e.target.value)}
          placeholder="Search rows..."
          className={cn(
            "flex-1 h-7 bg-transparent border-0 px-0 text-xs",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "placeholder:text-gray-500"
          )}
        />

        {/* Match counter / Clear button */}
        {searchState.query && (
          <div className="flex items-center gap-1 pr-2">
            {searchState.matches.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 bg-green-500/20 text-green-400 text-[10px]">
                {searchState.currentMatchIndex + 1}/{searchState.matches.length}
              </Badge>
            )}
            <button
              onClick={handleClearSearch}
              className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation buttons for search */}
      {searchState.matches.length > 1 && (
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateToPreviousMatch}
            className="h-6 w-6 text-gray-400 hover:text-white"
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateToNextMatch}
            className="h-6 w-6 text-gray-400 hover:text-white"
            title="Next match (Enter)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Keyboard shortcut hint */}
      {!searchState.query && (
        <div className="hidden md:flex items-center gap-1 text-[10px] text-gray-500">
          <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px]">
            <Command className="w-2 h-2 inline" />F
          </kbd>
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
      <span className={cn(
        "px-0.5 rounded-sm",
        isCurrentMatch
          ? "bg-green-500 text-white font-medium"
          : "bg-yellow-400/30 text-yellow-200"
      )}>
        {match}
      </span>
      {after}
    </>
  );
}
