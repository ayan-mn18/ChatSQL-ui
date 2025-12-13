import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Plus,
  Trash2,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Database,
  AlertCircle,
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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTableData } from '@/hooks/useTableData';
import { ColumnUpdate, FilterCondition } from '@/services/connection.service';
import toast from 'react-hot-toast';

// ============================================
// TABLE VIEW COMPONENT
// ============================================

export default function TableView() {
  const { connectionId, schemaName, tableName } = useParams<{
    connectionId: string;
    schemaName: string;
    tableName: string;
  }>();

  const [searchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialPageSize = parseInt(searchParams.get('pageSize') || '50', 10);

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
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; column: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showInsertDialog, setShowInsertDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [insertValues, setInsertValues] = useState<Record<string, string>>({});
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');

  // Fetch data on mount
  useEffect(() => {
    if (connectionId && schemaName && tableName) {
      fetchData();
      fetchColumns();
    }
  }, [connectionId, schemaName, tableName]);

  // Get primary key column
  const primaryKeyColumn = useMemo(() => {
    return columnsMetadata?.primaryKey || data?.primaryKeyColumn || 'id';
  }, [columnsMetadata, data]);

  // Get columns from data or metadata
  const displayColumns = useMemo(() => {
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

  // ============================================
  // HANDLERS
  // ============================================

  const handleCellDoubleClick = (rowIndex: number, column: string, value: any) => {
    setEditingCell({ rowIndex, column });
    setEditValue(value === null ? '' : String(value));
  };

  const handleCellBlur = async () => {
    if (!editingCell || !data) return;

    const row = data.rows[editingCell.rowIndex];
    const originalValue = row[editingCell.column];

    // Skip if no change
    if (String(originalValue) === editValue || (originalValue === null && editValue === '')) {
      setEditingCell(null);
      return;
    }

    // Get primary key value
    const pkValue = row[primaryKeyColumn];
    if (!pkValue) {
      toast.error('Cannot update: No primary key found');
      setEditingCell(null);
      return;
    }

    // Determine column type
    const columnMeta = columnsMetadata?.columns?.find((c: any) => c.name === editingCell.column);
    const columnType = columnMeta?.type || 'text';

    // Build update
    const updates: ColumnUpdate[] = [{
      column: editingCell.column,
      value: editValue === '' ? null : editValue,
      columnType,
    }];

    const success = await updateRow(pkValue, updates);

    if (success) {
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleInsertRow = async () => {
    // Convert empty strings to null and parse numbers
    const values: Record<string, any> = {};

    for (const [key, val] of Object.entries(insertValues)) {
      if (val === '' || val === undefined) continue;

      // Try to parse as number if it looks like one
      const num = Number(val);
      if (!isNaN(num) && val.trim() !== '') {
        values[key] = num;
      } else {
        values[key] = val;
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
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getSortIcon = (column: string) => {
    if (currentOptions.sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    }
    return currentOptions.sortOrder === 'ASC'
      ? <ArrowUp className="w-3 h-3 text-blue-400" />
      : <ArrowDown className="w-3 h-3 text-blue-400" />;
  };

  // ============================================
  // LOADING / ERROR STATES
  // ============================================

  if (!connectionId || !schemaName || !tableName) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a table to view data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
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
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="h-screen flex flex-col bg-[#1B2431] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 px-4 md:px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">
              {schemaName}.{tableName}
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              {data?.totalCount || 0} rows
              {data?.cached && (
                <Badge variant="outline" className="ml-2 text-xs border-blue-500/30 text-blue-400">
                  Cached
                </Badge>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
                    {displayColumns.map((col) => (
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
      <div className="flex-1 overflow-auto">
        {loading && !data ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-[#273142] z-10">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="w-12 text-center">
                  <input
                    type="checkbox"
                    checked={data?.rows && selectedRows.size === data.rows.length}
                    onChange={toggleAllRows}
                    className="rounded border-white/20 bg-transparent"
                  />
                </TableHead>
                {displayColumns.map((column) => (
                  <TableHead
                    key={column}
                    className="text-gray-400 font-medium cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => toggleSort(column)}
                  >
                    <div className="flex items-center gap-2">
                      {column}
                      {getSortIcon(column)}
                      {column === primaryKeyColumn && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-yellow-500/30 text-yellow-400">
                          PK
                        </Badge>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.rows && data.rows.length > 0 ? (
                data.rows.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    className={`border-white/5 hover:bg-white/5 ${selectedRows.has(rowIndex) ? 'bg-blue-500/10' : ''
                      }`}
                  >
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIndex)}
                        onChange={() => toggleRowSelection(rowIndex)}
                        className="rounded border-white/20 bg-transparent"
                      />
                    </TableCell>
                    {displayColumns.map((column) => {
                      const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.column === column;
                      const value = row[column];

                      return (
                        <TableCell
                          key={column}
                          className="text-gray-300 font-mono text-sm"
                          onDoubleClick={() => handleCellDoubleClick(rowIndex, column, value)}
                        >
                          {isEditing ? (
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleCellBlur}
                              onKeyDown={handleKeyDown}
                              autoFocus
                              className="h-7 py-1 px-2 text-sm bg-[#1B2431] border-blue-500"
                            />
                          ) : (
                            <span className={value === null ? 'text-gray-500 italic' : ''}>
                              {value === null ? 'NULL' : renderCellValue(value)}
                            </span>
                          )}
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

      {/* Insert Dialog */}
      <Dialog open={showInsertDialog} onOpenChange={setShowInsertDialog}>
        <DialogContent className="bg-[#273142] border-white/10 text-white max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Insert New Row</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter values for each column. Leave empty to skip.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {displayColumns
              .filter(col => col !== primaryKeyColumn) // Skip primary key (usually auto-generated)
              .map((column) => (
                <div key={column} className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">{column}</label>
                  <Input
                    value={insertValues[column] || ''}
                    onChange={(e) => setInsertValues(prev => ({ ...prev, [column]: e.target.value }))}
                    placeholder={`Enter ${column}...`}
                    className="bg-[#1B2431] border-white/10"
                  />
                </div>
              ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInsertDialog(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInsertRow}
              disabled={mutating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {mutating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Insert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#273142] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete {selectedRows.size} row(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
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
            >
              {mutating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}