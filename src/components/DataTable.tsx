import { useState, useMemo, useEffect } from 'react';
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { ArrowUpDown, ChevronLeft, ChevronRight, MoreHorizontal, Save, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export interface ColumnDef<T = any> {
  key: string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns?: ColumnDef<T>[];
  className?: string;
  onSave?: (updatedData: T[]) => Promise<void> | void;
}

export default function DataTable<T extends Record<string, any>>({
  data: initialData,
  columns: userColumns,
  className,
  onSave
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Edit mode state
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; key: string } | null>(null);
  const [editedRows, setEditedRows] = useState<Record<string, Partial<T>>>({});
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  // Mobile Edit Sheet State
  const [sheetEditingRowIndex, setSheetEditingRowIndex] = useState<number | null>(null);
  const [sheetEditData, setSheetEditData] = useState<T | null>(null);

  const handleSheetSave = async () => {
    if (sheetEditingRowIndex === null || !sheetEditData || !onSave) return;

    const newData = [...data];
    newData[sheetEditingRowIndex] = sheetEditData;

    await onSave(newData);
    setSheetEditingRowIndex(null);
    setSheetEditData(null);
  };

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Auto-generate columns if not provided
  const columns = useMemo<ColumnDef<T>[]>(() => {
    if (userColumns) return userColumns;
    if (!data || data.length === 0) return [];

    return Object.keys(data[0]).map(key => ({
      key,
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      sortable: true,
      filterable: true,
      editable: key !== 'id' && key !== 'created_at' && key !== 'updated_at'
    }));
  }, [data, userColumns]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleCellChange = (rowIndex: number, key: string, value: any) => {
    const rowId = (data[rowIndex] as any).id || rowIndex;
    setEditedRows(prev => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [key]: value
      }
    }));

    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [key]: value };
    setData(newData);
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(data);
    }
    setEditedRows({});
    setEditingCell(null);
    setIsSaveDialogOpen(false);
    toast.success('Changes saved successfully');
  };

  const handleCancelEdit = () => {
    setData(initialData);
    setEditedRows({});
    setEditingCell(null);
  };

  const processedData = useMemo(() => {
    let result = [...data];

    // Filtering
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        result = result.filter(item => {
          const val = item[key];
          return String(val).toLowerCase().includes(filters[key].toLowerCase());
        });
      }
    });

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, filters, sortConfig]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const hasChanges = Object.keys(editedRows).length > 0;

  if (!data) return null;

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-[#273142] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          {hasChanges && (
            <>
              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1e293b] border-white/10 text-gray-200">
                  <DialogHeader>
                    <DialogTitle>Save Changes?</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      You have modified {Object.keys(editedRows).length} rows. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>Confirm Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Right side toolbar items if any */}
        </div>
      </div>      <div className="flex-1 overflow-auto w-full [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-[#1B2431] [&::-webkit-scrollbar-thumb]:bg-[#273142] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#374151] transition-colors">
        <table className="w-full caption-bottom text-sm text-left border-collapse min-w-[800px]">
          <thead className="bg-[#273142] sticky top-0 z-10 shadow-sm">
            <tr className="border-b border-white/5 hover:bg-[#273142]">
              {columns.map((col) => (
                <th key={col.key} className={`h-10 px-4 font-medium text-gray-400 ${col.className || ''}`}>
                  <div className={`flex items-center gap-2 justify-between`}>
                    <span>{col.header}</span>
                    {(col.sortable !== false || col.filterable !== false) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/10 data-[state=open]:bg-white/10">
                            {sortConfig.key === col.key ? (
                              <ArrowUpDown className={`h-3 w-3 ${sortConfig.direction === 'asc' ? 'text-blue-400' : 'text-green-400'}`} />
                            ) : (
                              <MoreHorizontal className="h-3 w-3" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-[#1e293b] border-white/10 text-gray-200">
                          <DropdownMenuLabel>Options</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/10" />
                          {col.sortable !== false && (
                            <DropdownMenuItem onClick={() => handleSort(col.key)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                              <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-gray-400" />
                              Sort {sortConfig.key === col.key && sortConfig.direction === 'asc' ? 'Desc' : 'Asc'}
                            </DropdownMenuItem>
                          )}
                          {col.filterable !== false && (
                            <>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <div className="p-2">
                                <Input
                                  placeholder="Filter..."
                                  className="h-8 bg-[#0f172a] border-white/10 text-xs"
                                  value={filters[col.key] || ''}
                                  onChange={(e) => handleFilter(col.key, e.target.value)}
                                />
                              </div>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </th>
              ))}
              {onSave && <th className="h-10 px-4 font-medium text-gray-400 w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => {
              const actualIndex = (currentPage - 1) * itemsPerPage + rowIndex;
              return (
                <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  {columns.map((col) => {
                    const isCellEditing = editingCell?.rowIndex === actualIndex && editingCell?.key === col.key;
                    return (
                      <td
                        key={`${rowIndex}-${col.key}`}
                        className={`px-4 py-2 border-r border-white/5 last:border-r-0 ${col.className || ''}`}
                        onDoubleClick={() => {
                          if (col.editable !== false) {
                            setEditingCell({ rowIndex: actualIndex, key: col.key });
                          }
                        }}
                      >
                        {isCellEditing ? (
                          <Input
                            autoFocus
                            value={row[col.key] || ''}
                            onChange={(e) => handleCellChange(actualIndex, col.key, e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setEditingCell(null);
                              }
                            }}
                            className="h-8 bg-[#0f172a] border-white/10 text-xs focus-visible:ring-1 focus-visible:ring-blue-500"
                          />
                        ) : (
                          col.cell ? col.cell(row) : row[col.key]
                        )}
                      </td>
                    );
                  })}
                  {onSave && (
                    <td className="px-4 py-2 border-r border-white/5 last:border-r-0 w-10">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white"
                        onClick={() => {
                          setSheetEditingRowIndex(actualIndex);
                          setSheetEditData({ ...row });
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="h-14 shrink-0 border-t border-white/5 bg-[#273142] flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Rows per page</span>
            <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
              <SelectTrigger className="h-8 w-[70px] bg-[#1B2431] border-white/10 text-xs">
                <SelectValue placeholder={itemsPerPage} />
              </SelectTrigger>
              <SelectContent className="bg-[#1B2431] border-white/10 text-gray-200">
                {[10, 20, 50, 100].map(pageSize => (
                  <SelectItem key={pageSize} value={String(pageSize)} className="focus:bg-white/10 focus:text-white">{pageSize}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} results
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-xs text-gray-400 font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Sheet open={sheetEditingRowIndex !== null} onOpenChange={(open) => !open && setSheetEditingRowIndex(null)}>
        <SheetContent className="bg-[#1B2431] border-white/10 text-white overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">Edit Row</SheetTitle>
            <SheetDescription className="text-gray-400">
              Make changes to the row data here. Click save when you're done.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            {columns.map((col) => {
              if (col.editable === false) return null;
              return (
                <div key={col.key} className="grid gap-2">
                  <Label htmlFor={`edit-${col.key}`} className="text-gray-300">
                    {col.header}
                  </Label>
                  <Input
                    id={`edit-${col.key}`}
                    value={sheetEditData?.[col.key] || ''}
                    onChange={(e) => setSheetEditData(prev => prev ? ({ ...prev, [col.key]: e.target.value }) : null)}
                    className="bg-[#0f172a] border-white/10 text-white"
                  />
                </div>
              );
            })}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetEditingRowIndex(null)} className="border-white/10 text-gray-400 hover:text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button onClick={handleSheetSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              Save changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}