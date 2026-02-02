import { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Copy, Check, Code2 } from 'lucide-react';
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

// Custom dark theme optimized for SQL
const sqlDarkTheme = {
  ...themes.vsDark,
  plain: {
    color: '#e2e8f0',
    backgroundColor: '#0f172a',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: '#6b7280', fontStyle: 'italic' as const },
    },
    {
      types: ['punctuation'],
      style: { color: '#94a3b8' },
    },
    {
      types: ['property', 'tag', 'boolean', 'number', 'constant', 'symbol'],
      style: { color: '#f472b6' },
    },
    {
      types: ['selector', 'attr-name', 'string', 'char', 'builtin'],
      style: { color: '#34d399' },
    },
    {
      types: ['operator', 'entity', 'url'],
      style: { color: '#f59e0b' },
    },
    {
      types: ['atrule', 'attr-value', 'keyword'],
      style: { color: '#60a5fa', fontWeight: 'bold' as const },
    },
    {
      types: ['function', 'class-name'],
      style: { color: '#c084fc' },
    },
    {
      types: ['regex', 'important', 'variable'],
      style: { color: '#fbbf24' },
    },
  ],
};

export function SQLCodeBlock({
  code,
  title = 'Generated SQL',
  showLineNumbers = true,
  showCopyButton = true,
  showInsertButton = false,
  onInsert,
  className,
  maxHeight = '300px',
}: SQLCodeBlockProps) {
  const [copied, setCopied] = useState(false);

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

  return (
    <div className={cn('rounded-xl overflow-hidden border border-white/[0.08] bg-[#0c1222] shadow-xl shadow-black/20', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="text-[11px] font-medium text-slate-400 ml-1">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {showInsertButton && onInsert && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleInsert}
              className="h-6 px-2 text-[10px] font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-md"
            >
              <Code2 className="w-3 h-3 mr-1" />
              Insert
            </Button>
          )}
          {showCopyButton && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className={cn(
                'h-6 px-2 text-[10px] font-medium transition-all rounded-md',
                copied
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
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

      {/* Code */}
      <div className="overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent" style={{ maxHeight }}>
        <Highlight theme={sqlDarkTheme} code={formattedCode} language="sql">
          {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={cn(highlightClassName, 'px-4 py-3 text-[12px] leading-relaxed font-mono m-0')}
              style={{ ...style, background: 'transparent' }}
            >
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line, key: i });
                return (
                  <div
                    key={i}
                    {...lineProps}
                    className={cn(lineProps.className, 'table-row hover:bg-white/[0.02] transition-colors')}
                  >
                    {showLineNumbers && (
                      <span className="table-cell pr-4 text-right text-slate-600/60 select-none w-8 text-[11px]">
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
