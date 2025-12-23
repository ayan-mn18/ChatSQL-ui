import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns,
  Filter,
  X,
  Copy,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';

interface ResultsTableProps {
  data: any[];
  columns: string[];
  isLoading?: boolean;
}

export default function ResultsTable({ data, columns, isLoading }: ResultsTableProps) {
  // State
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filter UI state
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Cell detail modal
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    content: any;
    column: string;
  }>({ isOpen: false, content: null, column: '' });

  // Reset pagination when data changes
  useMemo(() => {
    setCurrentPage(1);
  }, [data]);

  // Filtered & Sorted Data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    if (Object.keys(filters).length > 0) {
      result = result.filter(row => {
        return Object.entries(filters).every(([key, value]) => {
          const cellValue = String(row[key] ?? '').toLowerCase();
          return cellValue.includes(value.toLowerCase());
        });
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue < bValue ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, filters, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handlers
  const handleSort = (column: string) => {
    setSortConfig(current => ({
      key: column,
      direction: current.key === column && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleApplyFilter = () => {
    if (filterColumn && filterValue) {
      setFilters(prev => ({ ...prev, [filterColumn]: filterValue }));
      setFilterValue('');
      setIsFilterOpen(false);
    }
  };

  const removeFilter = (column: string) => {
    setFilters(prev => {
      const next = { ...prev };
      delete next[column];
      return next;
    });
  };

  const toggleColumnVisibility = (column: string) => {
    setHiddenColumns(prev => {
      const next = new Set(prev);
      if (next.has(column)) {
        next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const visibleColumns = columns.filter(col => !hiddenColumns.has(col));

  const calculateColumnWidth = (columnName: string): number => {
    const baseWidth = columnName.length * 10;
    const minWidth = Math.max(120, baseWidth + 40);
    return Math.min(minWidth, 300);
  };

  const renderCellValue = (value: any) => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    return String(value);
  };

  return (
    <div className="flex flex-col h-full bg-[#1B2431]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#273142]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {processedData.length} rows
          </span>
          {Object.keys(filters).length > 0 && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs text-gray-500">Filters:</span>
              {Object.entries(filters).map(([key, value]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => removeFilter(key)}
                >
                  {key}: {value} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-gray-400 hover:text-white"
                onClick={() => setFilters({})}
              >
                Clear all
              </Button>
            </div>
          )}
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
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
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
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="bg-[#1B2431] border-white/10 text-white"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleApplyFilter} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Apply
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setFilterColumn('');
                    setFilterValue('');
                    setIsFilterOpen(false);
                  }} className="border-white/10 text-gray-300">
                    Cancel
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto scrollbar-thin relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1B2431]/50 z-50 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        <Table>
          <TableHeader className="sticky top-0 bg-[#273142] z-10 shadow-sm">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="w-12 text-center sticky left-0 bg-[#273142] z-20">
                <span className="text-xs text-gray-500">#</span>
              </TableHead>
              {visibleColumns.map((column) => (
                <TableHead
                  key={column}
                  className="text-gray-400 font-medium cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                  style={{ minWidth: calculateColumnWidth(column) }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column}</span>
                    {sortConfig.key === column ? (
                      sortConfig.direction === 'asc' ?
                        <ArrowUp className="w-3 h-3 text-blue-400" /> :
                        <ArrowDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-50" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className="border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <TableCell className="text-center w-12 sticky left-0 bg-[#1B2431] group-hover:bg-[#232d3d] text-gray-500 text-xs font-mono border-r border-white/5">
                    {(currentPage - 1) * pageSize + rowIndex + 1}
                  </TableCell>
                  {visibleColumns.map((column) => {
                    const value = row[column];
                    const isNull = value === null || value === undefined;

                    return (
                      <TableCell
                        key={column}
                        className={cn(
                          'font-mono text-sm border-r border-white/5 last:border-r-0',
                          isNull ? 'text-gray-500 italic' : 'text-gray-300'
                        )}
                        style={{ maxWidth: 300 }}
                      >
                        <div className="flex items-center justify-between group/cell">
                          <span className="truncate block w-full" title={String(value)}>
                            {renderCellValue(value)}
                          </span>
                          {!isNull && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 opacity-0 group-hover/cell:opacity-100 transition-opacity"
                              onClick={() => setDetailModal({
                                isOpen: true,
                                content: value,
                                column
                              })}
                            >
                              <Maximize2 className="w-3 h-3 text-gray-400" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 1}
                  className="text-center py-12 text-gray-400"
                >
                  No data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-[#273142]">
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>
            Page {currentPage} of {totalPages || 1}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => setPageSize(parseInt(val, 10))}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage <= 1}
            className="border-white/10 bg-transparent text-white hover:bg-white/5"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="border-white/10 bg-transparent text-white hover:bg-white/5"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="border-white/10 bg-transparent text-white hover:bg-white/5"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="border-white/10 bg-transparent text-white hover:bg-white/5"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={detailModal.isOpen} onOpenChange={(open) => setDetailModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="bg-[#1B2431] border-white/10 text-white max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Cell Details: {detailModal.column}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(typeof detailModal.content === 'object' ? JSON.stringify(detailModal.content, null, 2) : String(detailModal.content))}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-[#0f172a] p-4 rounded-md border border-white/5">
            {typeof detailModal.content === 'object' ? (
              <Editor
                height="400px"
                defaultLanguage="json"
                value={JSON.stringify(detailModal.content, null, 2)}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  theme: 'vs-dark',
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                }}
              />
            ) : (
              <pre className="font-mono text-sm whitespace-pre-wrap break-all">
                {String(detailModal.content)}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
