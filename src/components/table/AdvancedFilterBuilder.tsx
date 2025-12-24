import { useState, useCallback, useMemo } from 'react';
import { Plus, X, Trash2, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { FilterCondition } from '@/services/connection.service';

// ============================================
// TYPES
// ============================================

type FilterOperator = FilterCondition['operator'];

interface FilterOperatorConfig {
  value: FilterOperator;
  label: string;
  description: string;
  requiresValue: boolean;
}

const FILTER_OPERATORS: FilterOperatorConfig[] = [
  { value: 'eq', label: '=', description: 'equals', requiresValue: true },
  { value: 'neq', label: '≠', description: 'not equals', requiresValue: true },
  { value: 'gt', label: '>', description: 'greater than', requiresValue: true },
  { value: 'gte', label: '≥', description: 'greater or equal', requiresValue: true },
  { value: 'lt', label: '<', description: 'less than', requiresValue: true },
  { value: 'lte', label: '≤', description: 'less or equal', requiresValue: true },
  { value: 'like', label: 'LIKE', description: 'pattern match (case-sensitive)', requiresValue: true },
  { value: 'ilike', label: 'ILIKE', description: 'pattern match (case-insensitive)', requiresValue: true },
  { value: 'in', label: 'IN', description: 'in list (comma separated)', requiresValue: true },
  { value: 'is_null', label: 'IS NULL', description: 'is null', requiresValue: false },
  { value: 'is_not_null', label: 'IS NOT NULL', description: 'is not null', requiresValue: false },
];

interface FilterRow {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
}

interface AdvancedFilterBuilderProps {
  columns: string[];
  activeFilters: FilterCondition[];
  onApplyFilters: (filters: FilterCondition[]) => void;
  onClearFilters: () => void;
}

// ============================================
// HELPER: Generate unique ID
// ============================================
let filterId = 0;
const generateFilterId = () => `filter-${++filterId}`;

// ============================================
// MAIN COMPONENT
// ============================================

export function AdvancedFilterBuilder({
  columns,
  activeFilters,
  onApplyFilters,
  onClearFilters,
}: AdvancedFilterBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterRows, setFilterRows] = useState<FilterRow[]>(() => {
    if (activeFilters.length === 0) {
      return [{ id: generateFilterId(), column: '', operator: 'ilike', value: '' }];
    }
    return activeFilters.map(f => ({
      id: generateFilterId(),
      column: f.column,
      operator: f.operator,
      value: String(f.value ?? ''),
    }));
  });

  // Reset filter rows when active filters change externally
  useMemo(() => {
    if (activeFilters.length === 0 && !isOpen) {
      setFilterRows([{ id: generateFilterId(), column: '', operator: 'ilike', value: '' }]);
    }
  }, [activeFilters, isOpen]);

  const addFilterRow = useCallback(() => {
    setFilterRows(prev => [...prev, { id: generateFilterId(), column: '', operator: 'ilike', value: '' }]);
  }, []);

  const removeFilterRow = useCallback((id: string) => {
    setFilterRows(prev => {
      const newRows = prev.filter(r => r.id !== id);
      return newRows.length === 0
        ? [{ id: generateFilterId(), column: '', operator: 'ilike', value: '' }]
        : newRows;
    });
  }, []);

  const updateFilterRow = useCallback((id: string, field: keyof FilterRow, value: string) => {
    setFilterRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      return { ...row, [field]: value };
    }));
  }, []);

  const handleApply = useCallback(() => {
    const validFilters: FilterCondition[] = filterRows
      .filter(row => {
        if (!row.column) return false;
        const op = FILTER_OPERATORS.find(o => o.value === row.operator);
        if (!op) return false;
        if (op.requiresValue && !row.value.trim()) return false;
        return true;
      })
      .map(row => {
        let value: any = row.value;

        // Handle IN operator - split by comma
        if (row.operator === 'in') {
          value = row.value.split(',').map(v => v.trim()).filter(Boolean);
        }
        // Handle null operators
        else if (row.operator === 'is_null' || row.operator === 'is_not_null') {
          value = null;
        }

        return {
          column: row.column,
          operator: row.operator,
          value,
        };
      });

    onApplyFilters(validFilters);
    setIsOpen(false);
  }, [filterRows, onApplyFilters]);

  const handleClear = useCallback(() => {
    setFilterRows([{ id: generateFilterId(), column: '', operator: 'ilike', value: '' }]);
    onClearFilters();
    setIsOpen(false);
  }, [onClearFilters]);

  const getOperatorConfig = (op: FilterOperator) => FILTER_OPERATORS.find(o => o.value === op);

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "border-white/10 bg-transparent hover:bg-white/5 gap-2",
              activeFilters.length > 0 ? "text-blue-400 border-blue-500/30" : "text-gray-400"
            )}
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-blue-500/20 text-blue-400 text-xs">
                {activeFilters.length}
              </Badge>
            )}
            <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[520px] p-0 bg-[#1B2431] border-white/10"
          align="start"
          sideOffset={8}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Filter Data</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={addFilterRow}
              className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add condition
            </Button>
          </div>

          {/* Filter Rows */}
          <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto scrollbar-thin">
            {filterRows.map((row, index) => {
              const opConfig = getOperatorConfig(row.operator);
              return (
                <div key={row.id} className="flex items-center gap-2">
                  {/* Row number */}
                  <span className="text-xs text-gray-500 w-4 shrink-0">{index + 1}</span>

                  {/* Column select */}
                  <Select value={row.column} onValueChange={(v) => updateFilterRow(row.id, 'column', v)}>
                    <SelectTrigger className="w-[140px] h-8 bg-[#273142] border-white/10 text-sm">
                      <SelectValue placeholder="Column" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#273142] border-white/10 max-h-[200px]">
                      {columns.map(col => (
                        <SelectItem key={col} value={col} className="text-sm">{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Operator select */}
                  <Select value={row.operator} onValueChange={(v) => updateFilterRow(row.id, 'operator', v as FilterOperator)}>
                    <SelectTrigger className="w-[120px] h-8 bg-[#273142] border-white/10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#273142] border-white/10">
                      {FILTER_OPERATORS.map(op => (
                        <SelectItem key={op.value} value={op.value} className="text-sm">
                          <span className="font-mono mr-2">{op.label}</span>
                          <span className="text-gray-400 text-xs">{op.description}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Value input */}
                  {opConfig?.requiresValue && (
                    <Input
                      value={row.value}
                      onChange={(e) => updateFilterRow(row.id, 'value', e.target.value)}
                      placeholder={row.operator === 'in' ? 'val1, val2, val3' : 'Value...'}
                      className="flex-1 h-8 bg-[#273142] border-white/10 text-sm"
                      data-chatsql-table-filter-value
                    />
                  )}

                  {/* Remove button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFilterRow(row.id)}
                    className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-[#273142]/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-gray-400 hover:text-white"
              data-chatsql-clear-filters
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Clear all
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="border-white/10"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Apply filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {activeFilters.map((filter, idx) => {
            const opConfig = getOperatorConfig(filter.operator);
            return (
              <Badge
                key={idx}
                variant="outline"
                className="border-blue-500/30 text-blue-400 bg-blue-500/10 cursor-pointer hover:bg-blue-500/20 transition-colors text-xs py-0.5"
                onClick={() => {
                  const newFilters = activeFilters.filter((_, i) => i !== idx);
                  onApplyFilters(newFilters);
                }}
              >
                <span className="font-medium">{filter.column}</span>
                <span className="mx-1 text-blue-300 font-mono">{opConfig?.label}</span>
                {opConfig?.requiresValue && (
                  <span className="text-blue-200">
                    {Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value)}
                  </span>
                )}
                <X className="w-3 h-3 ml-1.5 hover:text-white" />
              </Badge>
            );
          })}
          {activeFilters.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-6 px-2 text-xs text-gray-400 hover:text-white"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
