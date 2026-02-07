// ============================================
// COLUMN WIDTH UTILITIES
// Smart column width detection, resizing, and localStorage persistence
// ============================================

const STORAGE_KEY_PREFIX = 'chatsql-col-widths';

/**
 * Detect if a column likely contains UUIDs or long IDs.
 */
function isIdColumn(columnName: string, sampleValues?: any[]): boolean {
  const nameLower = columnName.toLowerCase();

  // Name heuristics
  if (nameLower === 'id' || nameLower === 'uuid') return true;
  if (nameLower.endsWith('_id') || nameLower.endsWith('_uuid')) return true;
  if (nameLower.startsWith('id_') || nameLower.startsWith('uuid_')) return true;
  if (nameLower === 'pk' || nameLower.endsWith('_pk')) return true;

  // Value heuristics — check if values look like UUIDs
  if (sampleValues && sampleValues.length > 0) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const nonNullValues = sampleValues.filter(v => v != null).slice(0, 5);
    if (nonNullValues.length > 0 && nonNullValues.every(v => uuidPattern.test(String(v)))) {
      return true;
    }
  }

  return false;
}

/**
 * Detect if a column likely contains boolean values.
 */
function isBooleanColumn(columnName: string, sampleValues?: any[]): boolean {
  const nameLower = columnName.toLowerCase();
  if (nameLower.startsWith('is_') || nameLower.startsWith('has_') || nameLower.startsWith('can_')) return true;

  if (sampleValues && sampleValues.length > 0) {
    const nonNull = sampleValues.filter(v => v != null).slice(0, 5);
    if (nonNull.length > 0 && nonNull.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) {
      return true;
    }
  }
  return false;
}

/**
 * Calculate smart default width for a column based on name + sample data.
 */
export function calculateSmartColumnWidth(
  columnName: string,
  sampleValues?: any[]
): number {
  // ID / UUID columns — compact
  if (isIdColumn(columnName, sampleValues)) {
    return 180;
  }

  // Boolean columns — very compact
  if (isBooleanColumn(columnName, sampleValues)) {
    return 100;
  }

  // Timestamp/date columns
  const nameLower = columnName.toLowerCase();
  if (nameLower.includes('created') || nameLower.includes('updated') ||
      nameLower.includes('_at') || nameLower.includes('date') ||
      nameLower.includes('timestamp')) {
    return 190;
  }

  // Email columns
  if (nameLower.includes('email')) {
    return 220;
  }

  // Name-based sizing
  const headerWidth = columnName.length * 9 + 70; // header text + icons/padding

  // Check sample value widths
  if (sampleValues && sampleValues.length > 0) {
    const nonNull = sampleValues.filter(v => v != null).slice(0, 10);
    if (nonNull.length > 0) {
      const avgLen = nonNull.reduce((sum, v) => {
        const str = typeof v === 'object' ? JSON.stringify(v) : String(v);
        return sum + Math.min(str.length, 40);
      }, 0) / nonNull.length;
      const dataWidth = avgLen * 8 + 24; // ~8px per char + padding
      return Math.min(Math.max(headerWidth, dataWidth, 100), 400);
    }
  }

  // Fallback: header-based with reasonable bounds
  return Math.min(Math.max(headerWidth, 120), 300);
}

/**
 * Build a localStorage key for storing column widths.
 */
function buildStorageKey(connectionId?: string, schemaName?: string, tableName?: string): string | null {
  if (!connectionId || !tableName) return null;
  const schema = schemaName || 'public';
  return `${STORAGE_KEY_PREFIX}:${connectionId}:${schema}.${tableName}`;
}

/**
 * Load persisted column widths from localStorage.
 */
export function loadColumnWidths(
  connectionId?: string,
  schemaName?: string,
  tableName?: string
): Record<string, number> | null {
  const key = buildStorageKey(connectionId, schemaName, tableName);
  if (!key) return null;

  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch {
    // Ignore corrupted data
  }
  return null;
}

/**
 * Save column widths to localStorage.
 */
export function saveColumnWidths(
  widths: Record<string, number>,
  connectionId?: string,
  schemaName?: string,
  tableName?: string
): void {
  const key = buildStorageKey(connectionId, schemaName, tableName);
  if (!key) return;

  try {
    localStorage.setItem(key, JSON.stringify(widths));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Initialize column widths for a set of columns.
 * Uses persisted widths if available, otherwise smart defaults.
 */
export function initializeColumnWidths(
  columns: string[],
  data: any[],
  connectionId?: string,
  schemaName?: string,
  tableName?: string
): Record<string, number> {
  const persisted = loadColumnWidths(connectionId, schemaName, tableName);
  const widths: Record<string, number> = {};

  for (const col of columns) {
    if (persisted && persisted[col] != null) {
      widths[col] = persisted[col];
    } else {
      const sampleValues = data.slice(0, 10).map(row => row[col]);
      widths[col] = calculateSmartColumnWidth(col, sampleValues);
    }
  }

  return widths;
}
