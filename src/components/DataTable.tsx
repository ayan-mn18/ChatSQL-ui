import { useState, useMemo, useCallback, useRef, useEffect, type MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Plus,
  Trash2,
  Filter,
  Columns,
  X,
  Code,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  Key,
  Link2,
  Copy,
  Save,
  ExternalLink,
  AlertTriangle,
  Database
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { initializeColumnWidths, saveColumnWidths } from '@/lib/column-width';
import ColumnResizeHandle from '@/components/ColumnResizeHandle';

// Types
export interface ERDRelation {
  source_schema: string;
  source_table: string;
  source_column: string;
  target_schema: string;
  target_table: string;
  target_column: string;
}

export interface FilterCondition {
  column: string;
  operator: string;
  value: any;
}

interface DataTableProps<T = any> {
  data: T[];
  columns: string[];
  totalRows?: number;
  isLoading?: boolean;
  error?: string;

  // Pagination
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;

  // Sorting
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  onSort?: (column: string) => void;

  // Filtering
  filters?: FilterCondition[];
  onFilter?: (filters: FilterCondition[]) => void;

  // Selection
  selectedRows?: Set<number>;
  onSelectionChange?: (selectedRows: Set<number>) => void;

  // Editing
  onEdit?: (rowIndex: number, column: string, value: any) => Promise<void>;
  onDelete?: (selectedIndices: number[]) => Promise<void>;
  onInsert?: (values: Record<string, any>) => Promise<void>;

  // Metadata
  primaryKey?: string;
  foreignKeys?: Map<string, ERDRelation>;
  schemaName?: string;
  tableName?: string;

  // Actions
  onRefresh?: () => void;
  onFkClick?: (relation: ERDRelation, value: any) => void;

  // Styling
  className?: string;

  // Persistence context (for column width storage)
  connectionId?: string;
}

export default function DataTable({
  data: initialData,
  columns,
  totalRows,
  isLoading,
  error,
  page: controlledPage,
  pageSize: controlledPageSize,
  onPageChange,
  onPageSizeChange,
  sortBy: controlledSortBy,
  sortOrder: controlledSortOrder,
  onSort,
  filters: controlledFilters,
  onFilter,
  selectedRows: controlledSelectedRows,
  onSelectionChange,
  onEdit,
  onDelete,
  onInsert,
  primaryKey,
  foreignKeys,
  schemaName,
  tableName,
  onRefresh,
  onFkClick,
  className,
  connectionId: dtConnectionId
}: DataTableProps) {
  // ============================================
  // INTERNAL STATE (Client-side fallback)
  // ============================================

  // Pagination
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(50);
  const isControlledPagination = controlledPage !== undefined;
  const currentPage = isControlledPagination ? controlledPage : internalPage;
  const currentPageSize = isControlledPagination ? controlledPageSize || 50 : internalPageSize;

  // Sorting
  const [internalSortBy, setInternalSortBy] = useState<string | null>(null);
  const [internalSortOrder, setInternalSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const isControlledSort = controlledSortBy !== undefined;
  const currentSortBy = isControlledSort ? controlledSortBy : internalSortBy;
  const currentSortOrder = isControlledSort ? controlledSortOrder : internalSortOrder;

  // Filtering
  const [internalFilters, setInternalFilters] = useState<FilterCondition[]>([]);
  const isControlledFilter = controlledFilters !== undefined;
  const currentFilters = isControlledFilter ? controlledFilters : internalFilters;

  // Selection
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<number>>(new Set());
  const isControlledSelection = controlledSelectedRows !== undefined;
  const selectedRows = isControlledSelection ? controlledSelectedRows : internalSelectedRows;

  // Local UI State
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [showInsertDialog, setShowInsertDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [insertValues, setInsertValues] = useState<Record<string, string>>({});
  const [highlightedRows, setHighlightedRows] = useState<Set<number>>(new Set());

  // Column widths (resizable + persisted)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const columnWidthsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    columnWidthsRef.current = columnWidths;
  }, [columnWidths]);

  useEffect(() => {
    if (columns.length > 0) {
      setColumnWidths(prev => {
        const initialized = initializeColumnWidths(
          columns, initialData, dtConnectionId, schemaName, tableName
        );
        // Preserve any widths already resized in this session
        const merged = { ...initialized };
        for (const col of columns) {
          if (prev[col] != null) merged[col] = prev[col];
        }
        return merged;
      });
    }
  }, [columns, dtConnectionId, schemaName, tableName]);

  const handleColumnResize = useCallback((column: string, width: number) => {
    setColumnWidths(prev => ({ ...prev, [column]: width }));
  }, []);

  const handleColumnResizeEnd = useCallback(() => {
    saveColumnWidths(columnWidthsRef.current, dtConnectionId, schemaName, tableName);
  }, [dtConnectionId, schemaName, tableName]);

  const getColumnWidth = useCallback((column: string): number => {
    return columnWidths[column] || 160;
  }, [columnWidths]);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalData, setEditModalData] = useState<{
    rowIndex: number;
    column: string;
    value: string;
    originalValue: any;
  } | null>(null);
  const [mutating, setMutating] = useState(false);

  // Warning Dialogs
  const [showPkWarning, setShowPkWarning] = useState(false);
  const [showFkWarning, setShowFkWarning] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{
    rowIndex: number;
    column: string;
    value: any;
  } | null>(null);

  // FK Dialogs
  const [fkMenuData, setFkMenuData] = useState<{
    relation: ERDRelation;
    value: any;
    x: number;
    y: number;
  } | null>(null);
  const [showFkActionDialog, setShowFkActionDialog] = useState(false);
  const [fkActionData, setFkActionData] = useState<{
    relation: ERDRelation;
    value: any;
    column: string;
  } | null>(null);

  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const CLICK_DELAY = 200;

  // ============================================
  // DATA PROCESSING (Client-side)
  // ============================================

  const processedData = useMemo(() => {
    if (isControlledPagination && isControlledSort && isControlledFilter) {
      return initialData;
    }

    let result = [...initialData];

    // Client-side Filtering
    if (!isControlledFilter && currentFilters && currentFilters.length > 0) {
      result = result.filter(row => {
        return currentFilters.every(filter => {
          const cellValue = String(row[filter.column] ?? '').toLowerCase();
          return cellValue.includes(String(filter.value).toLowerCase());
        });
      });
    }

    // Client-side Sorting
    if (!isControlledSort && currentSortBy) {
      result.sort((a, b) => {
        const aValue = a[currentSortBy!];
        const bValue = b[currentSortBy!];
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        const comparison = aValue < bValue ? -1 : 1;
        return currentSortOrder === 'ASC' ? comparison : -comparison;
      });
    }

    return result;
  }, [initialData, currentFilters, currentSortBy, currentSortOrder, isControlledPagination, isControlledSort, isControlledFilter]);

  const paginatedData = useMemo(() => {
    if (isControlledPagination) return processedData;
    const start = (currentPage - 1) * currentPageSize;
    return processedData.slice(start, start + currentPageSize);
  }, [processedData, currentPage, currentPageSize, isControlledPagination]);

  const effectiveTotalRows = totalRows ?? processedData.length;
  const totalPages = Math.ceil(effectiveTotalRows / currentPageSize);

  // ============================================
  // HANDLERS
  // ============================================

  const handlePageChange = (newPage: number) => {
    if (onPageChange) onPageChange(newPage);
    else setInternalPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    if (onPageSizeChange) onPageSizeChange(newSize);
    else {
      setInternalPageSize(newSize);
      setInternalPage(1);
    }
  };

  const handleSort = (column: string) => {
    if (onSort) {
      onSort(column);
    } else {
      if (internalSortBy === column) {
        setInternalSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
      } else {
        setInternalSortBy(column);
        setInternalSortOrder('ASC');
      }
    }
  };

  const handleApplyFilter = () => {
    if (!filterColumn || !filterValue) return;
    const newFilter: FilterCondition = {
      column: filterColumn,
      operator: 'ilike',
      value: filterValue,
    };

    if (onFilter) {
      onFilter([...(currentFilters || []), newFilter]);
    } else {
      setInternalFilters(prev => [...prev, newFilter]);
    }
    setFilterColumn('');
    setFilterValue('');
  };

  const clearFilters = () => {
    if (onFilter) onFilter([]);
    else setInternalFilters([]);
  };

  const toggleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) newSelected.delete(index);
    else newSelected.add(index);

    if (onSelectionChange) onSelectionChange(newSelected);
    else setInternalSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === paginatedData.length) {
      if (onSelectionChange) onSelectionChange(new Set());
      else setInternalSelectedRows(new Set());
    } else {
      const newSelected = new Set(paginatedData.map((_, i) => i));
      if (onSelectionChange) onSelectionChange(newSelected);
      else setInternalSelectedRows(newSelected);
    }
  };

  const toggleColumnVisibility = (column: string) => {
    setHiddenColumns(prev => {
      const next = new Set(prev);
      if (next.has(column)) next.delete(column);
      else next.add(column);
      return next;
    });
  };

  // ============================================
  // CELL INTERACTION
  // ============================================

  const getColumnType = useCallback((column: string): 'primary' | 'foreign' | 'normal' => {
    if (column === primaryKey) return 'primary';
    if (foreignKeys?.has(column)) return 'foreign';
    return 'normal';
  }, [primaryKey, foreignKeys]);

  const copyToClipboard = useCallback((value: any) => {
    if (value === null || value === undefined) {
      toast('NULL value', { icon: '📋' });
      return;
    }
    const textValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    navigator.clipboard.writeText(textValue).then(() => {
      toast.success('Copied to clipboard');
    }).catch(() => toast.error('Failed to copy'));
  }, []);

  const handleCellClick = useCallback((_rowIndex: number, column: string, value: any) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    clickTimerRef.current = setTimeout(() => {
      const columnType = getColumnType(column);
      if (columnType === 'foreign' && value !== null && value !== undefined && foreignKeys) {
        const relation = foreignKeys.get(column);
        if (relation) {
          setFkActionData({ relation, value, column });
          setShowFkActionDialog(true);
          return;
        }
      }
      copyToClipboard(value);
    }, CLICK_DELAY);
  }, [getColumnType, foreignKeys, copyToClipboard]);

  const handleCellDoubleClick = useCallback((rowIndex: number, column: string, value: any) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    const columnType = getColumnType(column);
    const strValue = value === null ? '' : (typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));

    if (onEdit) {
      if (columnType === 'primary') {
        setPendingEdit({ rowIndex, column, value });
        setShowPkWarning(true);
        return;
      }
      if (columnType === 'foreign') {
        setPendingEdit({ rowIndex, column, value });
        setShowFkWarning(true);
        return;
      }
    }

    setEditModalData({
      rowIndex,
      column,
      value: strValue,
      originalValue: value,
    });
    setShowEditModal(true);
  }, [getColumnType, onEdit]);

  const handleSaveEdit = async () => {
    if (!editModalData || !onEdit) return;
    setMutating(true);
    try {
      let parsedValue: any = editModalData.value === '' ? null : editModalData.value;
      // Simple JSON check
      if (editModalData.value.trim().startsWith('{') || editModalData.value.trim().startsWith('[')) {
        try {
          parsedValue = JSON.parse(editModalData.value);
        } catch { }
      }
      await onEdit(editModalData.rowIndex, editModalData.column, parsedValue);
      setShowEditModal(false);
      setEditModalData(null);
    } catch (e) {
      console.error(e);
    } finally {
      setMutating(false);
    }
  };

  const handleInsertRow = async () => {
    if (!onInsert) return;
    setMutating(true);
    try {
      const values: Record<string, any> = {};
      for (const [key, val] of Object.entries(insertValues)) {
        if (val === '' || val === undefined) continue;
        const num = Number(val);
        if (!isNaN(num) && val.trim() !== '') values[key] = num;
        else {
          try { values[key] = JSON.parse(val); } catch { values[key] = val; }
        }
      }
      await onInsert(values);
      setShowInsertDialog(false);
      setInsertValues({});
    } catch (e) {
      console.error(e);
    } finally {
      setMutating(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!onDelete || selectedRows.size === 0) return;
    setMutating(true);
    try {
      await onDelete(Array.from(selectedRows));
      if (onSelectionChange) onSelectionChange(new Set());
      else setInternalSelectedRows(new Set());
      setShowDeleteDialog(false);
    } catch (e) {
      console.error(e);
    } finally {
      setMutating(false);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const displayColumns = useMemo(() => columns.filter(col => !hiddenColumns.has(col)), [columns, hiddenColumns]);

  const renderCellValue = (value: any): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') {
      const json = JSON.stringify(value);
      return json.length > 30 ? json.substring(0, 27) + '...' : json;
    }
    const strValue = String(value);
    if (strValue.length > 40) return strValue.substring(0, 37) + '...';
    return strValue;
  };

  const getSortIcon = (column: string) => {
    if (currentSortBy !== column) return <ArrowUpDown className="w-3 h-3 opacity-50 shrink-0" />;
    return currentSortOrder === 'ASC'
      ? <ArrowUp className="w-3 h-3 text-blue-400 shrink-0" />
      : <ArrowDown className="w-3 h-3 text-blue-400 shrink-0" />;
  };

  const getColumnHeaderStyles = (column: string) => {
    const type = getColumnType(column);
    switch (type) {
      case 'primary': return 'bg-yellow-500/10 border-l-2 border-l-yellow-500';
      case 'foreign': return 'bg-purple-500/10 border-l-2 border-l-purple-500';
      default: return '';
    }
  };

  const getColumnCellStyles = (column: string) => {
    const type = getColumnType(column);
    switch (type) {
      case 'primary': return 'bg-yellow-500/5';
      case 'foreign': return 'bg-purple-500/5 cursor-pointer';
      default: return '';
    }
  };

  const isJsonEdit = useMemo(() => {
    if (!editModalData) return false;
    const value = editModalData.value || '';
    return value.trim().startsWith('{') || value.trim().startsWith('[');
  }, [editModalData]);

  const isLargeEdit = useMemo(() => {
    if (!editModalData) return false;
    const value = editModalData.value || '';
    return isJsonEdit || value.length > 150 || value.split('\n').length > 3;
  }, [editModalData, isJsonEdit]);

  // ============================================
  // RENDER
  // ============================================

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p className="text-red-400 mb-2">Error loading data</p>
          <p className="text-sm">{error}</p>
          {onRefresh && (
            <Button onClick={onRefresh} className="mt-4" variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-[#1B2431] overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0 px-4 py-2 border-b border-white/5 bg-[#273142]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {effectiveTotalRows} rows
          </span>
          {currentFilters && currentFilters.length > 0 && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs text-gray-500">Filters:</span>
              {currentFilters.map((filter, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="border-blue-500/30 text-blue-400 cursor-pointer hover:bg-blue-500/10"
                  onClick={clearFilters}
                >
                  {filter.column} contains "{filter.value}"
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Columns */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-white/10 bg-transparent text-gray-400 hover:bg-white/5">
                <Columns className="w-4 h-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-[#273142] border-white/10 p-2" align="end">
              <div className="text-xs font-medium text-gray-400 mb-2 px-2">Toggle Columns</div>
              <div className="max-h-64 overflow-y-auto space-y-1 scrollbar-thin">
                {columns.map((col) => (
                  <div
                    key={col}
                    className="flex items-center space-x-2 px-2 py-1.5 hover:bg-white/5 rounded cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleColumnVisibility(col);
                    }}
                  >
                    <Checkbox
                      id={`col-${col}`}
                      checked={!hiddenColumns.has(col)}
                      onCheckedChange={() => toggleColumnVisibility(col)}
                      className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label htmlFor={`col-${col}`} className="text-sm text-gray-300 cursor-pointer flex-1 truncate select-none">
                      {col}
                    </label>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-white/10 bg-transparent text-gray-400 hover:bg-white/5">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 bg-[#273142] border-white/10 p-4" align="end">
              <div className="space-y-3">
                <Select value={filterColumn} onValueChange={setFilterColumn}>
                  <SelectTrigger className="bg-[#1B2431] border-white/10 text-white">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#273142] border-white/10 text-white">
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search value..."
                  data-chatsql-table-filter-value
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="bg-[#1B2431] border-white/10 text-white"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleApplyFilter} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Apply
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearFilters} data-chatsql-clear-filters className="border-white/10 text-gray-300">
                    Clear
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Actions */}
          {onDelete && selectedRows.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete ({selectedRows.size})
            </Button>
          )}

          {onInsert && (
            <Button size="sm" onClick={() => setShowInsertDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>
          )}

          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="border-white/10 bg-transparent text-gray-400 hover:bg-white/5">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto scrollbar-thin relative">
        {isLoading && !paginatedData.length ? (
          <div className="w-full h-full">
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-3 bg-[#273142] border-b border-white/5 min-w-max">
              <Skeleton className="h-5 w-5 rounded bg-white/10 shrink-0" />
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-48 bg-white/10 shrink-0" />
              ))}
            </div>
            <div className="divide-y divide-white/5 min-w-max">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="h-4 w-5 rounded bg-white/5 shrink-0" />
                  {[...Array(8)].map((_, j) => (
                    <Skeleton key={j} className="h-5 w-48 bg-white/5 shrink-0" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <table className="w-full caption-bottom text-sm text-left" style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
            <TableHeader className="sticky top-0 bg-[#273142] z-10 shadow-sm">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="w-12 text-center sticky left-0 bg-[#273142] z-20">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                    onChange={toggleAllRows}
                    className="rounded border-white/20 bg-transparent"
                  />
                </TableHead>
                {displayColumns.map((column) => {
                  const columnType = getColumnType(column);
                  const fkRelation = foreignKeys?.get(column);
                  const colWidth = getColumnWidth(column);

                  return (
                    <TableHead
                      key={column}
                      className={cn(
                        'text-gray-400 font-medium cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap relative',
                        getColumnHeaderStyles(column)
                      )}
                      style={{ width: colWidth, minWidth: 60, maxWidth: colWidth }}
                      onClick={() => handleSort(column)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{column}</span>
                        {getSortIcon(column)}
                        {columnType === 'primary' && (
                          <Tooltip>
                            <TooltipTrigger><Key className="w-3.5 h-3.5 text-yellow-400 shrink-0" /></TooltipTrigger>
                            <TooltipContent className="bg-[#1B2431] border-white/10 text-white">Primary Key</TooltipContent>
                          </Tooltip>
                        )}
                        {columnType === 'foreign' && fkRelation && (
                          <Tooltip>
                            <TooltipTrigger><Link2 className="w-3.5 h-3.5 text-purple-400 shrink-0" /></TooltipTrigger>
                            <TooltipContent className="bg-[#1B2431] border-white/10 text-white">
                              <div className="text-xs">
                                <p className="font-medium">Foreign Key</p>
                                <p className="text-gray-400">→ {fkRelation.target_schema}.{fkRelation.target_table}.{fkRelation.target_column}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <ColumnResizeHandle
                        column={column}
                        currentWidth={colWidth}
                        onResize={handleColumnResize}
                        onResizeEnd={handleColumnResizeEnd}
                      />
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    className={cn(
                      'border-white/5 hover:bg-white/5 transition-colors',
                      selectedRows.has(rowIndex) && 'bg-blue-500/10',
                      highlightedRows.has(rowIndex) && 'bg-green-500/20 animate-pulse border-l-4 border-l-green-500'
                    )}
                  >
                    <TableCell className={cn("text-center w-12 sticky left-0", highlightedRows.has(rowIndex) ? 'bg-green-500/20' : 'bg-[#1B2431]')}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIndex)}
                        onChange={() => toggleRowSelection(rowIndex)}
                        className="rounded border-white/20 bg-transparent"
                      />
                    </TableCell>
                    {displayColumns.map((column) => {
                      const value = row[column];
                      const isNull = value === null || value === undefined;
                      const columnType = getColumnType(column);
                      const colWidth = getColumnWidth(column);

                      return (
                        <TableCell
                          key={column}
                          className={cn(
                            'font-mono text-sm cursor-pointer hover:bg-white/10 transition-colors',
                            getColumnCellStyles(column),
                            isNull ? 'text-gray-500 italic' : 'text-gray-300'
                          )}
                          style={{ width: colWidth, minWidth: 60, maxWidth: colWidth }}
                          onClick={() => handleCellClick(rowIndex, column, value)}
                          onDoubleClick={() => handleCellDoubleClick(rowIndex, column, value)}
                          onContextMenu={(e) => {
                            if (columnType === 'foreign' && foreignKeys?.get(column)) {
                              e.preventDefault();
                              setFkMenuData({ relation: foreignKeys.get(column)!, value, x: e.clientX, y: e.clientY });
                            }
                          }}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block truncate">{renderCellValue(value)}</span>
                            </TooltipTrigger>
                            {!isNull && String(value).length > 30 && (
                              <TooltipContent className="bg-[#1B2431] border-white/10 text-white max-w-md">
                                <p className="break-all font-mono text-xs">
                                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={displayColumns.length + 1} className="text-center py-8 text-gray-400">
                    No data found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-[#273142]">
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>Page {currentPage} of {totalPages || 1}</span>
          <Select
            value={String(currentPageSize)}
            onValueChange={(val) => handlePageSizeChange(parseInt(val, 10))}
          >
            <SelectTrigger className="w-32 h-8 bg-[#1B2431] border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#273142] border-white/10 text-white">
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
              <SelectItem value="500">500 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => handlePageChange(1)} disabled={currentPage <= 1} className="border-white/10 bg-transparent text-white hover:bg-white/5">
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1} className="border-white/10 bg-transparent text-white hover:bg-white/5">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="border-white/10 bg-transparent text-white hover:bg-white/5">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages)} disabled={currentPage >= totalPages} className="border-white/10 bg-transparent text-white hover:bg-white/5">
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* FK Context Menu */}
      {fkMenuData && (
        <div
          className="fixed z-50 bg-[#273142] border border-white/10 rounded-lg shadow-xl py-1 min-w-[180px]"
          style={{ left: fkMenuData.x, top: fkMenuData.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {onFkClick && (
            <button
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
              onClick={() => {
                onFkClick(fkMenuData.relation, fkMenuData.value);
                setFkMenuData(null);
              }}
            >
              <ExternalLink className="w-4 h-4" />
              Open in {fkMenuData.relation.target_table}
            </button>
          )}
          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
            onClick={() => {
              copyToClipboard(fkMenuData.value);
              setFkMenuData(null);
            }}
          >
            <Copy className="w-4 h-4" />
            Copy value
          </button>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className={cn("bg-[#1B2431] border-white/10 text-white flex flex-col transition-all duration-200", isLargeEdit ? "max-w-5xl h-[80vh]" : "max-w-xl")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {onEdit ? 'Edit Value' : 'View Value'}
              {editModalData && getColumnType(editModalData.column) === 'primary' && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Key className="w-3 h-3 mr-1" /> Primary Key</Badge>
              )}
              {editModalData && getColumnType(editModalData.column) === 'foreign' && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30"><Link2 className="w-3 h-3 mr-1" /> Foreign Key</Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Column: <span className="text-white font-mono">{editModalData?.column}</span>
            </DialogDescription>
          </DialogHeader>
          <div className={cn("py-4 flex flex-col", isLargeEdit ? "flex-1 min-h-0" : "")}>
            {isJsonEdit ? (
              <div className="flex-1 border border-white/10 rounded-md overflow-hidden h-full">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={editModalData?.value || ''}
                  onChange={(value) => setEditModalData(prev => prev ? { ...prev, value: value || '' } : null)}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    readOnly: !onEdit,
                    theme: 'vs-dark'
                  }}
                />
              </div>
            ) : (
              <Textarea
                value={editModalData?.value || ''}
                onChange={(e) => setEditModalData(prev => prev ? { ...prev, value: e.target.value } : null)}
                className={cn("bg-[#273142] border-white/10 font-mono text-sm resize-none", isLargeEdit ? "h-full" : "min-h-[150px]")}
                readOnly={!onEdit}
              />
            )}
          </div>
          <DialogFooter className="flex gap-2 items-center">
            <Button variant="outline" onClick={() => {
              if (editModalData) copyToClipboard(editModalData.value);
            }} className="border-white/10"><Copy className="w-4 h-4 mr-2" /> Copy</Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setShowEditModal(false)} className="border-white/10">Close</Button>
            {onEdit && (
              <Button onClick={handleSaveEdit} disabled={mutating} className="bg-blue-600 hover:bg-blue-700">
                {mutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FK Action Dialog */}
      <Dialog open={showFkActionDialog} onOpenChange={setShowFkActionDialog}>
        <DialogContent className="bg-[#1B2431] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Link2 className="w-5 h-5 text-purple-400" /> Foreign Key Action</DialogTitle>
            <DialogDescription className="text-gray-400">
              {fkActionData && (
                <>Column <span className="text-white font-mono">{fkActionData.column}</span> references <span className="text-purple-400 font-mono">{fkActionData.relation.target_schema}.{fkActionData.relation.target_table}</span></>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="bg-[#273142] rounded-lg p-3 border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Value</p>
              <p className="font-mono text-sm text-white break-all">{fkActionData?.value !== null ? String(fkActionData?.value) : <span className="text-gray-500 italic">NULL</span>}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => { if (fkActionData) copyToClipboard(fkActionData.value); setShowFkActionDialog(false); }} className="border-white/10 hover:bg-white/5"><Copy className="w-4 h-4 mr-2" /> Copy Value</Button>
              {onFkClick && (
                <Button onClick={() => { if (fkActionData) onFkClick(fkActionData.relation, fkActionData.value); setShowFkActionDialog(false); }} className="bg-purple-600 hover:bg-purple-700"><ExternalLink className="w-4 h-4 mr-2" /> Open in Table</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Insert Dialog */}
      <Dialog open={showInsertDialog} onOpenChange={setShowInsertDialog}>
        <DialogContent className="bg-[#1B2431] border-white/10 text-white max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl"><div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center"><Plus className="w-5 h-5 text-blue-400" /></div> Insert New Row</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayColumns.filter(col => col !== primaryKey).map((column) => (
                <div key={column} className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">{column}</Label>
                  <Input value={insertValues[column] || ''} onChange={(e) => setInsertValues(prev => ({ ...prev, [column]: e.target.value }))} placeholder={`Enter ${column}...`} className="bg-[#273142] border-white/10" />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="border-t border-white/10 pt-4">
            <Button variant="outline" onClick={() => setShowInsertDialog(false)} className="border-white/10">Cancel</Button>
            <Button onClick={handleInsertRow} disabled={mutating} className="bg-blue-600 hover:bg-blue-700 min-w-[120px]">{mutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Insert Row</>}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#1B2431] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-400"><Trash2 className="w-5 h-5" /> Confirm Delete</DialogTitle>
            <DialogDescription className="text-gray-400">Are you sure you want to delete {selectedRows.size} row(s)?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-white/10">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSelected} disabled={mutating}>{mutating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PK/FK Warnings */}
      <AlertDialog open={showPkWarning} onOpenChange={setShowPkWarning}>
        <AlertDialogContent className="bg-[#1B2431] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-yellow-400"><AlertTriangle className="w-5 h-5 inline mr-2" /> Editing Primary Key</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">Changing a Primary Key may affect data integrity. Proceed?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowPkWarning(false); setShowEditModal(true); }} className="bg-yellow-600 hover:bg-yellow-700">Proceed</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showFkWarning} onOpenChange={setShowFkWarning}>
        <AlertDialogContent className="bg-[#1B2431] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-purple-400"><AlertTriangle className="w-5 h-5 inline mr-2" /> Editing Foreign Key</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">Changing a Foreign Key may break relationships. Proceed?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowFkWarning(false); setShowEditModal(true); }} className="bg-purple-600 hover:bg-purple-700">Proceed</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
