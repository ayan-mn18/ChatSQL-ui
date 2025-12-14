import { useNavigate, useParams } from 'react-router-dom';
import { X, Database } from 'lucide-react';
import { useTableTabs, TableTab } from '@/contexts/TableTabsContext';
import { cn } from '@/lib/utils';

// ============================================
// TABLE TABS BAR COMPONENT
// Displays open table tabs with close buttons
// ============================================

export function TableTabsBar() {
  const { tabs, activeTabId, setActiveTab, removeTab } = useTableTabs();
  const navigate = useNavigate();
  const { connectionId } = useParams<{ connectionId: string }>();

  if (tabs.length === 0) {
    return null;
  }

  // Filter tabs for current connection
  const connectionTabs = tabs.filter(tab => tab.connectionId === connectionId);

  if (connectionTabs.length === 0) {
    return null;
  }

  const handleTabClick = (tab: TableTab) => {
    setActiveTab(tab.id);
    navigate(`/dashboard/connection/${tab.connectionId}/table/${tab.schemaName}/${tab.tableName}`);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const tabToClose = tabs.find(t => t.id === tabId);
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
  };

  return (
    <div className="flex items-center bg-[#1B2431] border-b border-white/5 overflow-x-auto scrollbar-thin">
      {connectionTabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => handleTabClick(tab)}
          className={cn(
            'group flex items-center gap-2 px-4 py-2 cursor-pointer border-r border-white/5 min-w-[140px] max-w-[200px] transition-colors',
            activeTabId === tab.id
              ? 'bg-[#273142] text-white border-b-2 border-b-blue-500'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
          )}
        >
          <Database className="w-3.5 h-3.5 shrink-0 text-blue-400" />
          <span className="truncate text-sm font-medium">{tab.displayName}</span>
          <button
            onClick={(e) => handleCloseTab(e, tab.id)}
            className={cn(
              'ml-auto p-0.5 rounded hover:bg-white/10 shrink-0 transition-opacity',
              activeTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
