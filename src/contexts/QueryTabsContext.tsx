import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ============================================
// QUERY TABS CONTEXT
// Manages open SQL query tabs with localStorage persistence
// ============================================

export interface QueryResult {
  data: any[];
  columns: string[];
  rowCount: number;
  executionTime: number;
  error?: string;
  affectedRows?: number;
  queryType?: string;
  returning?: any[];
}

export interface QueryTab {
  id: string;
  connectionId: string;
  title: string;
  query: string;
  results?: QueryResult;
  isRunning: boolean;
  lastRun?: Date;
  isDirty: boolean;
}

interface QueryTabsContextType {
  tabs: QueryTab[];
  activeTabId: string | null;
  addTab: (connectionId: string, title?: string, query?: string) => string;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabQuery: (tabId: string, query: string) => void;
  updateTabResults: (tabId: string, results: QueryResult) => void;
  updateTabTitle: (tabId: string, title: string) => void;
  setTabRunning: (tabId: string, isRunning: boolean) => void;
  getActiveTab: () => QueryTab | undefined;
  getTabById: (tabId: string) => QueryTab | undefined;
  getTabsForConnection: (connectionId: string) => QueryTab[];
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: (connectionId?: string) => void;
  duplicateTab: (tabId: string) => string | null;
}

const QueryTabsContext = createContext<QueryTabsContextType | undefined>(undefined);

const STORAGE_KEY = 'chatsql-query-tabs';
const ACTIVE_TAB_KEY = 'chatsql-query-active-tab';

