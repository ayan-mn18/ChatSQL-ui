import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Database, MoreHorizontal, XCircle } from 'lucide-react';
import { useTableTabs, TableTab } from '@/contexts/TableTabsContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ============================================
// SMART TAB NAME GENERATION
// ============================================

function getSmartTabName(tab: TableTab, allTabs: TableTab[], maxLength: number = 28): string {
  const { schemaName, tableName } = tab;

  // Check if there are other tables with the same name in different schemas
  const sameTableNames = allTabs.filter(
    t => t.tableName === tableName && t.schemaName !== schemaName
  );

  // If table name is unique across all open tabs, just show table name
  if (sameTableNames.length === 0) {
    if (tableName.length <= maxLength) {
      return tableName;
    }
    return tableName.slice(0, maxLength - 2) + '…';
  }

  // If there are conflicts, show schema.table but prioritize table name
  const fullName = `${schemaName}.${tableName}`;

  if (fullName.length <= maxLength) {
    return fullName;
  }

  // Truncate schema, keep more of table name
  const schemaMaxLen = Math.max(3, maxLength - tableName.length - 2);
  const truncatedSchema = schemaName.length > schemaMaxLen
    ? schemaName.slice(0, schemaMaxLen - 1) + '…'
    : schemaName;

  const result = `${truncatedSchema}.${tableName}`;

  if (result.length <= maxLength) {
    return result;
  }

  // Last resort: truncate table name too
  return result.slice(0, maxLength - 1) + '…';
}

// ============================================
// SORTABLE TAB COMPONENT
// ============================================

interface SortableTabProps {
  tab: TableTab;
  allTabs: TableTab[];
  isActive: boolean;
  onTabClick: (tab: TableTab) => void;
  onCloseTab: (e: React.MouseEvent, tabId: string) => void;
  onCloseOthers: (tabId: string) => void;
  onCloseAll: () => void;
}

function SortableTab({
  tab,
  allTabs,
  isActive,
  onTabClick,
  onCloseTab,
  onCloseOthers,
  onCloseAll,
}: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const smartName = useMemo(
    () => getSmartTabName(tab, allTabs),
    [tab, allTabs]
  );

  const fullName = `${tab.schemaName}.${tab.tableName}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          className={cn(
            'group relative flex items-center gap-2 px-3 py-2 cursor-pointer',
            'border-r border-white/5 min-w-[80px] max-w-[240px]',
            'transition-all duration-150',
            isActive
              ? 'bg-[#273142] text-white'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
            isDragging && 'opacity-60 shadow-lg'
          )}
          onClick={() => onTabClick(tab)}
          {...attributes}
          {...listeners}
        >
          {/* Active indicator */}
          {isActive && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}

          {/* Icon */}
          <Database className={cn(
            "w-3.5 h-3.5 shrink-0",
            isActive ? "text-blue-400" : "text-gray-500"
          )} />

          {/* Tab name */}
          <span className="truncate text-sm font-medium select-none">
            {smartName}
          </span>

          {/* Close button / Context menu */}
          <div className="ml-auto flex items-center gap-0.5 shrink-0">
            {/* Close button */}
            <button
              onClick={(e) => onCloseTab(e, tab.id)}
              className={cn(
                'p-0.5 rounded hover:bg-white/10 transition-opacity',
                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Context menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    'p-0.5 rounded hover:bg-white/10 transition-opacity',
                    'opacity-0 group-hover:opacity-100'
                  )}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-[#273142] border-white/10 w-48"
                align="start"
              >
                <DropdownMenuItem
                  onClick={() => onCloseTab({ stopPropagation: () => { } } as React.MouseEvent, tab.id)}
                  className="text-sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onCloseOthers(tab.id)}
                  className="text-sm"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Close others
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={onCloseAll}
                  className="text-sm text-red-400 focus:text-red-400"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Close all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="bg-[#1B2431] border-white/10 text-white"
      >
        <div className="text-xs">
          <p className="font-medium">{fullName}</p>
          <p className="text-gray-400 mt-0.5">Connection: {tab.connectionId.slice(0, 8)}…</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================
// DRAG OVERLAY PREVIEW
// ============================================

function TabDragPreview({ tab, allTabs }: { tab: TableTab; allTabs: TableTab[] }) {
  const smartName = getSmartTabName(tab, allTabs);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#273142] border border-blue-500/50 rounded-md shadow-xl">
      <Database className="w-3.5 h-3.5 text-blue-400" />
      <span className="text-sm font-medium text-white">{smartName}</span>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TableTabsBar() {
  const { tabs, activeTabId, setActiveTab, removeTab, reorderTabs, closeOtherTabs, closeAllTabs } = useTableTabs();
  const navigate = useNavigate();
  const { connectionId } = useParams<{ connectionId: string }>();
  const [draggedTab, setDraggedTab] = useState<TableTab | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter tabs for current connection
  const connectionTabs = useMemo(
    () => tabs.filter(tab => tab.connectionId === connectionId),
    [tabs, connectionId]
  );

  const handleTabClick = useCallback((tab: TableTab) => {
    setActiveTab(tab.id);
    navigate(`/dashboard/connection/${tab.connectionId}/table/${tab.schemaName}/${tab.tableName}`);
  }, [navigate, setActiveTab]);

  const handleCloseTab = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const remainingTabs = connectionTabs.filter(t => t.id !== tabId);

    removeTab(tabId);

    // If closing active tab, navigate to next tab or overview
    if (activeTabId === tabId) {
      if (remainingTabs.length > 0) {
        const nextTab = remainingTabs[0];
        navigate(`/dashboard/connection/${nextTab.connectionId}/table/${nextTab.schemaName}/${nextTab.tableName}`);
      } else if (connectionId) {
        navigate(`/dashboard/connection/${connectionId}/overview`);
      }
    }
  }, [activeTabId, connectionId, connectionTabs, navigate, removeTab]);

  const handleCloseOthers = useCallback((tabId: string) => {
    closeOtherTabs(tabId);
  }, [closeOtherTabs]);

  const handleCloseAll = useCallback(() => {
    closeAllTabs();
    if (connectionId) {
      navigate(`/dashboard/connection/${connectionId}/overview`);
    }
  }, [closeAllTabs, connectionId, navigate]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const tab = connectionTabs.find(t => t.id === event.active.id);
    setDraggedTab(tab || null);
  }, [connectionTabs]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDraggedTab(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = connectionTabs.findIndex(t => t.id === active.id);
    const newIndex = connectionTabs.findIndex(t => t.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderTabs(oldIndex, newIndex);
    }
  }, [connectionTabs, reorderTabs]);

  if (connectionTabs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center bg-[#1B2431] border-b border-white/5 overflow-x-auto scrollbar-thin">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={connectionTabs.map(t => t.id)}
          strategy={horizontalListSortingStrategy}
        >
          {connectionTabs.map((tab) => (
            <SortableTab
              key={tab.id}
              tab={tab}
              allTabs={connectionTabs}
              isActive={activeTabId === tab.id}
              onTabClick={handleTabClick}
              onCloseTab={handleCloseTab}
              onCloseOthers={handleCloseOthers}
              onCloseAll={handleCloseAll}
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {draggedTab && (
            <TabDragPreview tab={draggedTab} allTabs={connectionTabs} />
          )}
        </DragOverlay>
      </DndContext>

      {/* Tab count indicator when many tabs */}
      {connectionTabs.length > 5 && (
        <div className="px-3 py-2 text-xs text-gray-500 shrink-0">
          {connectionTabs.length} tabs
        </div>
      )}
    </div>
  );
}
