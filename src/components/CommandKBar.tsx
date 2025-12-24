import { type ReactNode, useEffect, useMemo, useCallback, useState } from 'react';
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  KBarResults,
  useMatches,
  useKBar,
  useRegisterActions,
  VisualState,
  type ActionImpl,
  type Action,
} from 'kbar';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { connectionService } from '@/services/connection.service';
import type { ApiResponse, ConnectionPublic } from '@/types';
import toast from 'react-hot-toast';

type FullSchemaResponse = ApiResponse<{
  tables: Array<{
    schema: string;
    name: string;
    columns: Array<{ name: string; type: string }>;
  }>;
}>;

type FullSchemaTable = {
  schema: string;
  name: string;
  columns?: Array<{ name: string; type: string }>;
};

function getTablesFromFullSchemaResponse(response: unknown): FullSchemaTable[] {
  const r: any = response;
  const tables = r?.data?.tables ?? r?.tables ?? r?.data?.data?.tables;
  return Array.isArray(tables) ? (tables as FullSchemaTable[]) : [];
}

function buildDynamicActions(params: {
  connections: ConnectionPublic[];
  currentConnectionId: string | null;
  queryClient: ReturnType<typeof useQueryClient>;
  go: (path: string) => void;
  onRequestReindex: () => void;
}): Action[] {
  const { connections, currentConnectionId, queryClient, go, onRequestReindex } = params;

  const connectionJumpActions: Action[] = connections.map((conn) => ({
    id: `conn.open.${conn.id}`,
    name: `Open connection: ${conn.name}`,
    section: 'Connections',
    keywords: `connection ${conn.name} ${conn.db_name} ${conn.host}`,
    perform: () => go(`/dashboard/connection/${conn.id}/overview`),
  }));

  const tableNavActions: Action[] = [];
  for (const conn of connections) {
    const fullSchema = queryClient.getQueryData<FullSchemaResponse>(queryKeys.fullSchema(conn.id));
    const tables = getTablesFromFullSchemaResponse(fullSchema);
    for (const t of tables) {
      const schema = t.schema;
      const table = t.name;
      tableNavActions.push({
        id: `table.open.${conn.id}.${schema}.${table}`,
        name: `${conn.name} / ${schema}.${table}`,
        section: 'Tables',
        keywords: `${conn.name} ${schema} ${table} ${schema}.${table} table schema`,
        perform: () =>
          go(`/dashboard/connection/${conn.id}/table/${encodePathSegment(schema)}/${encodePathSegment(table)}`),
      });
    }
  }

  const indexedConnections = connections.filter((c) => {
    const cached = queryClient.getQueryData<FullSchemaResponse>(queryKeys.fullSchema(c.id));
    return getTablesFromFullSchemaResponse(cached).length > 0;
  }).length;
  const totalTables = connections.reduce((acc, c) => {
    const cached = queryClient.getQueryData<FullSchemaResponse>(queryKeys.fullSchema(c.id));
    return acc + getTablesFromFullSchemaResponse(cached).length;
  }, 0);

  const indexActions: Action[] = [
    {
      id: 'kbar.index.status',
      name: 'CmdK: Schema index status',
      section: 'Command Palette',
      keywords: 'kbar cmdk index status schema tables',
      perform: () => {
        const current = currentConnectionId ? ` (current: ${currentConnectionId})` : '';
        toast.success(`Indexed ${indexedConnections}/${connections.length} connections, ${totalTables} tables${current}`);
      },
    },
    {
      id: 'kbar.index.refresh',
      name: 'CmdK: Refresh schema index',
      section: 'Command Palette',
      keywords: 'kbar cmdk refresh index schema tables reload',
      perform: async () => {
        // Invalidate cached schema metadata and refetch progressively.
        for (const conn of connections) {
          queryClient.removeQueries({ queryKey: queryKeys.fullSchema(conn.id) });
        }
        toast.success('Refreshing schema index…');
        onRequestReindex();
      },
    },
  ];

  return [...indexActions, ...connectionJumpActions, ...tableNavActions];
}

