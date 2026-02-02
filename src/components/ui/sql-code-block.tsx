import { useState } from 'react';
import { Highlight } from 'prism-react-renderer';
import { Copy, Check, ArrowRight, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface SQLCodeBlockProps {
  code: string;
  title?: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  showInsertButton?: boolean;
  onInsert?: (sql: string) => void;
  className?: string;
  maxHeight?: string;
}

// Modern dark theme with vibrant syntax highlighting
const modernSqlTheme = {
  plain: {
    color: '#e2e8f0',
    backgroundColor: 'transparent',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: '#6b7280', fontStyle: 'italic' as const },
    },
    {
      types: ['punctuation'],
      style: { color: '#9ca3af' },
    },
    {
      types: ['property', 'tag', 'boolean', 'number', 'constant', 'symbol'],
      style: { color: '#f472b6' }, // Pink for numbers/constants
    },
    {
      types: ['selector', 'attr-name', 'string', 'char', 'builtin'],
      style: { color: '#34d399' }, // Green for strings
    },
    {
      types: ['operator', 'entity', 'url'],
      style: { color: '#fbbf24' }, // Yellow for operators
    },
    {
      types: ['atrule', 'attr-value', 'keyword'],
      style: { color: '#818cf8', fontWeight: '600' as const }, // Purple for keywords
    },
    {
      types: ['function', 'class-name'],
      style: { color: '#60a5fa' }, // Blue for functions
    },
    {
      types: ['regex', 'important', 'variable'],
      style: { color: '#fb923c' }, // Orange for variables
    },
  ],
};

export function SQLCodeBlock({
  code,
  title,
  showLineNumbers = true,
  showCopyButton = true,
  showInsertButton = false,
  onInsert,
  className,
  maxHeight = '300px',
}: SQLCodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    onInsert?.(code);
  };

  // Format SQL for better readability
  const formattedCode = formatSQL(code);
  const lineCount = formattedCode.split('\n').length;

  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden',
        'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800',
        'border border-slate-700/50',
        'shadow-lg shadow-black/20',
        'transition-all duration-300',
        isHovered && 'border-indigo-500/30 shadow-indigo-500/5',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <div className="flex items-center gap-1.5 ml-3">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {title || 'SQL'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {showInsertButton && onInsert && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleInsert}
              className={cn(
                'h-7 px-3 text-xs font-medium',
                'bg-gradient-to-r from-indigo-500/10 to-purple-500/10',
                'text-indigo-300 hover:text-white',
                'border border-indigo-500/20 hover:border-indigo-400/40',
                'hover:from-indigo-500/20 hover:to-purple-500/20',
                'transition-all duration-200',
                'rounded-lg'
              )}
            >
              <ArrowRight className="w-3 h-3 mr-1.5" />
              Insert
            </Button>
          )}
          {showCopyButton && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className={cn(
                'h-7 px-2.5 text-xs font-medium rounded-lg',
                'transition-all duration-200',
                copied
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              )}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Code Area */}
      <div className="relative overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent" style={{ maxHeight }}>
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.03),transparent_70%)]" />

        <Highlight theme={modernSqlTheme} code={formattedCode} language="sql">
          {({ className: highlightClassName, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={cn(
                highlightClassName,
                'relative px-4 py-3 text-[13px] leading-6 font-mono m-0',
                'selection:bg-indigo-500/30'
              )}
              style={{ background: 'transparent' }}
            >
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line, key: i });
                return (
                  <div
                    key={i}
                    {...lineProps}
                    className={cn(
                      lineProps.className,
                      'table-row group/line hover:bg-slate-800/30 transition-colors duration-100'
                    )}
                  >
                    {showLineNumbers && (
                      <span className="table-cell pr-4 text-right text-slate-600 select-none w-8 text-xs font-mono group-hover/line:text-slate-500 transition-colors">
                        {i + 1}
                      </span>
                    )}
                    <span className="table-cell">
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token, key })} />
                      ))}
                    </span>
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      </div>

      {/* Footer with line count */}
      {lineCount > 3 && (
        <div className="px-4 py-1.5 bg-slate-900/50 border-t border-slate-700/30">
          <span className="text-[10px] text-slate-500 font-medium">
            {lineCount} lines
          </span>
        </div>
      )}
    </div>
  );
}

// Simple SQL formatter for better readability
function formatSQL(sql: string): string {
  // Keywords that should start on a new line
  const newlineKeywords = [
    'SELECT',
    'FROM',
    'WHERE',
    'AND',
    'OR',
    'JOIN',
    'LEFT JOIN',
    'RIGHT JOIN',
    'INNER JOIN',
    'OUTER JOIN',
    'FULL JOIN',
    'CROSS JOIN',
    'ON',
    'GROUP BY',
    'ORDER BY',
    'HAVING',
    'LIMIT',
    'OFFSET',
    'UNION',
    'EXCEPT',
    'INTERSECT',
    'INSERT INTO',
    'VALUES',
    'UPDATE',
    'SET',
    'DELETE FROM',
    'CREATE TABLE',
    'ALTER TABLE',
    'DROP TABLE',
  ];

  let formatted = sql.trim();

  // Add newlines before major keywords
  newlineKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\s+${keyword}\\b`, 'gi');
    formatted = formatted.replace(regex, `\n${keyword}`);
  });

  // Clean up multiple newlines
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Indent lines after SELECT, FROM, etc.
  const lines = formatted.split('\n');
  const indentedLines: string[] = [];
  let indentLevel = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    const upperLine = trimmedLine.toUpperCase();

    // Decrease indent for certain keywords
    if (upperLine.startsWith('FROM') || upperLine.startsWith('WHERE') ||
      upperLine.startsWith('GROUP BY') || upperLine.startsWith('ORDER BY') ||
      upperLine.startsWith('HAVING') || upperLine.startsWith('LIMIT')) {
      indentLevel = 0;
    }

    // Add the line with current indent
    indentedLines.push('  '.repeat(indentLevel) + trimmedLine);

    // Increase indent after SELECT
    if (upperLine.startsWith('SELECT')) {
      indentLevel = 1;
    }

    // Reset indent for other major clauses
    if (upperLine.startsWith('FROM') || upperLine.startsWith('JOIN') ||
      upperLine.includes(' JOIN')) {
      indentLevel = 0;
    }
  }

  return indentedLines.join('\n');
}

// Inline SQL code component for smaller snippets
export function InlineSQLCode({ code }: { code: string }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-[#1e293b] text-emerald-400 font-mono text-xs">
      {code}
    </code>
  );
}

export default SQLCodeBlock;
