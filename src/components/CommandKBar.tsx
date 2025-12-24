import { type ReactNode, useEffect, useMemo, useCallback } from 'react';
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  KBarResults,
  useMatches,
  useKBar,
  type ActionImpl,
  type Action,
} from 'kbar';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

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

function CommandKBarShortcutHandler() {
  const { query } = useKBar();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isK = event.key.toLowerCase() === 'k';
      const isMod = event.metaKey || event.ctrlKey;
      if (!isK || !isMod) return;

      event.preventDefault();
      query.toggle();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [query]);

  return null;
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

  const connectionId = useMemo(() => extractConnectionId(location.pathname), [location.pathname]);

  const go = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

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

    return [...navActions, ...adminActions, ...connectionActions, ...tableActions, ...authActions];
  }, [connectionId, go, isAuthenticated, logout, user?.role]);

  return (
    <KBarProvider actions={actions}>
      <CommandKBarShortcutHandler />
      {children}
      <CommandKBarUI />
    </KBarProvider>
  );
}