function CommandKBarDynamicActions({
  connections,
  currentConnectionId,
  schemaIndexVersion,
  go,
  onRequestReindex,
}: {
  connections: ConnectionPublic[];
  currentConnectionId: string | null;
  schemaIndexVersion: number;
  go: (path: string) => void;
  onRequestReindex: () => void;
}) {
  const queryClient = useQueryClient();
  const { query, visualState } = useKBar((state) => ({ visualState: state.visualState }));

  const dynamicActions = useMemo(
    () =>
      buildDynamicActions({
        connections,
        currentConnectionId,
        queryClient,
        go,
        onRequestReindex,
      }),
    [connections, currentConnectionId, go, onRequestReindex, queryClient, schemaIndexVersion]
  );

  useRegisterActions(dynamicActions, [dynamicActions]);

  // When palette opens, prioritize indexing the current connection.
  useEffect(() => {
    if (visualState !== VisualState.showing) return;
    if (!currentConnectionId) return;

    const existing = queryClient.getQueryData<FullSchemaResponse>(queryKeys.fullSchema(currentConnectionId));
    if (getTablesFromFullSchemaResponse(existing).length > 0) return;

    void queryClient
      .fetchQuery({
        queryKey: queryKeys.fullSchema(currentConnectionId),
        queryFn: () => connectionService.getFullSchema(currentConnectionId),
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
      })
      .then(() => {
        // close+reopen not required; actions will register after version bump in parent
        // but we can also nudge the results by triggering a re-query
        query.setSearch('');
        onRequestReindex();
      })
      .catch(() => {
        toast.error('Failed to load schema metadata for CmdK');
      });
  }, [currentConnectionId, onRequestReindex, query, queryClient, visualState]);

  return null;
}

const queryKeys = {
  connections: ['kbar', 'connections'] as const,
  fullSchema: (connectionId: string) => ['kbar', 'fullSchema', connectionId] as const,
};

function isVisibleElement(element: Element): boolean {
  const rects = element.getClientRects();
  if (!rects || rects.length === 0) return false;
  const style = window.getComputedStyle(element);
  return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
}

function focusFirstVisibleInput(selector: string) {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(selector));
  const target = inputs.find(isVisibleElement);
  if (!target) return;
  target.focus();
  target.select?.();
}

function clickFirstVisibleButton(selector: string) {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(selector));
  const target = buttons.find(isVisibleElement);
  target?.click();
}

function extractConnectionId(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/connection\/([^/]+)(?:\/|$)/);
  return match?.[1] ?? null;
}

function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}

