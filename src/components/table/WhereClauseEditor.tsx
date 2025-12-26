import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Play, Loader2, X, AlertCircle, CheckCircle2, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { TableColumnDef } from '@/types';

// ============================================
// TYPES
// ============================================

interface WhereClauseEditorProps {
  schemaName: string;
  tableName: string;
  columns: TableColumnDef[];
  onExecuteQuery: (fullQuery: string) => Promise<void>;
  isExecuting: boolean;
  className?: string;
}

interface ColumnSuggestion {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

interface ValidationError {
  message: string;
  position?: number;
}

// SQL operators that can be followed by a value
const VALUE_OPERATORS = ['=', '!=', '<>', '>', '<', '>=', '<=', 'LIKE', 'ILIKE', 'IN', 'NOT IN', 'BETWEEN'];
const NULL_OPERATORS = ['IS NULL', 'IS NOT NULL'];
const LOGICAL_OPERATORS = ['AND', 'OR', 'NOT'];
const ALL_KEYWORDS = [...VALUE_OPERATORS, ...NULL_OPERATORS, ...LOGICAL_OPERATORS, '(', ')'];

// PostgreSQL type categories for validation
const NUMERIC_TYPES = ['int2', 'int4', 'int8', 'integer', 'bigint', 'smallint', 'numeric', 'decimal', 'real', 'float4', 'float8', 'double precision', 'serial', 'bigserial', 'smallserial', 'money'];
const STRING_TYPES = ['varchar', 'character varying', 'char', 'character', 'text', 'citext', 'name', 'uuid', 'bpchar'];
const BOOLEAN_TYPES = ['bool', 'boolean'];
const DATE_TYPES = ['date', 'time', 'timetz', 'timestamp', 'timestamptz', 'interval'];
const JSON_TYPES = ['json', 'jsonb'];
const ARRAY_TYPES_SUFFIX = '[]';

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTypeCategory(udtName: string): 'numeric' | 'string' | 'boolean' | 'date' | 'json' | 'array' | 'unknown' {
  const lowerType = udtName.toLowerCase();

  if (lowerType.endsWith(ARRAY_TYPES_SUFFIX)) return 'array';
  if (NUMERIC_TYPES.some(t => lowerType.includes(t))) return 'numeric';
  if (STRING_TYPES.some(t => lowerType.includes(t))) return 'string';
  if (BOOLEAN_TYPES.some(t => lowerType.includes(t))) return 'boolean';
  if (DATE_TYPES.some(t => lowerType.includes(t))) return 'date';
  if (JSON_TYPES.some(t => lowerType.includes(t))) return 'json';

  return 'unknown';
}

function validateValueForType(value: string, udtName: string): ValidationError | null {
  const category = getTypeCategory(udtName);
  const trimmedValue = value.trim();

  // Handle NULL
  if (trimmedValue.toUpperCase() === 'NULL') {
    return null; // NULL is valid for all types
  }

  // Handle quoted strings - extract the content
  const isQuoted = (trimmedValue.startsWith("'") && trimmedValue.endsWith("'")) ||
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"'));
  const unquotedValue = isQuoted ? trimmedValue.slice(1, -1) : trimmedValue;

  switch (category) {
    case 'numeric':
      if (isQuoted) {
        return { message: `Numeric column "${udtName}" should not have quoted values. Use: ${unquotedValue}` };
      }
      if (!/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
        return { message: `Expected numeric value for type "${udtName}", got: ${trimmedValue}` };
      }
      break;

    case 'boolean':
      const validBooleans = ['true', 'false', 't', 'f', '1', '0', 'yes', 'no', 'on', 'off'];
      if (!validBooleans.includes(unquotedValue.toLowerCase())) {
        return { message: `Expected boolean value (true/false), got: ${trimmedValue}` };
      }
      break;

    case 'string':
    case 'date':
      if (!isQuoted && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedValue)) {
        // Not a column reference, should be quoted
        return { message: `String/date values should be quoted. Use: '${trimmedValue}'` };
      }
      break;

    case 'json':
      if (isQuoted) {
        try {
          JSON.parse(unquotedValue);
        } catch {
          return { message: `Invalid JSON value: ${unquotedValue}` };
        }
      }
      break;

    case 'array':
      // Array literals in PostgreSQL use ARRAY[] or '{}'
      if (!trimmedValue.startsWith('ARRAY[') && !trimmedValue.startsWith("'{") && !trimmedValue.startsWith('ANY(')) {
        return { message: `Array values should use ARRAY[...] or '{...}' syntax` };
      }
      break;
  }

