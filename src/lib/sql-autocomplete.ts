import type { Monaco } from '@monaco-editor/react';
import { Parser } from 'node-sql-parser';

// ============================================
// SQL AUTOCOMPLETE PROVIDER
// Context-aware completions using node-sql-parser + schema metadata
// ============================================

export interface SchemaMetadata {
  tables: Array<{
    schema: string;
    name: string;
    columns: Array<{ name: string; type: string }>;
  }>;
}

// All SQL keywords grouped by category
const SQL_KEYWORDS = [
  // DQL
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
  'FULL JOIN', 'CROSS JOIN', 'NATURAL JOIN', 'ON', 'USING',
  'AND', 'OR', 'NOT', 'IN', 'LIKE', 'ILIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL',
  'EXISTS', 'ANY', 'ALL', 'SOME',
  'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'FETCH',
  'AS', 'DISTINCT', 'ALL',
  'UNION', 'UNION ALL', 'EXCEPT', 'INTERSECT',
  'WITH', 'RECURSIVE',
  // Aggregates
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ARRAY_AGG', 'STRING_AGG',
  'COALESCE', 'NULLIF', 'GREATEST', 'LEAST',
  // DML
  'INSERT INTO', 'VALUES', 'DEFAULT VALUES', 'ON CONFLICT', 'DO UPDATE', 'DO NOTHING',
  'UPDATE', 'SET',
  'DELETE FROM',
  'RETURNING',
  // DDL
  'CREATE TABLE', 'CREATE INDEX', 'CREATE VIEW', 'CREATE SCHEMA',
  'CREATE UNIQUE INDEX', 'CREATE OR REPLACE',
  'ALTER TABLE', 'ADD COLUMN', 'DROP COLUMN', 'RENAME COLUMN', 'RENAME TO',
  'ALTER COLUMN', 'SET DEFAULT', 'DROP DEFAULT', 'SET NOT NULL', 'DROP NOT NULL',
  'DROP TABLE', 'DROP INDEX', 'DROP VIEW', 'DROP SCHEMA',
  'TRUNCATE',
  'IF EXISTS', 'IF NOT EXISTS', 'CASCADE', 'RESTRICT',
  // Types / constraints
  'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'UNIQUE', 'CHECK', 'DEFAULT',
  'NOT NULL', 'NULL', 'SERIAL', 'BIGSERIAL',
  'INTEGER', 'BIGINT', 'SMALLINT', 'NUMERIC', 'DECIMAL', 'REAL', 'DOUBLE PRECISION',
  'TEXT', 'VARCHAR', 'CHAR', 'BOOLEAN', 'DATE', 'TIMESTAMP', 'TIMESTAMPTZ',
  'JSON', 'JSONB', 'UUID', 'BYTEA', 'INTERVAL', 'ARRAY',
  // Case/Flow
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  // Transaction
  'BEGIN', 'COMMIT', 'ROLLBACK', 'SAVEPOINT',
  // Other
  'EXPLAIN', 'ANALYZE', 'VERBOSE',
  'GRANT', 'REVOKE',
  'ASC', 'DESC', 'NULLS FIRST', 'NULLS LAST',
  'TRUE', 'FALSE',
];

// SQL built-in functions
const SQL_FUNCTIONS = [
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'COALESCE', 'NULLIF', 'GREATEST', 'LEAST',
  'UPPER', 'LOWER', 'TRIM', 'LTRIM', 'RTRIM', 'LENGTH', 'SUBSTRING', 'REPLACE',
  'CONCAT', 'CONCAT_WS', 'LEFT', 'RIGHT', 'POSITION', 'SPLIT_PART',
  'TO_CHAR', 'TO_DATE', 'TO_TIMESTAMP', 'TO_NUMBER',
  'NOW', 'CURRENT_DATE', 'CURRENT_TIMESTAMP', 'CURRENT_TIME',
  'DATE_TRUNC', 'DATE_PART', 'EXTRACT', 'AGE',
  'CAST', 'ROUND', 'CEIL', 'FLOOR', 'ABS', 'MOD', 'POWER', 'SQRT',
  'RANDOM', 'GENERATE_SERIES',
  'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'LAG', 'LEAD',
  'FIRST_VALUE', 'LAST_VALUE', 'NTH_VALUE',
  'ARRAY_AGG', 'STRING_AGG', 'JSON_AGG', 'JSONB_AGG',
  'JSON_BUILD_OBJECT', 'JSONB_BUILD_OBJECT', 'JSON_EXTRACT_PATH_TEXT',
  'EXISTS', 'NOT EXISTS',
];

