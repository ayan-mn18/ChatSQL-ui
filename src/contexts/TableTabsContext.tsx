import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ============================================
// TABLE TABS CONTEXT
// Manages open table tabs with localStorage persistence
// ============================================

export interface TableTab {
  id: string;
  connectionId: string;
  schemaName: string;
  tableName: string;
  displayName: string;
}

interface TableTabsContextType {
  tabs: TableTab[];
  activeTabId: string | null;
  addTab: (tab: Omit<TableTab, 'id' | 'displayName'>) => string;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  getTabById: (tabId: string) => TableTab | undefined;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
}

const TableTabsContext = createContext<TableTabsContextType | undefined>(undefined);

const STORAGE_KEY = 'chatsql-table-tabs';
const ACTIVE_TAB_KEY = 'chatsql-active-tab';

// Generate unique tab ID
const generateTabId = (connectionId: string, schemaName: string, tableName: string): string => {
  return `${connectionId}-${schemaName}-${tableName}`;
};

export function TableTabsProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<TableTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load tabs from localStorage on mount
  useEffect(() => {
    try {
      const storedTabs = localStorage.getItem(STORAGE_KEY);
      const storedActiveTab = localStorage.getItem(ACTIVE_TAB_KEY);

      if (storedTabs) {
        const parsedTabs = JSON.parse(storedTabs) as TableTab[];
        setTabs(parsedTabs);
      }

      if (storedActiveTab) {
        setActiveTabId(storedActiveTab);
      }
    } catch (error) {
      console.error('Failed to load tabs from localStorage:', error);
    }
    setIsInitialized(true);
  }, []);

  // Save tabs to localStorage whenever they change
  useEffect(() => {
    if (!isInitialized) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    } catch (error) {
      console.error('Failed to save tabs to localStorage:', error);
    }
  }, [tabs, isInitialized]);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized) return;

    try {
      if (activeTabId) {
        localStorage.setItem(ACTIVE_TAB_KEY, activeTabId);
      } else {
        localStorage.removeItem(ACTIVE_TAB_KEY);
      }
    } catch (error) {
      console.error('Failed to save active tab to localStorage:', error);
    }
  }, [activeTabId, isInitialized]);

  const addTab = useCallback((tabInfo: Omit<TableTab, 'id' | 'displayName'>): string => {
    const tabId = generateTabId(tabInfo.connectionId, tabInfo.schemaName, tabInfo.tableName);

    setTabs(currentTabs => {
      // Check if tab already exists
      const existingTab = currentTabs.find(t => t.id === tabId);
      if (existingTab) {
        return currentTabs;
      }

      // Add new tab
      const newTab: TableTab = {
        id: tabId,
        connectionId: tabInfo.connectionId,
        schemaName: tabInfo.schemaName,
        tableName: tabInfo.tableName,
        displayName: `${tabInfo.schemaName}.${tabInfo.tableName}`,
      };

      return [...currentTabs, newTab];
    });

    // Set as active
    setActiveTabId(tabId);

    return tabId;
  }, []);

  const removeTab = useCallback((tabId: string) => {
    setTabs(currentTabs => {
      const newTabs = currentTabs.filter(t => t.id !== tabId);

      // If we're removing the active tab, activate the previous tab or the first one
      if (activeTabId === tabId && newTabs.length > 0) {
        const removedIndex = currentTabs.findIndex(t => t.id === tabId);
        const newActiveIndex = Math.min(removedIndex, newTabs.length - 1);
        setActiveTabId(newTabs[newActiveIndex]?.id || null);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }

      return newTabs;
    });
  }, [activeTabId]);

  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const getTabById = useCallback((tabId: string): TableTab | undefined => {
    return tabs.find(t => t.id === tabId);
  }, [tabs]);

  const closeOtherTabs = useCallback((tabId: string) => {
    setTabs(currentTabs => currentTabs.filter(t => t.id === tabId));
  }, []);

  const closeAllTabs = useCallback(() => {
    setTabs([]);
    setActiveTabId(null);
  }, []);

  return (
    <TableTabsContext.Provider
      value={{
        tabs,
        activeTabId,
        addTab,
        removeTab,
        setActiveTab,
        getTabById,
        closeOtherTabs,
        closeAllTabs,
      }}
    >
      {children}
    </TableTabsContext.Provider>
  );
}

export function useTableTabs() {
  const context = useContext(TableTabsContext);
  if (!context) {
    throw new Error('useTableTabs must be used within a TableTabsProvider');
  }
  return context;
}