  return null;
}

// Parse WHERE clause to extract column references and values
function parseWhereClause(clause: string, columns: ColumnSuggestion[]): {
  columnRefs: { column: string; operator: string; value: string; position: number }[];
  errors: ValidationError[];
} {
  const columnRefs: { column: string; operator: string; value: string; position: number }[] = [];
  const errors: ValidationError[] = [];
  const columnNames = columns.map(c => c.name.toLowerCase());

  // Simple tokenization - this is a basic parser
  const tokens = clause.match(/('[^']*'|"[^"]*"|\S+)/g) || [];

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    const tokenLower = token.toLowerCase();

    // Check if this token is a column name
    if (columnNames.includes(tokenLower)) {
      const col = columns.find(c => c.name.toLowerCase() === tokenLower);
      if (col && i + 1 < tokens.length) {
        const nextToken = tokens[i + 1].toUpperCase();

        // Check for IS NULL / IS NOT NULL
        if (nextToken === 'IS') {
          if (i + 2 < tokens.length) {
            const afterIs = tokens[i + 2].toUpperCase();
            if (afterIs === 'NULL') {
              columnRefs.push({ column: col.name, operator: 'IS NULL', value: '', position: i });
              i += 3;
              continue;
            } else if (afterIs === 'NOT' && i + 3 < tokens.length && tokens[i + 3].toUpperCase() === 'NULL') {
              columnRefs.push({ column: col.name, operator: 'IS NOT NULL', value: '', position: i });
              i += 4;
              continue;
            }
          }
        }

        // Check for comparison operators
        if (VALUE_OPERATORS.includes(nextToken) || ['=', '!=', '<>', '>', '<', '>=', '<='].includes(nextToken)) {
          if (i + 2 < tokens.length) {
            const value = tokens[i + 2];
            columnRefs.push({ column: col.name, operator: nextToken, value, position: i });
            i += 3;
            continue;
          }
        }
      }
    }
    i++;
  }

  return { columnRefs, errors };
}

// ============================================
// MAIN COMPONENT
// ============================================

