// ============================================
// SQL UTILITY FUNCTIONS
// Shared helpers for SQL parsing, query type detection, etc.
// ============================================

export type SQLQueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'ALTER' | 'DROP' | 'TRUNCATE' | 'OTHER';

/**
 * Detect the type of a SQL query from its text.
 * Strips comments and leading whitespace before matching the first keyword.
 */
export function detectSQLQueryType(sql: string): SQLQueryType {
  // Strip block comments
  let cleaned = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  // Strip single-line comments
  cleaned = cleaned.replace(/--.*$/gm, '');
  // Trim and take the first keyword
  const firstWord = cleaned.trim().split(/\s+/)[0]?.toUpperCase();

  switch (firstWord) {
    case 'SELECT':
    case 'WITH': // CTEs are SELECT queries
    case 'EXPLAIN':
      return 'SELECT';
    case 'INSERT':
      return 'INSERT';
    case 'UPDATE':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    case 'CREATE':
      return 'CREATE';
    case 'ALTER':
      return 'ALTER';
    case 'DROP':
      return 'DROP';
    case 'TRUNCATE':
      return 'TRUNCATE';
    default:
      return 'OTHER';
  }
}

/**
 * Whether the query type is a read-only operation (safe to run with readOnly=true).
 */
export function isReadOnlyQuery(queryType: SQLQueryType): boolean {
  return queryType === 'SELECT';
}

/**
 * Whether the query type is a DML mutation (INSERT/UPDATE/DELETE).
 */
export function isDMLQuery(queryType: SQLQueryType): boolean {
  return queryType === 'INSERT' || queryType === 'UPDATE' || queryType === 'DELETE';
}

/**
 * Whether the query type is a DDL operation (CREATE/ALTER/DROP/TRUNCATE).
 */
export function isDDLQuery(queryType: SQLQueryType): boolean {
  return queryType === 'CREATE' || queryType === 'ALTER' || queryType === 'DROP' || queryType === 'TRUNCATE';
}

/**
 * Get a human-readable label for the query type.
 */
export function getQueryTypeLabel(queryType: SQLQueryType): string {
  const labels: Record<SQLQueryType, string> = {
    SELECT: 'Select',
    INSERT: 'Insert',
    UPDATE: 'Update',
    DELETE: 'Delete',
    CREATE: 'Create',
    ALTER: 'Alter',
    DROP: 'Drop',
    TRUNCATE: 'Truncate',
    OTHER: 'Query',
  };
  return labels[queryType];
}

/**
 * Truncate a SQL string for display (e.g., in logs).
 */
export function truncateSQL(sql: string, maxLength: number = 120): string {
  const singleLine = sql.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLength) return singleLine;
  return singleLine.substring(0, maxLength) + '…';
}
