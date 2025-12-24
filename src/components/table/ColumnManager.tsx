import { useState, useCallback, useMemo } from 'react';
import { Columns, Eye, EyeOff, GripVertical, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

export interface ColumnConfig {
  name: string;
  visible: boolean;
  order: number;
}

interface ColumnManagerProps {
  columns: string[];
  columnConfig: ColumnConfig[];
  onColumnConfigChange: (config: ColumnConfig[]) => void;
  primaryKeyColumn?: string;
  foreignKeyColumns?: Set<string>;
}

// ============================================
// SORTABLE COLUMN ITEM
// ============================================

interface SortableColumnItemProps {
  column: ColumnConfig;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  onToggleVisibility: (name: string) => void;
}

function SortableColumnItem({
  column,
  isPrimaryKey,
  isForeignKey,
  onToggleVisibility,
}: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md group",
        "hover:bg-white/5 transition-colors",
        isDragging && "opacity-50 bg-white/10"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {/* Visibility checkbox */}
      <Checkbox
        checked={column.visible}
        onCheckedChange={() => onToggleVisibility(column.name)}
        className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
      />

      {/* Column name */}
      <span className={cn(
        "flex-1 text-sm truncate",
        column.visible ? "text-gray-200" : "text-gray-500"
      )}>
        {column.name}
      </span>

      {/* Key indicators */}
      {isPrimaryKey && (
        <Badge variant="outline" className="h-4 px-1 text-[9px] border-yellow-500/30 text-yellow-400 shrink-0">
          PK
        </Badge>
      )}
      {isForeignKey && (
        <Badge variant="outline" className="h-4 px-1 text-[9px] border-purple-500/30 text-purple-400 shrink-0">
          FK
        </Badge>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ColumnManager({
  columns,
  columnConfig,
  onColumnConfigChange,
  primaryKeyColumn,
  foreignKeyColumns = new Set(),
}: ColumnManagerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sorted columns based on order
  const sortedConfig = useMemo(() => {
    return [...columnConfig].sort((a, b) => a.order - b.order);
  }, [columnConfig]);

  // Stats
  const visibleCount = columnConfig.filter(c => c.visible).length;
  const totalCount = columnConfig.length;

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sortedConfig.findIndex(c => c.name === active.id);
    const newIndex = sortedConfig.findIndex(c => c.name === over.id);

    const newSortedConfig = arrayMove(sortedConfig, oldIndex, newIndex);

    // Update order values
    const updatedConfig = newSortedConfig.map((col, idx) => ({
      ...col,
      order: idx,
    }));

    onColumnConfigChange(updatedConfig);
  }, [sortedConfig, onColumnConfigChange]);

  const toggleVisibility = useCallback((columnName: string) => {
    const updatedConfig = columnConfig.map(col =>
      col.name === columnName ? { ...col, visible: !col.visible } : col
    );
    onColumnConfigChange(updatedConfig);
  }, [columnConfig, onColumnConfigChange]);

  const showAll = useCallback(() => {
    const updatedConfig = columnConfig.map(col => ({ ...col, visible: true }));
    onColumnConfigChange(updatedConfig);
  }, [columnConfig, onColumnConfigChange]);

  const hideAll = useCallback(() => {
    // Keep at least primary key visible
    const updatedConfig = columnConfig.map(col => ({
      ...col,
      visible: col.name === primaryKeyColumn
    }));
    onColumnConfigChange(updatedConfig);
  }, [columnConfig, primaryKeyColumn, onColumnConfigChange]);

  const resetOrder = useCallback(() => {
    const updatedConfig = columns.map((name, idx) => {
      const existing = columnConfig.find(c => c.name === name);
      return {
        name,
        visible: existing?.visible ?? true,
        order: idx,
      };
    });
    onColumnConfigChange(updatedConfig);
  }, [columns, columnConfig, onColumnConfigChange]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "border-white/10 bg-transparent hover:bg-white/5 gap-2",
            visibleCount < totalCount ? "text-blue-400 border-blue-500/30" : "text-gray-400"
          )}
        >
          <Columns className="w-4 h-4" />
          <span>Columns</span>
          {visibleCount < totalCount && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-blue-500/20 text-blue-400 text-xs">
              {visibleCount}/{totalCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0 bg-[#1B2431] border-white/10"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Columns className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Columns</span>
            <Badge variant="secondary" className="h-5 px-1.5 bg-white/10 text-gray-400 text-xs">
              {visibleCount}/{totalCount}
            </Badge>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={showAll}
            className="h-6 px-2 text-xs text-gray-400 hover:text-white"
          >
            <Eye className="w-3 h-3 mr-1" />
            Show all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={hideAll}
            className="h-6 px-2 text-xs text-gray-400 hover:text-white"
          >
            <EyeOff className="w-3 h-3 mr-1" />
            Hide all
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={resetOrder}
            className="h-6 px-2 text-xs text-gray-400 hover:text-white"
            title="Reset column order"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>

        {/* Column list with drag-and-drop */}
        <div className="max-h-[320px] overflow-y-auto scrollbar-thin p-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedConfig.map(c => c.name)}
              strategy={verticalListSortingStrategy}
            >
              {sortedConfig.map(column => (
                <SortableColumnItem
                  key={column.name}
                  column={column}
                  isPrimaryKey={column.name === primaryKeyColumn}
                  isForeignKey={foreignKeyColumns.has(column.name)}
                  onToggleVisibility={toggleVisibility}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Footer hint */}
        <div className="px-3 py-2 border-t border-white/5 bg-[#273142]/50">
          <p className="text-xs text-gray-500">
            Drag to reorder • Settings saved per table
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
