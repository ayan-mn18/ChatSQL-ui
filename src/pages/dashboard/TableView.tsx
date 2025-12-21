import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
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
  Database,
  AlertCircle,
  Key,
  Link2,
  Copy,
  Save,
  ExternalLink,
  AlertTriangle,
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
import { useTableData } from '@/hooks/useTableData';
import { useTableTabs } from '@/contexts/TableTabsContext';
import { TableTabsBar } from '@/components/dashboard/TableTabsBar';
import { ColumnUpdate, FilterCondition, connectionService } from '@/services/connection.service';
import { ERDRelation } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import Editor from '@monaco-editor/react';

// ============================================
// CONSTANTS
// ============================================

const LONG_VALUE_THRESHOLD = 50; // Characters before showing in modal

// ============================================
// HELPER: Calculate column width based on column name
// ============================================
const calculateColumnWidth = (columnName: string): number => {
  const baseWidth = columnName.length * 10; // ~10px per character
  const minWidth = Math.max(120, baseWidth + 60); // Extra space for icons
  return Math.min(minWidth, 300); // Cap at 300px
};

// ============================================
// TABLE VIEW COMPONENT
// ============================================

export default function TableView() {
  const navigate = useNavigate();
  const { connectionId, schemaName, tableName } = useParams<{
    connectionId: string;
    schemaName: string;
    tableName: string;
  }>();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialPageSize = parseInt(searchParams.get('pageSize') || '50', 10);

  // FK navigation highlight params
  const highlightColumn = searchParams.get('highlightColumn');
  const highlightValue = searchParams.get('highlightValue');

  // Tabs management
  const { addTab } = useTableTabs();

  // Table data hook
  const {
    data,
    columns: columnsMetadata,
    loading,
    mutating,
    error,
    fetchData,
    fetchColumns,
    refetch,
    goToPage,
    setPageSize,
    toggleSort,
    setFilters,
    clearFilters,
    insertRow,
    updateRow,
    deleteRow,
    currentOptions,
  } = useTableData(connectionId || '', schemaName || '', tableName || '', {
    page: initialPage,
    pageSize: initialPageSize,
  });

  // Local state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showInsertDialog, setShowInsertDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [insertValues, setInsertValues] = useState<Record<string, string>>({});
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [relations, setRelations] = useState<ERDRelation[]>([]);
  const [highlightedRows, setHighlightedRows] = useState<Set<number>>(new Set());

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalData, setEditModalData] = useState<{
    rowIndex: number;
    column: string;
    value: string;
    originalValue: any;
  } | null>(null);

  // Calculate modal size based on content
  const isJsonEdit = useMemo(() => {
    if (!editModalData) return false;
    const columnMeta = columnsMetadata?.columns?.find((c: any) => c.name === editModalData.column);
    const value = editModalData.value || '';
    return columnMeta?.type?.includes('json') ||
      (value.trim().startsWith('{') || value.trim().startsWith('['));
  }, [editModalData, columnsMetadata]);

  const isLargeEdit = useMemo(() => {
    if (!editModalData) return false;
    const value = editModalData.value || '';
    return isJsonEdit || value.length > 150 || value.split('\n').length > 3;
  }, [editModalData, isJsonEdit]);

  // Warning dialogs
  const [showPkWarning, setShowPkWarning] = useState(false);
  const [showFkWarning, setShowFkWarning] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{
    rowIndex: number;
    column: string;
    value: any;
  } | null>(null);

  // FK context menu / action dialog
  const [fkMenuData, setFkMenuData] = useState<{
    relation: ERDRelation;
    value: any;
    x: number;
    y: number;
  } | null>(null);

  // FK Action Dialog (left-click)
  const [showFkActionDialog, setShowFkActionDialog] = useState(false);
  const [fkActionData, setFkActionData] = useState<{
    relation: ERDRelation;
    value: any;
    column: string;
  } | null>(null);

  // Click timer for distinguishing single vs double click
  const clickTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const CLICK_DELAY = 200; // ms to wait before treating as single click

  // Add tab when component mounts or table changes
  useEffect(() => {
    if (connectionId && schemaName && tableName) {
      addTab({ connectionId, schemaName, tableName });
    }
  }, [connectionId, schemaName, tableName, addTab]);

  // Fetch data on mount
  useEffect(() => {
    if (connectionId && schemaName && tableName) {
      fetchData();
      fetchColumns();
    }
  }, [connectionId, schemaName, tableName]);

  // Fetch relations for FK highlighting
  useEffect(() => {
    if (connectionId) {
      connectionService.getRelations(connectionId).then(res => {
        if (res.success && res.relations) {
          setRelations(res.relations);
        }
      }).catch(() => {
        // Silently fail - FK highlighting is optional
      });
    }
  }, [connectionId]);

  // Close FK menu on click outside
  useEffect(() => {
    const handleClick = () => setFkMenuData(null);
    if (fkMenuData) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [fkMenuData]);

  // Highlight rows when navigating from FK link
  useEffect(() => {
    if (highlightColumn && highlightValue && data?.rows) {
      const decodedValue = decodeURIComponent(highlightValue);
      const matchingIndices = new Set<number>();

      data.rows.forEach((row, index) => {
        const cellValue = row[highlightColumn];
        if (cellValue !== null && cellValue !== undefined && String(cellValue) === decodedValue) {
          matchingIndices.add(index);
        }
      });

      setHighlightedRows(matchingIndices);

      // Clear highlight params from URL after highlighting (optional - keeps URL clean)
      if (matchingIndices.size > 0) {
        // Show toast with match info
        toast.success(`Found ${matchingIndices.size} matching row(s)`, { icon: '🎯' });

        // Auto-clear highlight after 5 seconds
        const timer = setTimeout(() => {
          setHighlightedRows(new Set());
          // Clear URL params
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('highlightColumn');
          newParams.delete('highlightValue');
          setSearchParams(newParams, { replace: true });
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [highlightColumn, highlightValue, data?.rows, searchParams, setSearchParams]);

  // Get primary key column
  const primaryKeyColumn = useMemo(() => {
    return columnsMetadata?.primaryKey || data?.primaryKeyColumn || 'id';
  }, [columnsMetadata, data]);

  // Get foreign key columns for current table
  const foreignKeyColumns = useMemo(() => {
    if (!relations || !schemaName || !tableName) return new Map<string, ERDRelation>();

    const fkMap = new Map<string, ERDRelation>();
    relations.forEach(rel => {
      if (rel.source_schema === schemaName && rel.source_table === tableName) {
        fkMap.set(rel.source_column, rel);
      }
    });
    return fkMap;
  }, [relations, schemaName, tableName]);

  // Get all available columns
  const allColumns = useMemo(() => {
    if (data?.columns && data.columns.length > 0) {
      return data.columns;
    }
    if (columnsMetadata?.columns) {
      return columnsMetadata.columns.map((c: any) => c.name);
    }
    if (data?.rows && data.rows.length > 0) {
      return Object.keys(data.rows[0]);
    }
    return [];
  }, [data, columnsMetadata]);

  // Local state for hidden columns
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  // Load hidden columns from local storage
  useEffect(() => {
    if (connectionId && schemaName && tableName) {
      const key = `hidden_columns_${connectionId}_${schemaName}_${tableName}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setHiddenColumns(new Set(JSON.parse(saved)));
        } catch (e) {
          console.error('Failed to parse hidden columns', e);
        }
      } else {
        setHiddenColumns(new Set());
      }
    }
  }, [connectionId, schemaName, tableName]);

  // Save hidden columns to local storage
  const toggleColumnVisibility = useCallback((column: string) => {
    setHiddenColumns(prev => {
      const next = new Set(prev);
      if (next.has(column)) {
        next.delete(column);
      } else {
        next.add(column);
      }

      // Save to local storage
      if (connectionId && schemaName && tableName) {
        const key = `hidden_columns_${connectionId}_${schemaName}_${tableName}`;
        localStorage.setItem(key, JSON.stringify(Array.from(next)));
      }

      return next;
    });
  }, [connectionId, schemaName, tableName]);

  // Filter columns for display
  const displayColumns = useMemo(() => {
    return allColumns.filter(col => !hiddenColumns.has(col));
  }, [allColumns, hiddenColumns]);

  // ============================================
  // HANDLERS
  // ============================================

  // Get column type helper - defined before usage
  const getColumnType = useCallback((column: string): 'primary' | 'foreign' | 'normal' => {
    if (column === primaryKeyColumn) return 'primary';
    if (foreignKeyColumns.has(column)) return 'foreign';
    return 'normal';
  }, [primaryKeyColumn, foreignKeyColumns]);

  // Copy cell value to clipboard (direct copy - used internally)
  const copyToClipboard = useCallback((value: any) => {
    if (value === null || value === undefined) {
      toast('NULL value', { icon: '📋' });
      return;
    }

    const textValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    navigator.clipboard.writeText(textValue).then(() => {
      toast.success('Copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  }, []);

  // Smart cell click handler - distinguishes single vs double click
  const handleCellClick = useCallback((rowIndex: number, column: string, value: any) => {
    // Clear any existing timer
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    // Set a timer for single click action
    clickTimerRef.current = setTimeout(() => {
      const columnType = getColumnType(column);

      // For FK columns, show action dialog instead of just copying
      if (columnType === 'foreign' && value !== null && value !== undefined) {
        const relation = foreignKeyColumns.get(column);
        if (relation) {
          setFkActionData({ relation, value, column });
          setShowFkActionDialog(true);
          return;
        }
      }

      // For non-FK columns, copy to clipboard
      copyToClipboard(value);
    }, CLICK_DELAY);
  }, [getColumnType, foreignKeyColumns, copyToClipboard]);

  // Handle FK cell right-click
  const handleFkRightClick = useCallback((
    e: React.MouseEvent,
    column: string,
    value: any
  ) => {
    const relation = foreignKeyColumns.get(column);
    if (!relation || value === null || value === undefined) return;

    e.preventDefault();
    setFkMenuData({
      relation,
      value,
      x: e.clientX,
      y: e.clientY,
    });
  }, [foreignKeyColumns]);

  // Open FK value in new tab (from right-click context menu)
  const handleOpenFkInNewTab = useCallback(() => {
    if (!fkMenuData || !connectionId) return;

    const { relation, value } = fkMenuData;
    addTab({
      connectionId,
      schemaName: relation.target_schema,
      tableName: relation.target_table,
    });

    // Navigate to the target table with a filter to highlight the row
    navigate(`/dashboard/connection/${connectionId}/table/${relation.target_schema}/${relation.target_table}?highlightColumn=${relation.target_column}&highlightValue=${encodeURIComponent(value)}`);
    setFkMenuData(null);
  }, [fkMenuData, connectionId, addTab, navigate]);

  // Open FK value in new tab (from FK action dialog)
  const handleOpenFkFromDialog = useCallback(() => {
    if (!fkActionData || !connectionId) return;

    const { relation, value } = fkActionData;
    addTab({
      connectionId,
      schemaName: relation.target_schema,
      tableName: relation.target_table,
    });

    // Navigate to the target table with highlight params
    navigate(`/dashboard/connection/${connectionId}/table/${relation.target_schema}/${relation.target_table}?highlightColumn=${relation.target_column}&highlightValue=${encodeURIComponent(value)}`);
    setShowFkActionDialog(false);
    setFkActionData(null);
  }, [fkActionData, connectionId, addTab, navigate]);

  // Copy FK value from dialog
  const handleCopyFkFromDialog = useCallback(() => {
    if (!fkActionData) return;
    copyToClipboard(fkActionData.value);
    setShowFkActionDialog(false);
    setFkActionData(null);
  }, [fkActionData, copyToClipboard]);

  // Handle cell double-click for editing
  const handleCellDoubleClick = useCallback((rowIndex: number, column: string, value: any) => {
    const columnType = getColumnType(column);
    const strValue = value === null ? '' : (typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));

    // Check if it's PK or FK - show warning first
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

    // Open modal for editing
    setEditModalData({
      rowIndex,
      column,
      value: strValue,
      originalValue: value,
    });
    setShowEditModal(true);
  }, [getColumnType]);

  // Handle double click - cancel single click action and proceed with edit
  const handleCellDoubleClickWrapper = useCallback((rowIndex: number, column: string, value: any) => {
    // Cancel single click action
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    // Proceed with double click action (edit)
    handleCellDoubleClick(rowIndex, column, value);
  }, [handleCellDoubleClick]);

  // Proceed with edit after warning
  const handleProceedEdit = useCallback(() => {
    if (!pendingEdit) return;

    const strValue = pendingEdit.value === null ? '' :
      (typeof pendingEdit.value === 'object' ? JSON.stringify(pendingEdit.value, null, 2) : String(pendingEdit.value));

    setEditModalData({
      rowIndex: pendingEdit.rowIndex,
      column: pendingEdit.column,
      value: strValue,
      originalValue: pendingEdit.value,
    });
    setShowEditModal(true);
    setShowPkWarning(false);
    setShowFkWarning(false);
    setPendingEdit(null);
  }, [pendingEdit]);

  // Save edit from modal
  const handleSaveEdit = async () => {
    if (!editModalData || !data) return;

    const row = data.rows[editModalData.rowIndex];
    const originalValue = editModalData.originalValue;
    const newValue = editModalData.value;

    // Skip if no change
    const originalStr = originalValue === null ? '' :
      (typeof originalValue === 'object' ? JSON.stringify(originalValue) : String(originalValue));
    if (originalStr === newValue) {
      setShowEditModal(false);
      setEditModalData(null);
      return;
    }

    // Get primary key value
    const pkValue = row[primaryKeyColumn];
    if (!pkValue) {
      toast.error('Cannot update: No primary key found');
      setShowEditModal(false);
      setEditModalData(null);
      return;
    }

    // Determine column type
    const columnMeta = columnsMetadata?.columns?.find((c: any) => c.name === editModalData.column);
    const columnType = columnMeta?.type || 'text';

    // Parse value based on type
    let parsedValue: any = newValue === '' ? null : newValue;
    if (columnType.includes('json') && newValue) {
      try {
        parsedValue = JSON.parse(newValue);
      } catch {
        toast.error('Invalid JSON format');
        return;
      }
    }

    // Build update
    const updates: ColumnUpdate[] = [{
      column: editModalData.column,
      value: parsedValue,
      columnType,
    }];

    const success = await updateRow(pkValue, updates);

    if (success) {
      setShowEditModal(false);
      setEditModalData(null);
    }
  };

  // Copy from edit modal
  const handleCopyFromModal = useCallback(() => {
    if (!editModalData) return;
    navigator.clipboard.writeText(editModalData.value).then(() => {
      toast.success('Copied to clipboard');
    });
  }, [editModalData]);

  const handleInsertRow = async () => {
    const values: Record<string, any> = {};

    for (const [key, val] of Object.entries(insertValues)) {
      if (val === '' || val === undefined) continue;

      // Try to parse as number if it looks like one
      const num = Number(val);
      if (!isNaN(num) && val.trim() !== '') {
        values[key] = num;
      } else {
        // Try to parse as JSON
        try {
          values[key] = JSON.parse(val);
        } catch {
          values[key] = val;
        }
      }
    }

    const success = await insertRow(values);

    if (success) {
      setShowInsertDialog(false);
      setInsertValues({});
    }
  };

  const handleDeleteSelected = async () => {
    if (!data || selectedRows.size === 0) return;

    const rowsToDelete = Array.from(selectedRows).map(idx => data.rows[idx]);
    let deletedCount = 0;

    for (const row of rowsToDelete) {
      const pkValue = row[primaryKeyColumn];
      if (pkValue) {
        const success = await deleteRow(pkValue);
        if (success) deletedCount++;
      }
    }

    if (deletedCount > 0) {
      toast.success(`Deleted ${deletedCount} row(s)`);
      setSelectedRows(new Set());
      setShowDeleteDialog(false);
    }
  };

  const handleApplyFilter = () => {
    if (!filterColumn || !filterValue) return;

    const filter: FilterCondition = {
      column: filterColumn,
      operator: 'ilike',
      value: filterValue,
    };

    setFilters([filter]);
    setFilterColumn('');
    setFilterValue('');
  };

  const toggleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (!data) return;

    if (selectedRows.size === data.rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.rows.map((_, i) => i)));
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderCellValue = (value: any): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') {
      const json = JSON.stringify(value);
      return json.length > 30 ? json.substring(0, 27) + '...' : json;
    }
    const strValue = String(value);
    if (strValue.length > 40) {
      return strValue.substring(0, 37) + '...';
    }
    return strValue;
  };

  const getSortIcon = (column: string) => {
    if (currentOptions.sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 opacity-50 shrink-0" />;
    }
    return currentOptions.sortOrder === 'ASC'
      ? <ArrowUp className="w-3 h-3 text-blue-400 shrink-0" />
      : <ArrowDown className="w-3 h-3 text-blue-400 shrink-0" />;
  };

  const getColumnHeaderStyles = (column: string) => {
    const type = getColumnType(column);
    switch (type) {
      case 'primary':
        return 'bg-yellow-500/10 border-l-2 border-l-yellow-500';
      case 'foreign':
        return 'bg-purple-500/10 border-l-2 border-l-purple-500';
      default:
        return '';
    }
  };

  const getColumnCellStyles = (column: string) => {
    const type = getColumnType(column);
    switch (type) {
      case 'primary':
        return 'bg-yellow-500/5';
      case 'foreign':
        return 'bg-purple-500/5 cursor-pointer';
      default:
        return '';
    }
  };

  // ============================================
  // LOADING / ERROR STATES
  // ============================================

  if (!connectionId || !schemaName || !tableName) {
    return (
      <div className="h-full flex flex-col bg-[#1B2431]">
        <TableTabsBar />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a table to view data</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-[#1B2431]">
        <TableTabsBar />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <p className="text-red-400 mb-2">Error loading table data</p>
            <p className="text-sm">{error}</p>
            <Button onClick={refetch} className="mt-4" variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-[#1B2431] overflow-hidden">
        {/* Tabs Bar */}
        <TableTabsBar />

        {/* Header */}
        <div className="flex items-center justify-between shrink-0 px-4 md:px-6 py-3 border-b border-white/5 bg-[#273142]">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">
                  {schemaName}.{tableName}
                </h1>
                {data?.cached && (
                  <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                    Cached
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                <span>{data?.totalCount || 0} rows</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Primary Key
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Foreign Key
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Columns Visibility */}
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
                  {allColumns.map((col) => (
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
                      <label
                        htmlFor={`col-${col}`}
                        className="text-sm text-gray-300 cursor-pointer flex-1 truncate select-none"
                      >
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
                    <SelectTrigger className="bg-[#1B2431] border-white/10">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#273142] border-white/10">
                      {allColumns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Search value..."
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="bg-[#1B2431] border-white/10"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleApplyFilter} className="flex-1">
                      Apply
                    </Button>
                    <Button size="sm" variant="outline" onClick={clearFilters} className="border-white/10">
                      Clear
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Actions */}
            {selectedRows.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedRows.size})
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => setShowInsertDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
              className="border-white/10 bg-transparent text-gray-400 hover:bg-white/5"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {currentOptions.filters && currentOptions.filters.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-blue-500/5">
            <span className="text-xs text-gray-400">Filters:</span>
            {currentOptions.filters.map((filter, idx) => (
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

        {/* Table */}
        <div className="flex-1 overflow-auto scrollbar-thin">
          {loading && !data ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-[#273142] z-10">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-12 text-center sticky left-0 bg-[#273142]">
                    <input
                      type="checkbox"
                      checked={data?.rows && selectedRows.size === data.rows.length}
                      onChange={toggleAllRows}
                      className="rounded border-white/20 bg-transparent"
                    />
                  </TableHead>
                  {displayColumns.map((column) => {
                    const columnType = getColumnType(column);
                    const fkRelation = foreignKeyColumns.get(column);
                    const columnWidth = calculateColumnWidth(column);

                    return (
                      <TableHead
                        key={column}
                        className={cn(
                          'text-gray-400 font-medium cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap',
                          getColumnHeaderStyles(column)
                        )}
                        style={{ minWidth: columnWidth }}
                        onClick={() => toggleSort(column)}
                      >
                        <div className="flex items-center gap-2">
                          <span>{column}</span>
                          {getSortIcon(column)}
                          {columnType === 'primary' && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Key className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#1B2431] border-white/10 text-white">
                                Primary Key
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {columnType === 'foreign' && fkRelation && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Link2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#1B2431] border-white/10 text-white">
                                <div className="text-xs">
                                  <p className="font-medium">Foreign Key</p>
                                  <p className="text-gray-400">
                                    → {fkRelation.target_schema}.{fkRelation.target_table}.{fkRelation.target_column}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.rows && data.rows.length > 0 ? (
                  data.rows.map((row, rowIndex) => (
                    <TableRow
                      key={rowIndex}
                      className={cn(
                        'border-white/5 hover:bg-white/5 transition-colors',
                        selectedRows.has(rowIndex) && 'bg-blue-500/10',
                        highlightedRows.has(rowIndex) && 'bg-green-500/20 animate-pulse border-l-4 border-l-green-500'
                      )}
                    >
                      <TableCell className={cn(
                        "text-center w-12 sticky left-0",
                        highlightedRows.has(rowIndex) ? 'bg-green-500/20' : 'bg-[#1B2431]'
                      )}>
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
                        const columnWidth = calculateColumnWidth(column);

                        return (
                          <TableCell
                            key={column}
                            className={cn(
                              'font-mono text-sm cursor-pointer hover:bg-white/10 transition-colors',
                              getColumnCellStyles(column),
                              isNull ? 'text-gray-500 italic' : 'text-gray-300'
                            )}
                            style={{ minWidth: columnWidth, maxWidth: 300 }}
                            onClick={() => handleCellClick(rowIndex, column, value)}
                            onDoubleClick={() => handleCellDoubleClickWrapper(rowIndex, column, value)}
                            onContextMenu={(e) => {
                              if (columnType === 'foreign') {
                                handleFkRightClick(e, column, value);
                              }
                            }}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block truncate">
                                  {renderCellValue(value)}
                                </span>
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
                    <TableCell
                      colSpan={displayColumns.length + 1}
                      className="text-center py-8 text-gray-400"
                    >
                      No data found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* FK Context Menu */}
        {fkMenuData && (
          <div
            className="fixed z-50 bg-[#273142] border border-white/10 rounded-lg shadow-xl py-1 min-w-[180px]"
            style={{ left: fkMenuData.x, top: fkMenuData.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
              onClick={handleOpenFkInNewTab}
            >
              <ExternalLink className="w-4 h-4" />
              Open in {fkMenuData.relation.target_table}
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
              onClick={() => {
                handleCellClick(fkMenuData.value);
                setFkMenuData(null);
              }}
            >
              <Copy className="w-4 h-4" />
              Copy value
            </button>
          </div>
        )}

        {/* Pagination */}
        {data && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-[#273142]">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>
                Page {data.page} of {data.totalPages}
              </span>
              <Select
                value={String(currentOptions.pageSize)}
                onValueChange={(val) => setPageSize(parseInt(val, 10))}
              >
                <SelectTrigger className="w-32 h-8 bg-[#1B2431] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#273142] border-white/10">
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(1)}
                disabled={data.page <= 1 || loading}
                className="border-white/10 bg-transparent"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(data.page - 1)}
                disabled={data.page <= 1 || loading}
                className="border-white/10 bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(data.page + 1)}
                disabled={data.page >= data.totalPages || loading}
                className="border-white/10 bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(data.totalPages)}
                disabled={data.page >= data.totalPages || loading}
                className="border-white/10 bg-transparent"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Edit Value Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className={cn(
            "bg-[#1B2431] border-white/10 text-white flex flex-col transition-all duration-200",
            isLargeEdit ? "max-w-5xl h-[80vh]" : "max-w-xl"
          )}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Edit Value
                {editModalData && getColumnType(editModalData.column) === 'primary' && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    <Key className="w-3 h-3 mr-1" />
                    Primary Key
                  </Badge>
                )}
                {editModalData && getColumnType(editModalData.column) === 'foreign' && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    <Link2 className="w-3 h-3 mr-1" />
                    Foreign Key
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Column: <span className="text-white font-mono">{editModalData?.column}</span>
              </DialogDescription>
            </DialogHeader>

            <div className={cn(
              "py-4 flex flex-col",
              isLargeEdit ? "flex-1 min-h-0" : ""
            )}>
              {isJsonEdit ? (
                <div className="flex-1 border border-white/10 rounded-md overflow-hidden h-full">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={editModalData?.value || ''}
                    onChange={(value) => setEditModalData(prev => prev ? { ...prev, value: value || '' } : null)}
                    beforeMount={(monaco) => {
                      monaco.editor.defineTheme('chatsql-dark', {
                        base: 'vs-dark',
                        inherit: true,
                        rules: [],
                        colors: {
                          'editor.background': '#273142',
                          'editor.lineHighlightBackground': '#ffffff0a',
                          'editorGutter.background': '#273142',
                        }
                      });
                    }}
                    theme="chatsql-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      formatOnPaste: true,
                      formatOnType: true,
                    }}
                  />
                </div>
              ) : (
                <Textarea
                  value={editModalData?.value || ''}
                  onChange={(e) => setEditModalData(prev => prev ? { ...prev, value: e.target.value } : null)}
                  className={cn(
                    "bg-[#273142] border-white/10 font-mono text-sm resize-none",
                    isLargeEdit ? "h-full" : "min-h-[150px]"
                  )}
                  placeholder="Enter value..."
                />
              )}
            </div>

            <DialogFooter className="flex gap-2 items-center">
              {isJsonEdit && (
                <Button
                  variant="outline"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(editModalData?.value || '');
                      const formatted = JSON.stringify(parsed, null, 2);
                      setEditModalData(prev => prev ? { ...prev, value: formatted } : null);
                      toast.success('Formatted JSON');
                    } catch (e) {
                      toast.error('Invalid JSON');
                    }
                  }}
                  className="border-white/10 mr-2"
                >
                  <Code className="w-4 h-4 mr-2" />
                  Format JSON
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleCopyFromModal}
                className="border-white/10"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <div className="flex-1" />
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditModalData(null);
                }}
                className="border-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={mutating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {mutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>        {/* PK Warning Dialog */}
        <AlertDialog open={showPkWarning} onOpenChange={setShowPkWarning}>
          <AlertDialogContent className="bg-[#1B2431] border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="w-5 h-5" />
                Editing Primary Key
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                You are about to edit a <span className="text-yellow-400 font-semibold">Primary Key</span> column.
                This is a unique identifier and changing it may affect data integrity and relationships with other tables.
                <br /><br />
                Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-white/10 text-gray-300 hover:bg-white/5">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleProceedEdit}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Proceed with Caution
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* FK Warning Dialog */}
        <AlertDialog open={showFkWarning} onOpenChange={setShowFkWarning}>
          <AlertDialogContent className="bg-[#1B2431] border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-purple-400">
                <AlertTriangle className="w-5 h-5" />
                Editing Foreign Key
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                You are about to edit a <span className="text-purple-400 font-semibold">Foreign Key</span> column.
                This value references another table and changing it may break the relationship or cause referential integrity errors.
                <br /><br />
                Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-white/10 text-gray-300 hover:bg-white/5">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleProceedEdit}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Proceed with Caution
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* FK Action Dialog - Left Click on FK */}
        <Dialog open={showFkActionDialog} onOpenChange={setShowFkActionDialog}>
          <DialogContent className="bg-[#1B2431] border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-purple-400" />
                Foreign Key Action
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {fkActionData && (
                  <>
                    Column <span className="text-white font-mono">{fkActionData.column}</span> references{' '}
                    <span className="text-purple-400 font-mono">
                      {fkActionData.relation.target_schema}.{fkActionData.relation.target_table}.{fkActionData.relation.target_column}
                    </span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              {/* Show the value */}
              <div className="bg-[#273142] rounded-lg p-3 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Value</p>
                <p className="font-mono text-sm text-white break-all">
                  {fkActionData?.value !== null && fkActionData?.value !== undefined
                    ? String(fkActionData.value)
                    : <span className="text-gray-500 italic">NULL</span>
                  }
                </p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleCopyFkFromDialog}
                  className="border-white/10 hover:bg-white/5"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Value
                </Button>
                <Button
                  onClick={handleOpenFkFromDialog}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={fkActionData?.value === null || fkActionData?.value === undefined}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in {fkActionData?.relation.target_table}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Insert Dialog - Enhanced */}
        <Dialog open={showInsertDialog} onOpenChange={setShowInsertDialog}>
          <DialogContent className="bg-[#1B2431] border-white/10 text-white max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="border-b border-white/10 pb-4">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-blue-400" />
                </div>
                Insert New Row
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new record to <span className="text-white font-mono">{schemaName}.{tableName}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayColumns
                  .filter(col => col !== primaryKeyColumn)
                  .map((column) => {
                    const columnType = getColumnType(column);
                    const fkRelation = foreignKeyColumns.get(column);

                    return (
                      <div key={column} className="space-y-2">
                        <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          {column}
                          {columnType === 'foreign' && fkRelation && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-500/30 text-purple-400">
                              <Link2 className="w-2.5 h-2.5 mr-1" />
                              {fkRelation.target_table}
                            </Badge>
                          )}
                        </Label>
                        <Input
                          value={insertValues[column] || ''}
                          onChange={(e) => setInsertValues(prev => ({ ...prev, [column]: e.target.value }))}
                          placeholder={`Enter ${column}...`}
                          className="bg-[#273142] border-white/10 focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                    );
                  })}
              </div>
            </div>

            <DialogFooter className="border-t border-white/10 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInsertDialog(false);
                  setInsertValues({});
                }}
                className="border-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInsertRow}
                disabled={mutating}
                className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
              >
                {mutating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Insert Row
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-[#1B2431] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-red-400">
                <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                Confirm Delete
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to delete <span className="text-white font-semibold">{selectedRows.size} row(s)</span>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="border-white/10"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSelected}
                disabled={mutating}
                className="min-w-[100px]"
              >
                {mutating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