/** Clause the cursor is currently in, determined by walking backwards */
type CursorContext =
  | 'SELECT'
  | 'FROM'
  | 'JOIN'
  | 'WHERE'
  | 'ON'
  | 'SET'
  | 'INSERT_INTO'
  | 'INSERT_COLUMNS'
  | 'VALUES'
  | 'GROUP_BY'
  | 'ORDER_BY'
  | 'HAVING'
  | 'UPDATE'
  | 'DELETE_FROM'
  | 'CREATE'
  | 'ALTER'
  | 'RETURNING'
  | 'UNKNOWN';

/**
 * Determine the SQL clause context at the cursor position.
 * Walks backwards through the text before the cursor to find the last clause keyword.
 */
function determineCursorContext(textBeforeCursor: string): CursorContext {
  // Normalize: strip comments
  let text = textBeforeCursor.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--.*$/gm, ' ');
  // Remove string literals
  text = text.replace(/'(?:[^'\\]|\\.)*'/g, ' ');
  text = text.replace(/\s+/g, ' ').trimEnd().toUpperCase();

  // Walk backward through keywords — last one wins
  // Ordered from most specific (multi-word) to single words
  const clausePatterns: Array<[RegExp, CursorContext]> = [
    [/\bINSERT\s+INTO\s+\S+\s*\(\s*[^)]*$/, 'INSERT_COLUMNS'], // INSERT INTO t(col1, col2|
    [/\bINSERT\s+INTO\b(?!\s+\S+\s*\()/, 'INSERT_INTO'], // INSERT INTO |
    [/\bDELETE\s+FROM\b/, 'DELETE_FROM'],
    [/\bGROUP\s+BY\b/, 'GROUP_BY'],
    [/\bORDER\s+BY\b/, 'ORDER_BY'],
    [/\bLEFT\s+JOIN\b/, 'JOIN'],
    [/\bRIGHT\s+JOIN\b/, 'JOIN'],
    [/\bINNER\s+JOIN\b/, 'JOIN'],
    [/\bFULL\s+JOIN\b/, 'JOIN'],
    [/\bCROSS\s+JOIN\b/, 'JOIN'],
    [/\bNATURAL\s+JOIN\b/, 'JOIN'],
    [/\bJOIN\b/, 'JOIN'],
    [/\bRETURNING\b/, 'RETURNING'],
    [/\bVALUES\b/, 'VALUES'],
    [/\bSET\b/, 'SET'],
    [/\bON\b/, 'ON'],
    [/\bHAVING\b/, 'HAVING'],
    [/\bWHERE\b/, 'WHERE'],
    [/\bFROM\b/, 'FROM'],
    [/\bSELECT\b/, 'SELECT'],
    [/\bUPDATE\b/, 'UPDATE'],
    [/\bCREATE\b/, 'CREATE'],
    [/\bALTER\b/, 'ALTER'],
  ];

  // Find last matching pattern position
  let lastMatch: { ctx: CursorContext; index: number } | null = null;
  for (const [pattern, ctx] of clausePatterns) {
    const match = text.match(pattern);
    if (match && match.index != null) {
      const idx = match.index + match[0].length;
      if (!lastMatch || idx > lastMatch.index) {
        lastMatch = { ctx, index: idx };
      }
    }
  }

  return lastMatch?.ctx ?? 'UNKNOWN';
}