function ResultItem({
  action,
  active,
}: {
  action: ActionImpl;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2 rounded-md',
        active ? 'bg-accent text-accent-foreground' : 'text-foreground'
      )}
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{action.name}</div>
        {action.subtitle ? (
          <div className="truncate text-xs text-muted-foreground">{action.subtitle}</div>
        ) : null}
      </div>
      {action.shortcut?.length ? (
        <div className="flex gap-1 ml-3 flex-shrink-0">
          {action.shortcut.map(sc => (
            <kbd
              key={sc}
              className="px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground text-[11px]"
            >
              {sc}
            </kbd>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CommandKBarUI() {
  const { results } = useMatches();

  return (
    <KBarPortal>
      <KBarPositioner className="z-50 bg-black/50">
        <KBarAnimator className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="border-b border-border">
            <KBarSearch
              className={cn(
                'w-full bg-transparent px-4 py-3 outline-none',
                'text-sm placeholder:text-muted-foreground'
              )}
              placeholder="Type a command or search…"
            />
          </div>
          <div className="max-h-[55vh] overflow-auto p-2">
            <KBarResults
              items={results}
              onRender={({ item, active }) =>
                typeof item === 'string' ? (
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">{item}</div>
                ) : (
                  <ResultItem action={item} active={active} />
                )
              }
            />
          </div>
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  );
}

export function CommandKBarProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [schemaIndexVersion, setSchemaIndexVersion] = useState(0);

  const connectionId = useMemo(() => extractConnectionId(location.pathname), [location.pathname]);

  const go = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  const connectionsQuery = useQuery({
    queryKey: queryKeys.connections,
    queryFn: async () => {
      const response = await connectionService.getAllConnections();
      return response.data || [];
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Build / refresh the in-memory (React Query) schema index.
  // Uses cached data if present; fetches full schema metadata if missing or stale.
  useEffect(() => {
    if (!isAuthenticated) return;

    const connections = connectionsQuery.data || [];
    if (connections.length === 0) return;

    let cancelled = false;

    const buildIndex = async () => {
      // Prefer current connection first (better perceived speed).
      const ordered: ConnectionPublic[] = connectionId
        ? [...connections].sort((a, b) => (a.id === connectionId ? -1 : b.id === connectionId ? 1 : 0))
        : connections;

      for (const conn of ordered) {
        if (cancelled) return;

        // Skip if we already have data in cache.
        const existing = queryClient.getQueryData<FullSchemaResponse>(queryKeys.fullSchema(conn.id));
        if (getTablesFromFullSchemaResponse(existing).length) continue;

        try {
          await queryClient.fetchQuery({
            queryKey: queryKeys.fullSchema(conn.id),
            queryFn: () => connectionService.getFullSchema(conn.id),
            staleTime: 30 * 60 * 1000,
            gcTime: 60 * 60 * 1000,
          });
          if (!cancelled) setSchemaIndexVersion(v => v + 1);
        } catch {
          // Best-effort: failing to index one connection shouldn't break CmdK.
        }
      }
    };

    void buildIndex();

    return () => {
      cancelled = true;
    };
  }, [connectionId, connectionsQuery.data, isAuthenticated, queryClient, schemaIndexVersion]);

  const actions: Action[] = useMemo(() => {
    const navActions: Action[] = [
      {
        id: 'nav.connections',
        name: 'Go to Connections',
        section: 'Navigation',
        shortcut: ['g', 'c'],
        keywords: 'connections databases',
        perform: () => go('/dashboard/connections'),
      },
      {
        id: 'nav.analytics',
        name: 'Go to Analytics',
        section: 'Navigation',
        shortcut: ['g', 'a'],
        keywords: 'analytics metrics',
        perform: () => go('/dashboard/analytics'),
      },
      {
        id: 'nav.access',
        name: 'Go to My Access',
        section: 'Navigation',
        shortcut: ['g', 'm'],
        keywords: 'access permissions',
        perform: () => go('/dashboard/access'),
      },
      {
        id: 'nav.profile',
        name: 'Go to Profile',
        section: 'Navigation',
        shortcut: ['g', 'p'],
        keywords: 'profile account',
        perform: () => go('/dashboard/profile'),
      },
    ];

    const authActions: Action[] = isAuthenticated
      ? [
        {
          id: 'auth.logout',
          name: 'Log out',
          section: 'Account',
          keywords: 'logout sign out',
          perform: async () => {
            await logout();
            go('/auth/signin');
          },
        },
      ]
      : [
        {
          id: 'auth.signin',
          name: 'Sign in',
          section: 'Account',
          keywords: 'login sign in',
          perform: () => go('/auth/signin'),
        },
        {
          id: 'auth.signup',
          name: 'Sign up',
          section: 'Account',
          keywords: 'register sign up',
          perform: () => go('/auth/signup'),
        },
      ];

    const tableActions: Action[] = [
      {
        id: 'table.focusFilter',
        name: 'Focus table filter input',
        section: 'Table',
        shortcut: ['f'],
        keywords: 'table filter search focus',
        perform: () => focusFirstVisibleInput('input[data-chatsql-table-filter-value]'),
      },
      {
        id: 'table.clearFilters',
        name: 'Clear table filters',
        section: 'Table',
        keywords: 'table filter clear reset',
        perform: () => clickFirstVisibleButton('button[data-chatsql-clear-filters]'),
      },
    ];

    const connectionActions: Action[] = connectionId
      ? [
        {
          id: 'conn.overview',
          name: 'Connection: Overview',
          section: 'Connection',
          keywords: 'connection overview',
          perform: () => go(`/dashboard/connection/${connectionId}/overview`),
        },
        {
          id: 'conn.sql',
          name: 'Connection: SQL Editor',
          section: 'Connection',
          keywords: 'connection sql editor query',
          perform: () => go(`/dashboard/connection/${connectionId}/sql`),
        },
        {
          id: 'conn.visualizer',
          name: 'Connection: Schema Visualizer',
          section: 'Connection',
          keywords: 'connection schema visualizer erd',
          perform: () => go(`/dashboard/connection/${connectionId}/visualizer`),
        },
      ]
      : [];

    const adminActions: Action[] =
      isAuthenticated && user?.role !== 'viewer'
        ? [
          {
            id: 'nav.users',
            name: 'Go to User Management',
            section: 'Navigation',
            keywords: 'users admin',
            perform: () => go('/dashboard/users'),
          },
        ]
        : [];

    return [
      ...navActions,
      ...adminActions,
      ...connectionActions,
      ...tableActions,
      ...authActions,
    ];
  }, [
    connectionId,
    connectionsQuery.data,
    go,
    isAuthenticated,
    logout,
    queryClient,
    schemaIndexVersion,
    user?.role,
  ]);

  return (
    <KBarProvider actions={actions}>
      <CommandKBarDynamicActions
        connections={(connectionsQuery.data || []) as ConnectionPublic[]}
        currentConnectionId={connectionId}
        schemaIndexVersion={schemaIndexVersion}
        go={go}
        onRequestReindex={() => setSchemaIndexVersion(v => v + 1)}
      />
      {children}
      <CommandKBarUI />
    </KBarProvider>
  );
}
