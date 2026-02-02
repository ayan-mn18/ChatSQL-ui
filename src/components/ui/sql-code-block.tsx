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
      style: { color: '#64748b', fontStyle: 'italic' as const },
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
      style: { color: '#4ade80' },
    },
    {
      types: ['operator', 'entity', 'url'],
      style: { color: '#fbbf24' },
    },
    {
      types: ['atrule', 'attr-value', 'keyword'],
      style: { color: '#818cf8', fontWeight: 'bold' as const },
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
  title = 'SQL',
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
    <div className={cn('rounded-lg overflow-hidden bg-[#0f172a] border border-slate-700', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0c1322] border-b border-slate-700">
        <span className="text-xs text-slate-500">{title}</span>
        <div className="flex items-center gap-1">
          {showInsertButton && onInsert && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleInsert}
              className="h-6 px-2 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-slate-700"
            >
              Insert
            </Button>
          )}
          {showCopyButton && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className={cn(
                'h-6 px-2 text-xs',
                copied
                  ? 'text-green-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              )}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Copied
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
      <div className="overflow-auto" style={{ maxHeight }}>
        <Highlight theme={sqlDarkTheme} code={formattedCode} language="sql">
          {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={cn(highlightClassName, 'px-3 py-2.5 text-[13px] leading-relaxed font-mono m-0')}
              style={{ ...style, background: 'transparent' }}
            >
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line, key: i });
                return (
                  <div
                    key={i}
                    {...lineProps}
                    className={cn(lineProps.className, 'table-row')}
                  >
                    {showLineNumbers && (
                      <span className="table-cell pr-3 text-right text-slate-600 select-none w-6 text-xs">
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