/**
 * Extract table names/aliases referenced in the SQL text before the cursor.
 * Uses simple regex matching — works for common patterns without full parsing.
 */
function extractReferencedTables(textBeforeCursor: string): Array<{ name: string; alias?: string; schema?: string }> {
  const tables: Array<{ name: string; alias?: string; schema?: string }> = [];
  // Normalize
  const text = textBeforeCursor.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--.*$/gm, ' ');

  // Patterns:
  // FROM schema.table AS alias | FROM schema.table alias | FROM table
  // JOIN schema.table AS alias | JOIN schema.table alias | JOIN table
  // UPDATE schema.table AS alias
  // INSERT INTO schema.table
  // DELETE FROM schema.table
  const tableRefPattern = /(?:FROM|JOIN|UPDATE|INTO|DELETE\s+FROM)\s+(?:ONLY\s+)?(?:("?[\w]+"?)\.)?("?[\w]+"?)(?:\s+(?:AS\s+)?("?[\w]+"?))?/gi;

  let match;
  while ((match = tableRefPattern.exec(text)) !== null) {
    const schema = match[1]?.replace(/"/g, '') || undefined;
    const name = match[2]?.replace(/"/g, '') || '';
    const alias = match[3]?.replace(/"/g, '') || undefined;

    // Exclude SQL keywords that might be caught as aliases
    const reserved = new Set([
      'WHERE', 'ON', 'SET', 'AND', 'OR', 'LEFT', 'RIGHT', 'INNER', 'FULL', 'CROSS',
      'NATURAL', 'JOIN', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION',
      'EXCEPT', 'INTERSECT', 'VALUES', 'RETURNING', 'SELECT', 'FROM', 'AS',
    ]);
    const cleanAlias = alias && !reserved.has(alias.toUpperCase()) ? alias : undefined;

    if (name && !reserved.has(name.toUpperCase())) {
      tables.push({ name, alias: cleanAlias, schema });
    }
  }

  return tables;
}

/**
 * Register a context-aware SQL completion provider on the given Monaco instance.
 * Returns a disposable to clean up when the component unmounts.
 */
export function registerSQLCompletionProvider(
  monaco: Monaco,
  getSchemaMetadata: () => SchemaMetadata | null,
  getSelectedSchemas: () => string[]
): { dispose: () => void } {
  // Create parser instance once (reuse across completions)
  let parser: Parser | null = null;
  try {
    parser = new Parser();
  } catch {
    // If parser creation fails, fall back to basic completions
    console.warn('node-sql-parser initialization failed; using basic completions');
  }

  const disposable = monaco.languages.registerCompletionItemProvider('sql', {
    triggerCharacters: ['.', ' ', '('],

    provideCompletionItems: (model, position) => {
      const suggestions: any[] = [];
      const schemaMeta = getSchemaMetadata();
      const word = model.getWordUntilPosition(position);
      const replaceRange = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn
      );

      // Get all text before cursor for context detection
      const textBeforeCursor = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const lineUntilCursor = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      // ------------------------------------------------
      // 1. DOTTED-PATH COMPLETION (highest priority)
      //    schema.table.column or schema.table or alias.column
      // ------------------------------------------------
      const schemaTableColPrefix = lineUntilCursor.match(/([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)$/);
      const schemaTableDot = lineUntilCursor.match(/([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)\.$/);
      const schemaTablePrefix = lineUntilCursor.match(/([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)$/);
      const schemaDot = lineUntilCursor.match(/([A-Za-z_][\w]*)\.$/);

      if (schemaMeta?.tables) {
        // schema.table.col or schema.table.
        if (schemaTableColPrefix || schemaTableDot) {
          const schemaName = (schemaTableColPrefix?.[1] || schemaTableDot?.[1]) as string;
          const tableName = (schemaTableColPrefix?.[2] || schemaTableDot?.[2]) as string;

          const table = schemaMeta.tables.find(
            t => t.schema.toLowerCase() === schemaName.toLowerCase() && t.name.toLowerCase() === tableName.toLowerCase()
          );
          if (table) {
            table.columns.forEach(col => {
              suggestions.push({
                label: col.name,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: col.name,
                detail: `${col.type} — ${schemaName}.${tableName}`,
                sortText: '0' + col.name, // sort columns first
                range: replaceRange,
              });
            });
            return { suggestions };
          }
        }

        // alias.col or schema.table (prefix)
        if (schemaDot || schemaTablePrefix) {
          const prefix = (schemaDot?.[1] || schemaTablePrefix?.[1]) as string;

          // Check if prefix is a table alias
          const referencedTables = extractReferencedTables(textBeforeCursor);
          const aliasMatch = referencedTables.find(
            t => t.alias?.toLowerCase() === prefix.toLowerCase()
          );
          if (aliasMatch) {
            // Suggest columns of the aliased table
            const tables = schemaMeta.tables.filter(
              t => t.name.toLowerCase() === aliasMatch.name.toLowerCase() &&
                   (!aliasMatch.schema || t.schema.toLowerCase() === aliasMatch.schema.toLowerCase())
            );
            for (const table of tables) {
              table.columns.forEach(col => {
                suggestions.push({
                  label: col.name,
                  kind: monaco.languages.CompletionItemKind.Field,
                  insertText: col.name,
                  detail: `${col.type} — ${table.schema}.${table.name} (via ${prefix})`,
                  sortText: '0' + col.name,
                  range: replaceRange,
                });
              });
            }
            if (suggestions.length > 0) return { suggestions };
          }

          // Check if prefix is a table name (suggest columns)
          const tableMatch = schemaMeta.tables.filter(
            t => t.name.toLowerCase() === prefix.toLowerCase()
          );
          if (tableMatch.length > 0 && schemaDot) {
            for (const table of tableMatch) {
              table.columns.forEach(col => {
                suggestions.push({
                  label: col.name,
                  kind: monaco.languages.CompletionItemKind.Field,
                  insertText: col.name,
                  detail: `${col.type} — ${table.schema}.${table.name}`,
                  sortText: '0' + col.name,
                  range: replaceRange,
                });
              });
            }
            if (suggestions.length > 0) return { suggestions };
          }

          // Prefix is a schema name — suggest tables in that schema
          const schemaName = prefix;
          schemaMeta.tables
            .filter(t => t.schema.toLowerCase() === schemaName.toLowerCase())
            .forEach(t => {
              suggestions.push({
                label: t.name,
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: t.name,
                detail: `Table in ${t.schema}`,
                sortText: '0' + t.name,
                range: replaceRange,
              });
            });

          if (suggestions.length > 0) return { suggestions };
        }
      }

      // ------------------------------------------------
      // 2. CONTEXT-AWARE SUGGESTIONS
      // ------------------------------------------------
      const cursorContext = determineCursorContext(textBeforeCursor);
      const referencedTables = extractReferencedTables(textBeforeCursor);
      const allowedSchemas = getSelectedSchemas();

      // Helper: add column suggestions for referenced tables
      const addColumnSuggestions = (sortPrefix: string = '1') => {
        if (!schemaMeta?.tables) return;
        const addedColumns = new Set<string>();

        for (const ref of referencedTables) {
          const tables = schemaMeta.tables.filter(
            t => t.name.toLowerCase() === ref.name.toLowerCase() &&
                 (!ref.schema || t.schema.toLowerCase() === ref.schema.toLowerCase())
          );
          for (const table of tables) {
            table.columns.forEach(col => {
              const label = referencedTables.length > 1 && ref.alias
                ? `${ref.alias}.${col.name}`
                : col.name;
              if (addedColumns.has(label.toLowerCase())) return;
              addedColumns.add(label.toLowerCase());

              suggestions.push({
                label,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: label,
                detail: `${col.type} — ${table.schema}.${table.name}`,
                sortText: sortPrefix + label,
                range: replaceRange,
              });
            });
          }
        }
      };

      // Helper: add table suggestions
      const addTableSuggestions = (sortPrefix: string = '1') => {
        if (!schemaMeta?.tables) return;
        schemaMeta.tables.forEach(table => {
          if (allowedSchemas.length > 0 && !allowedSchemas.includes(table.schema)) return;

          // Suggest with schema prefix
          suggestions.push({
            label: `${table.schema}.${table.name}`,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: `${table.schema}.${table.name}`,
            detail: 'Table',
            sortText: sortPrefix + table.name,
            range: replaceRange,
          });

          // Also suggest bare table name
          suggestions.push({
            label: table.name,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: table.name,
            detail: `Table — ${table.schema}`,
            sortText: sortPrefix + '1' + table.name,
            range: replaceRange,
          });
        });
      };

      switch (cursorContext) {
        case 'SELECT':
        case 'RETURNING':
          // After SELECT/RETURNING — suggest columns of referenced tables, then *, functions
          addColumnSuggestions('0');
          suggestions.push({
            label: '*',
            kind: monaco.languages.CompletionItemKind.Operator,
            insertText: '*',
            detail: 'All columns',
            sortText: '00',
            range: replaceRange,
          });
          SQL_FUNCTIONS.forEach(fn => {
            suggestions.push({
              label: fn,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: fn + '($0)',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: 'Function',
              sortText: '2' + fn,
              range: replaceRange,
            });
          });
          break;

        case 'FROM':
        case 'JOIN':
        case 'INSERT_INTO':
        case 'UPDATE':
        case 'DELETE_FROM':
          // After FROM/JOIN/INTO/UPDATE/DELETE — suggest tables
          addTableSuggestions('0');
          break;

        case 'WHERE':
        case 'ON':
        case 'HAVING':
          // After WHERE/ON/HAVING — suggest columns, then operators
          addColumnSuggestions('0');
          ['=', '!=', '<>', '<', '>', '<=', '>=', 'LIKE', 'ILIKE', 'IN', 'NOT IN',
           'IS NULL', 'IS NOT NULL', 'BETWEEN', 'EXISTS', 'AND', 'OR', 'NOT'
          ].forEach((op, idx) => {
            suggestions.push({
              label: op,
              kind: monaco.languages.CompletionItemKind.Operator,
              insertText: op,
              sortText: '3' + String(idx).padStart(2, '0'),
              range: replaceRange,
            });
          });
          break;

        case 'SET':
        case 'INSERT_COLUMNS':
          // After SET or in INSERT column list — suggest columns
          addColumnSuggestions('0');
          break;

        case 'GROUP_BY':
        case 'ORDER_BY':
          // After GROUP BY/ORDER BY — suggest columns, ASC/DESC
          addColumnSuggestions('0');
          ['ASC', 'DESC', 'NULLS FIRST', 'NULLS LAST'].forEach((kw, idx) => {
            suggestions.push({
              label: kw,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: kw,
              sortText: '3' + String(idx).padStart(2, '0'),
              range: replaceRange,
            });
          });
          break;

        case 'VALUES':
          // Inside VALUES — suggest DEFAULT, NULL, functions
          ['DEFAULT', 'NULL', 'TRUE', 'FALSE'].forEach(kw => {
            suggestions.push({
              label: kw,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: kw,
              sortText: '0' + kw,
              range: replaceRange,
            });
          });
          break;

        default:
          // Unknown context — suggest tables and columns
          addTableSuggestions('1');
          addColumnSuggestions('2');
          break;
      }

      // ------------------------------------------------
      // 3. ALWAYS ADD KEYWORD SUGGESTIONS (lower priority)
      // ------------------------------------------------
      SQL_KEYWORDS.forEach(kw => {
        suggestions.push({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          sortText: '9' + kw,
          range: replaceRange,
        });
      });

      return { suggestions };
    },
  });

  return disposable;
}
