import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type SQLQueryType, truncateSQL } from '@/lib/sql-utils';

// ============================================
// TYPES
// ============================================

export interface ExecutionLogEntry {
  id: string;
  timestamp: Date;
  queryType: SQLQueryType;
  queryText: string;
  status: 'running' | 'success' | 'error';
  duration?: number; // ms
  rowCount?: number;
  affectedRows?: number;
  error?: string;
  errorDetails?: {
    message: string;
    detail?: string;
    hint?: string;
    position?: number;
    line?: number;
    errorColumn?: number;
    code?: string;
    constraint?: string;
    table?: string;
    schema?: string;
    dataType?: string;
    queryExcerpt?: string;
  };
}

// ============================================
// QUERY TYPE BADGE
// ============================================

const queryTypeBadgeColors: Record<SQLQueryType, string> = {
  SELECT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  INSERT: 'bg-green-500/20 text-green-400 border-green-500/30',
  UPDATE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  CREATE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ALTER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DROP: 'bg-red-600/20 text-red-300 border-red-600/30',
  TRUNCATE: 'bg-red-600/20 text-red-300 border-red-600/30',
  OTHER: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

function QueryTypeBadge({ type }: { type: SQLQueryType }) {
  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 h-4 font-mono font-semibold border ${queryTypeBadgeColors[type]}`}
    >
      {type}
    </Badge>
  );
}

// ============================================
// STATUS ICON
// ============================================

function StatusIcon({ status }: { status: ExecutionLogEntry['status'] }) {
  switch (status) {
    case 'running':
      return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />;
    case 'success':
      return <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />;
    case 'error':
      return <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
  }
}

// ============================================
// COPY BUTTON
// ============================================

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-5 w-5 p-0 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </Button>
  );
}

// ============================================
// ERROR DETAILS PANEL
// ============================================

function ErrorDetailsPanel({ entry }: { entry: ExecutionLogEntry }) {
  if (!entry.error && !entry.errorDetails) return null;

  const details = entry.errorDetails;

  return (
    <div className="mt-2 ml-6 space-y-2 text-xs">
      {/* Error message */}
      <div className="bg-red-950/30 border border-red-500/20 rounded-md p-2.5">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-red-300 font-medium break-words">{entry.error || details?.message}</p>

            {details?.detail && (
              <p className="text-red-400/80 break-words">
                <span className="text-red-500/60">Detail: </span>{details.detail}
              </p>
            )}

            {details?.hint && (
              <p className="text-amber-400/80 break-words">
                <span className="text-amber-500/60">Hint: </span>{details.hint}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error metadata */}
      {details && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-500 ml-1">
          {details.code && (
            <span>
              <span className="text-slate-600">Code: </span>
              <span className="text-slate-400 font-mono">{details.code}</span>
            </span>
          )}
          {(details.line || details.position) && (
            <span>
              <span className="text-slate-600">Position: </span>
              <span className="text-slate-400 font-mono">
                {details.line ? `Line ${details.line}` : ''}
                {details.line && details.errorColumn ? ':' : ''}
                {details.errorColumn ? `Col ${details.errorColumn}` : ''}
                {!details.line && details.position ? `Char ${details.position}` : ''}
              </span>
            </span>
          )}
          {details.constraint && (
            <span>
              <span className="text-slate-600">Constraint: </span>
              <span className="text-slate-400 font-mono">{details.constraint}</span>
            </span>
          )}
          {details.table && (
            <span>
              <span className="text-slate-600">Table: </span>
              <span className="text-slate-400 font-mono">
                {details.schema ? `${details.schema}.` : ''}{details.table}
              </span>
            </span>
          )}
          {details.dataType && (
            <span>
              <span className="text-slate-600">Type: </span>
              <span className="text-slate-400 font-mono">{details.dataType}</span>
            </span>
          )}
        </div>
      )}

      {/* Query excerpt with error marker */}
      {details?.queryExcerpt && (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-md p-2 font-mono text-[11px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-500 text-[10px]">Query excerpt</span>
            <CopyButton text={entry.queryText} />
          </div>
          <pre className="text-slate-400 whitespace-pre-wrap break-words">{details.queryExcerpt}</pre>
        </div>
      )}
    </div>
  );
}

// ============================================
// SINGLE LOG ENTRY ROW
// ============================================

function LogEntryRow({ entry }: { entry: ExecutionLogEntry }) {
  const [expanded, setExpanded] = useState(entry.status === 'error');

  const hasExpandableContent = entry.status === 'error' || entry.queryText.length > 80;

  const formattedTime = entry.timestamp.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={`group border-b border-slate-800/50 last:border-b-0 ${entry.status === 'error' ? 'bg-red-950/10' : ''
        }`}
    >
      {/* Main row */}
      <div
        className={`flex items-center gap-2 px-2 py-1.5 ${hasExpandableContent ? 'cursor-pointer hover:bg-slate-800/30' : ''
          }`}
        onClick={() => hasExpandableContent && setExpanded(!expanded)}
      >
        {/* Expand toggle */}
        <div className="w-3.5 flex-shrink-0">
          {hasExpandableContent && (
            expanded
              ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          )}
        </div>

        {/* Status icon */}
        <StatusIcon status={entry.status} />

        {/* Timestamp */}
        <span className="text-[11px] font-mono text-slate-500 flex-shrink-0">{formattedTime}</span>

        {/* Query type badge */}
        <QueryTypeBadge type={entry.queryType} />

        {/* Query preview */}
        <span className="text-[12px] text-slate-400 truncate flex-1 font-mono min-w-0">
          {truncateSQL(entry.queryText, 80)}
        </span>

        {/* Duration */}
        {entry.duration != null && (
          <span className="flex items-center gap-1 text-[11px] text-slate-500 flex-shrink-0">
            <Clock className="w-3 h-3" />
            {entry.duration < 1000 ? `${entry.duration}ms` : `${(entry.duration / 1000).toFixed(2)}s`}
          </span>
        )}

        {/* Row/affected count */}
        {entry.status === 'success' && (
          <span className="text-[11px] flex-shrink-0 font-mono">
            {entry.queryType === 'SELECT' ? (
              <span className="text-blue-400">{entry.rowCount ?? 0} rows</span>
            ) : (
              <span className="text-green-400">{entry.affectedRows ?? 0} affected</span>
            )}
          </span>
        )}

        {/* Copy query button */}
        <CopyButton text={entry.queryText} />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-2 pb-2">
          {/* Full query */}
          {entry.queryText.length > 80 && (
            <div className="ml-6 mt-1 bg-slate-900/50 border border-slate-700/50 rounded-md p-2 font-mono text-[11px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-500 text-[10px]">Full query</span>
                <CopyButton text={entry.queryText} />
              </div>
              <pre className="text-slate-300 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                {entry.queryText}
              </pre>
            </div>
          )}

          {/* Error details */}
          {entry.status === 'error' && <ErrorDetailsPanel entry={entry} />}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN EXECUTION LOG COMPONENT
// ============================================

interface QueryExecutionLogProps {
  logs: ExecutionLogEntry[];
  onClear?: () => void;
}

export default function QueryExecutionLog({ logs, onClear }: QueryExecutionLogProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      {logs.length > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/50">
          <span className="text-[11px] text-slate-500">
            {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
          </span>
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-5 px-2 text-[10px] text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Log entries */}
      <ScrollArea className="flex-1">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[100px] text-slate-500">
            <p className="text-xs">No execution logs yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/30">
            {logs.map(entry => (
              <LogEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
