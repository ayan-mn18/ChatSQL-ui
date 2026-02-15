import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import { useSyncSchemaMutation } from '@/hooks/useQueries';
import toast from 'react-hot-toast';
import { ChatSQLLogo } from '@/components/ChatSQLLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Command,
  LogOut,
  User as UserIcon,
  CreditCard,
  Database,
  Zap,
  LayoutDashboard,
  Shield,
  HelpCircle,
  Plus,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useKBar } from 'kbar';
import { cn } from '@/lib/utils';

interface AppNavbarProps {
  /** Transparent bg for landing pages (blurs on scroll) */
  variant?: 'default' | 'transparent' | 'minimal';
  /** Hide the navbar entirely */
  hidden?: boolean;
}

export function AppNavbar({ variant = 'default', hidden = false }: AppNavbarProps) {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { query: kbar } = useKBar();
  const params = useParams<{ connectionId?: string }>();

  const isConnection = location.pathname.includes('/connection/');
  const connectionId = isConnection ? params.connectionId : undefined;
  const syncSchemaMutation = useSyncSchemaMutation();

  if (hidden) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/signin');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const openCommandBar = () => {
    kbar.toggle();
  };

  const handleSchemaSync = () => {
    if (!connectionId || syncSchemaMutation.isPending) return;
    syncSchemaMutation.mutate(connectionId, {
      onSuccess: () => {
        toast.success('Schema sync started successfully');
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || 'Schema sync failed');
      },
    });
  };

  const isViewer = user?.role === 'viewer';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        variant === 'transparent'
          ? 'bg-transparent'
          : variant === 'minimal'
            ? 'bg-[#020617]/95 backdrop-blur-md border-b border-slate-800/50'
            : 'bg-[#020617]/95 backdrop-blur-xl border-b border-slate-800/60'
      )}
    >
      <div className="w-full px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">

          {/* Left: Logo + Nav Links */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group shrink-0">
              <ChatSQLLogo size="sm" glow />
              <span className="text-[15px] font-bold text-white tracking-tight hidden sm:block">
                ChatSQL
              </span>
            </Link>

            {/* Navigation Links - when authenticated */}
            {isAuthenticated && !isLoading && (
              <nav className="hidden md:flex items-center gap-1">
                <NavItem
                  href="/dashboard/connections"
                  icon={Database}
                  label="Connections"
                  active={location.pathname.includes('/connections') || isConnection}
                />
                <NavItem
                  href="/dashboard/usage"
                  icon={Zap}
                  label="Usage"
                  active={location.pathname.includes('/usage')}
                />
                {!isViewer && (
                  <NavItem
                    href="/dashboard/pricing"
                    icon={CreditCard}
                    label="Pricing"
                    active={location.pathname.includes('/pricing')}
                  />
                )}
              </nav>
            )}

            {/* Navigation Links - when NOT authenticated */}
            {!isAuthenticated && !isLoading && variant !== 'minimal' && (
              <nav className="hidden md:flex items-center gap-1">
                <a href="#features" className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors rounded-md hover:bg-white/5">
                  Features
                </a>
                <a href="#pricing" className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors rounded-md hover:bg-white/5">
                  Pricing
                </a>
                <Link to="/contact" className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors rounded-md hover:bg-white/5">
                  Contact
                </Link>
              </nav>
            )}
          </div>

          {/* Center: Search / Command Bar Trigger */}
          <div className="flex-1 max-w-md mx-auto hidden sm:block">
            <button
              onClick={openCommandBar}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-600/50 text-sm text-slate-400 transition-all duration-200 group"
            >
              <Search className="w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
              <span className="flex-1 text-left truncate">Search connections, tables, commands...</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-700/50 border border-slate-600/30 text-[11px] font-medium text-slate-400 shrink-0">
                <Command className="w-3 h-3" />K
              </kbd>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile search icon */}
            <Button
              variant="ghost"
              size="sm"
              onClick={openCommandBar}
              className="sm:hidden h-9 w-9 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Search className="w-4 h-4" />
            </Button>

            {isAuthenticated && !isLoading ? (
              <>
                {/* Schema Sync — only on connection pages */}
                {isConnection && connectionId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSchemaSync}
                    disabled={syncSchemaMutation.isPending}
                    className="h-9 gap-2 px-3 text-slate-400 hover:text-white hover:bg-slate-800 hidden md:flex items-center"
                  >
                    <RefreshCw className={cn('w-4 h-4', syncSchemaMutation.isPending && 'animate-spin')} />
                    <span className="text-sm font-medium hidden lg:inline">Sync Schema</span>
                  </Button>
                )}

                {/* Quick Add */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-slate-400 hover:text-white hover:bg-slate-800 hidden md:flex"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-slate-900/95 backdrop-blur-xl border-slate-700 shadow-xl">
                    <DropdownMenuLabel className="text-xs font-medium text-slate-500 uppercase tracking-wider">Create New</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => navigate('/dashboard/connections')}
                      className="text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 cursor-pointer"
                    >
                      <Database className="mr-2 h-4 w-4 text-indigo-400" />
                      New Connection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Help/Docs */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-slate-400 hover:text-white hover:bg-slate-800 hidden md:flex"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-slate-900/95 backdrop-blur-xl border-slate-700 shadow-xl">
                    <DropdownMenuItem
                      onClick={openCommandBar}
                      className="text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 cursor-pointer"
                    >
                      <Command className="mr-2 h-4 w-4 text-slate-400" />
                      <span>Command Palette</span>
                      <kbd className="ml-auto text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">⌘K</kbd>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 cursor-pointer"
                      onClick={() => navigate('/contact')}
                    >
                      <HelpCircle className="mr-2 h-4 w-4 text-slate-400" />
                      Contact Support
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full p-1 pr-1 hover:bg-slate-800/60 transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]">
                      <UserAvatar
                        user={user}
                        className="w-8 h-8 border-2 border-slate-700"
                        fallbackClassName="bg-slate-700 text-slate-300 text-sm"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 bg-slate-900/95 backdrop-blur-xl border-slate-700 shadow-2xl rounded-xl p-1">
                    {/* User Info */}
                    <div className="px-3 py-2.5 mb-1">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          user={user}
                          className="w-10 h-10 border-2 border-slate-700"
                          fallbackClassName="bg-slate-700 text-slate-200 text-base"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{user?.username || 'User'}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    <DropdownMenuSeparator className="bg-slate-800 mx-1" />

                    <DropdownMenuItem
                      onClick={() => navigate('/dashboard')}
                      className="cursor-pointer text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg mx-1 my-0.5"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate('/dashboard/connections')}
                      className="cursor-pointer text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg mx-1 my-0.5"
                    >
                      <Database className="mr-2 h-4 w-4" />
                      Connections
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate('/dashboard/profile')}
                      className="cursor-pointer text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg mx-1 my-0.5"
                    >
                      <UserIcon className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate('/dashboard/usage')}
                      className="cursor-pointer text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg mx-1 my-0.5"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Usage & Billing
                    </DropdownMenuItem>

                    {!isViewer && (
                      <DropdownMenuItem
                        onClick={() => navigate('/dashboard/pricing')}
                        className="cursor-pointer text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg mx-1 my-0.5"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Plans & Pricing
                      </DropdownMenuItem>
                    )}

                    {user?.role === 'super_admin' && (
                      <>
                        <DropdownMenuSeparator className="bg-slate-800 mx-1" />
                        <DropdownMenuItem
                          onClick={() => navigate('/dashboard/users')}
                          className="cursor-pointer text-slate-300 focus:bg-indigo-500/10 focus:text-indigo-300 rounded-lg mx-1 my-0.5"
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          User Management
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator className="bg-slate-800 mx-1" />

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-400 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300 rounded-lg mx-1 my-1"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : !isLoading ? (
              /* Not Authenticated */
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/auth/signin')}
                  className="text-slate-300 hover:text-white hover:bg-slate-800 h-9 text-sm font-medium"
                >
                  Log in
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/auth/signup')}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 h-9 text-sm font-medium transition-all"
                >
                  Get Started
                  <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ——— Small sub-components ——— */

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
  return (
    <Link
      to={href}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
        active
          ? 'text-white bg-slate-800/70'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  );
}

export default AppNavbar;