export function WhereClauseEditor({
  schemaName,
  tableName,
  columns,
  onExecuteQuery,
  isExecuting,
  className,
}: WhereClauseEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [whereClause, setWhereClause] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Convert columns to suggestions format
  const columnSuggestions: ColumnSuggestion[] = useMemo(() =>
    columns.map(col => ({
      name: col.name,
      type: col.udt_name || col.data_type,
      isPrimaryKey: col.is_primary_key,
      isForeignKey: col.is_foreign_key,
    })),
    [columns]
  );

  // Get current word being typed (for autocomplete)
  const getCurrentWord = useCallback((): { word: string; start: number; end: number } => {
    const beforeCursor = whereClause.slice(0, cursorPosition);
    const afterCursor = whereClause.slice(cursorPosition);

    // Find word boundaries
    const wordStart = beforeCursor.search(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    const wordEndMatch = afterCursor.match(/^[a-zA-Z0-9_]*/);
    const wordEnd = cursorPosition + (wordEndMatch ? wordEndMatch[0].length : 0);

    if (wordStart === -1) {
      return { word: '', start: cursorPosition, end: cursorPosition };
    }

    return {
      word: whereClause.slice(wordStart, wordEnd),
      start: wordStart,
      end: wordEnd,
    };
  }, [whereClause, cursorPosition]);

  // Filter suggestions based on current input
  const filteredSuggestions = useMemo(() => {
    const { word } = getCurrentWord();
    const wordLower = word.toLowerCase();

    if (!word) {
      return columnSuggestions;
    }

    // First, filter columns that match
    const matchingColumns = columnSuggestions.filter(col =>
      col.name.toLowerCase().includes(wordLower)
    );

    // Also suggest SQL keywords if they match
    const matchingKeywords = ALL_KEYWORDS.filter(kw =>
      kw.toLowerCase().startsWith(wordLower)
    );

    return [
      ...matchingColumns.map(col => ({ ...col, isKeyword: false })),
      ...matchingKeywords.map(kw => ({ name: kw, type: 'keyword', isPrimaryKey: false, isForeignKey: false, isKeyword: true })),
    ];
  }, [columnSuggestions, getCurrentWord]);

  // Validate the WHERE clause
  const validateClause = useCallback((clause: string) => {
    if (!clause.trim()) {
      setValidationErrors([]);
      setIsValid(true);
      return;
    }

    const errors: ValidationError[] = [];

    // Check for dangerous keywords
    const upperClause = clause.toUpperCase();
    const dangerousKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE'];
    for (const keyword of dangerousKeywords) {
      if (upperClause.includes(keyword)) {
        errors.push({ message: `Dangerous keyword "${keyword}" is not allowed in WHERE clause` });
      }
    }

    // Check for semicolons (SQL injection prevention)
    if (clause.includes(';')) {
      errors.push({ message: 'Multiple statements (;) are not allowed' });
    }

    // Check for subqueries (basic check)
    if (upperClause.includes('SELECT')) {
      errors.push({ message: 'Subqueries are not allowed in WHERE clause' });
    }

    // Parse and validate column references with their values
    const { columnRefs } = parseWhereClause(clause, columnSuggestions);

    for (const ref of columnRefs) {
      const col = columnSuggestions.find(c => c.name.toLowerCase() === ref.column.toLowerCase());
      if (col && ref.value) {
        const typeError = validateValueForType(ref.value, col.type);
        if (typeError) {
          errors.push(typeError);
        }
      }
    }

    // Check for unmatched parentheses
    const openParens = (clause.match(/\(/g) || []).length;
    const closeParens = (clause.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push({ message: 'Unmatched parentheses' });
    }

    // Check for unmatched quotes
    const singleQuotes = (clause.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      errors.push({ message: 'Unmatched single quotes' });
    }

    setValidationErrors(errors);
    setIsValid(errors.length === 0);
  }, [columnSuggestions]);

  // Validate on input change
  useEffect(() => {
    const timeout = setTimeout(() => {
      validateClause(whereClause);
    }, 300);
    return () => clearTimeout(timeout);
  }, [whereClause, validateClause]);

  // Handle suggestion selection
  const selectSuggestion = useCallback((suggestion: { name: string; isKeyword?: boolean }) => {
    const { start, end } = getCurrentWord();
    const before = whereClause.slice(0, start);
    const after = whereClause.slice(end);

    // For columns, add appropriate formatting
    let insertText = suggestion.name;
    if (!suggestion.isKeyword) {
      // It's a column - check if we need to add quotes for special characters
      if (/[^a-zA-Z0-9_]/.test(suggestion.name)) {
        insertText = `"${suggestion.name}"`;
      }
    }

    const newClause = before + insertText + ' ' + after.trimStart();
    setWhereClause(newClause);
    setShowSuggestions(false);

    // Focus back on input and set cursor position
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPosition = start + insertText.length + 1;
        inputRef.current.setSelectionRange(newPosition, newPosition);
        setCursorPosition(newPosition);
      }
    }, 0);
  }, [whereClause, getCurrentWord]);

  // Handle keyboard navigation in suggestions
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev =>
            (prev + 1) % filteredSuggestions.length
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev =>
            prev <= 0 ? filteredSuggestions.length - 1 : prev - 1
          );
          break;
        case 'Tab':
        case 'Enter':
          if (showSuggestions && filteredSuggestions[selectedSuggestionIndex]) {
            e.preventDefault();
            selectSuggestion(filteredSuggestions[selectedSuggestionIndex]);
          } else if (e.key === 'Enter' && !showSuggestions) {
            e.preventDefault();
            handleExecute();
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  }, [showSuggestions, filteredSuggestions, selectedSuggestionIndex, selectSuggestion]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWhereClause(value);
    setCursorPosition(e.target.selectionStart || 0);
    setShowSuggestions(true);
    setSelectedSuggestionIndex(0);
  }, []);

  // Handle cursor position change
  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setCursorPosition(target.selectionStart || 0);
  }, []);

  // Execute the query
  const handleExecute = useCallback(async () => {
    if (!isValid) {
      toast.error('Please fix validation errors before executing');
      return;
    }

    const trimmedClause = whereClause.trim();

    // Build the full SELECT query
    let fullQuery: string;
    if (trimmedClause) {
      fullQuery = `SELECT * FROM "${schemaName}"."${tableName}" WHERE ${trimmedClause}`;
    } else {
      fullQuery = `SELECT * FROM "${schemaName}"."${tableName}"`;
    }

    try {
      await onExecuteQuery(fullQuery);
    } catch (error: any) {
      toast.error(error.message || 'Query execution failed');
    }
  }, [whereClause, schemaName, tableName, isValid, onExecuteQuery]);

  // Clear the input
  const handleClear = useCallback(() => {
    setWhereClause('');
    setValidationErrors([]);
    setIsValid(true);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasErrors = validationErrors.length > 0;

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-2">
        {/* WHERE label */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-500/20 rounded-md border border-blue-500/30 shrink-0">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-medium text-blue-400">WHERE</span>
        </div>

        {/* Input container */}
        <div className={cn(
          "relative flex-1 flex items-center rounded-md border transition-all duration-200",
          "bg-[#273142]",
          hasErrors
            ? "border-red-500/50 focus-within:border-red-500"
            : isValid && whereClause
              ? "border-green-500/30 focus-within:border-green-500/50"
              : "border-white/10 focus-within:border-white/20"
        )}>
          <Input
            ref={inputRef}
            value={whereClause}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            onFocus={() => setShowSuggestions(true)}
            placeholder={"id = 1 AND status = 'active'"}
            className={cn(
              "flex-1 h-8 bg-transparent border-0 px-3 text-sm font-mono",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-gray-500"
            )}
            autoComplete="off"
            spellCheck={false}
          />

          {/* Status indicator */}
          <div className="flex items-center gap-1 pr-2">
            {whereClause && (
              <>
                {hasErrors ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                )}
                <button
                  onClick={handleClear}
                  className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Execute button */}
        <Button
          size="sm"
          onClick={handleExecute}
          disabled={isExecuting || hasErrors}
          className={cn(
            "h-8 gap-1.5 shrink-0",
            hasErrors
              ? "bg-gray-600 hover:bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          )}
        >
          {isExecuting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          Run
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-[72px] right-[70px] mt-1 bg-[#1e293b] border border-white/10 rounded-md shadow-xl z-50 max-h-64 overflow-auto"
        >
          {filteredSuggestions.slice(0, 15).map((suggestion, index) => (
            <button
              key={suggestion.name}
              onClick={() => selectSuggestion(suggestion)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors",
                index === selectedSuggestionIndex
                  ? "bg-blue-500/20 text-white"
                  : "text-gray-300 hover:bg-white/5"
              )}
            >
              {/* Icon/badge for type */}
              {'isKeyword' in suggestion && suggestion.isKeyword ? (
                <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-purple-500/50 text-purple-400 shrink-0">
                  SQL
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 px-1.5 text-[10px] shrink-0",
                    suggestion.isPrimaryKey
                      ? "border-yellow-500/50 text-yellow-400"
                      : suggestion.isForeignKey
                        ? "border-blue-500/50 text-blue-400"
                        : "border-gray-500/50 text-gray-400"
                  )}
                >
                  {suggestion.isPrimaryKey ? 'PK' : suggestion.isForeignKey ? 'FK' : 'col'}
                </Badge>
              )}

              {/* Name */}
              <span className="font-mono flex-1 truncate">{suggestion.name}</span>

              {/* Type */}
              {'type' in suggestion && suggestion.type !== 'keyword' && (
                <span className="text-[10px] text-gray-500 font-mono shrink-0">
                  {suggestion.type}
                </span>
              )}
            </button>
          ))}

          {/* Help text */}
          <div className="px-3 py-2 border-t border-white/5 bg-[#1e293b]/50">
            <p className="text-[10px] text-gray-500">
              <kbd className="px-1 rounded bg-white/10 mr-1">↑↓</kbd> navigate
              <kbd className="px-1 rounded bg-white/10 mx-1">Tab</kbd> select
              <kbd className="px-1 rounded bg-white/10 mx-1">Enter</kbd> run
            </p>
          </div>
        </div>
      )}

      {/* Validation errors */}
      {hasErrors && (
        <div className="mt-2 space-y-1">
          {validationErrors.map((error, index) => (
            <div
              key={index}
              className="flex items-start gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick hint when empty */}
      {!whereClause && !showSuggestions && (
        <p className="mt-1.5 text-[10px] text-gray-500 pl-[72px]">
          Type column names to filter • Query: SELECT * FROM "{schemaName}"."{tableName}" WHERE ...
        </p>
      )}
    </div>
  );
}

export default WhereClauseEditor;