// Generate unique tab ID
const generateTabId = (): string => {
  return `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export function QueryTabsProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<QueryTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load tabs from localStorage on mount
  useEffect(() => {
    try {
      const storedTabs = localStorage.getItem(STORAGE_KEY);
      const storedActiveTab = localStorage.getItem(ACTIVE_TAB_KEY);

      if (storedTabs) {
        const parsedTabs = JSON.parse(storedTabs) as QueryTab[];
        // Reset isRunning state on reload
        const cleanedTabs = parsedTabs.map(tab => ({
          ...tab,
          isRunning: false,
          // Don't persist results in localStorage (too large)
          results: undefined,
        }));
        setTabs(cleanedTabs);
      }

      if (storedActiveTab) {
        setActiveTabId(storedActiveTab);
      }
    } catch (error) {
      console.error('Failed to load query tabs from localStorage:', error);
    }
    setIsInitialized(true);
  }, []);

  // Save tabs to localStorage whenever they change (without results)
  useEffect(() => {
    if (!isInitialized) return;

    try {
      // Don't store results in localStorage (can be large)
      const tabsToStore = tabs.map(tab => ({
        ...tab,
        results: undefined,
        isRunning: false,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabsToStore));
    } catch (error) {
      console.error('Failed to save query tabs to localStorage:', error);
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
      console.error('Failed to save active query tab to localStorage:', error);
    }
  }, [activeTabId, isInitialized]);

  const addTab = useCallback((connectionId: string, title?: string, query?: string): string => {
    const tabId = generateTabId();
    const connectionTabs = tabs.filter(t => t.connectionId === connectionId);
    const tabNumber = connectionTabs.length + 1;

    const newTab: QueryTab = {
      id: tabId,
      connectionId,
      title: title || `Query ${tabNumber}`,
      query: query || '',
      isRunning: false,
      isDirty: false,
    };

    setTabs(currentTabs => [...currentTabs, newTab]);
    setActiveTabId(tabId);

    return tabId;
  }, [tabs]);

  const removeTab = useCallback((tabId: string) => {
    setTabs(currentTabs => {
      const newTabs = currentTabs.filter(t => t.id !== tabId);

      // If we're removing the active tab, activate the previous tab or the first one
      if (activeTabId === tabId && newTabs.length > 0) {
        const removedTab = currentTabs.find(t => t.id === tabId);
        const samConnectionTabs = newTabs.filter(t => t.connectionId === removedTab?.connectionId);

        if (samConnectionTabs.length > 0) {
          setActiveTabId(samConnectionTabs[samConnectionTabs.length - 1].id);
        } else {
          setActiveTabId(newTabs[newTabs.length - 1].id);
        }
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }

      return newTabs;
    });
  }, [activeTabId]);

  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const updateTabQuery = useCallback((tabId: string, query: string) => {
    setTabs(currentTabs =>
      currentTabs.map(tab =>
        tab.id === tabId
          ? { ...tab, query, isDirty: true }
          : tab
      )
    );
  }, []);

  const updateTabResults = useCallback((tabId: string, results: QueryResult) => {
    setTabs(currentTabs =>
      currentTabs.map(tab =>
        tab.id === tabId
          ? { ...tab, results, lastRun: new Date(), isDirty: false, isRunning: false }
          : tab
      )
    );
  }, []);

  const updateTabTitle = useCallback((tabId: string, title: string) => {
    setTabs(currentTabs =>
      currentTabs.map(tab =>
        tab.id === tabId ? { ...tab, title } : tab
      )
    );
  }, []);

  const setTabRunning = useCallback((tabId: string, isRunning: boolean) => {
    setTabs(currentTabs =>
      currentTabs.map(tab =>
        tab.id === tabId ? { ...tab, isRunning } : tab
      )
    );
  }, []);

  const getActiveTab = useCallback((): QueryTab | undefined => {
    return tabs.find(t => t.id === activeTabId);
  }, [tabs, activeTabId]);

  const getTabById = useCallback((tabId: string): QueryTab | undefined => {
    return tabs.find(t => t.id === tabId);
  }, [tabs]);

  const getTabsForConnection = useCallback((connectionId: string): QueryTab[] => {
    return tabs.filter(t => t.connectionId === connectionId);
  }, [tabs]);

  const closeOtherTabs = useCallback((tabId: string) => {
    const tabToKeep = tabs.find(t => t.id === tabId);
    if (tabToKeep) {
      setTabs([tabToKeep]);
      setActiveTabId(tabId);
    }
  }, [tabs]);

  const closeAllTabs = useCallback((connectionId?: string) => {
    if (connectionId) {
      setTabs(currentTabs => {
        const remainingTabs = currentTabs.filter(t => t.connectionId !== connectionId);
        if (activeTabId && !remainingTabs.find(t => t.id === activeTabId)) {
          setActiveTabId(remainingTabs[0]?.id || null);
        }
        return remainingTabs;
      });
    } else {
      setTabs([]);
      setActiveTabId(null);
    }
  }, [activeTabId]);

  const duplicateTab = useCallback((tabId: string): string | null => {
    const tabToDuplicate = tabs.find(t => t.id === tabId);
    if (!tabToDuplicate) return null;

    const newTabId = generateTabId();
    const newTab: QueryTab = {
      ...tabToDuplicate,
      id: newTabId,
      title: `${tabToDuplicate.title} (Copy)`,
      results: undefined,
      isRunning: false,
      isDirty: true,
    };

    setTabs(currentTabs => [...currentTabs, newTab]);
    setActiveTabId(newTabId);

    return newTabId;
  }, [tabs]);

  return (
    <QueryTabsContext.Provider
      value={{
        tabs,
        activeTabId,
        addTab,
        removeTab,
        setActiveTab,
        updateTabQuery,
        updateTabResults,
        updateTabTitle,
        setTabRunning,
        getActiveTab,
        getTabById,
        getTabsForConnection,
        closeOtherTabs,
        closeAllTabs,
        duplicateTab,
      }}
    >
      {children}
    </QueryTabsContext.Provider>
  );
}

export function useQueryTabs() {
  const context = useContext(QueryTabsContext);
  if (!context) {
    throw new Error('useQueryTabs must be used within a QueryTabsProvider');
  }
  return context;
}
