import { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { Database, Users, Zap, LogOut, User as UserIcon, ChevronUp, CreditCard, Crown } from 'lucide-react';
import { ChatSQLLogo } from '@/components/ChatSQLLogo';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentUserRoleQuery } from '@/hooks/useQueries';
import { UserAvatar } from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { icon: Database, label: 'Connections', href: '/dashboard/connections' },
  { icon: Zap, label: 'Usage & Limits', href: '/dashboard/usage' },
  { icon: Users, label: 'Team Members', href: '/dashboard/users' },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isViewer = user?.role === 'viewer';

  // Fetch viewer role via TanStack Query (only enabled for viewer users)
  const { data: roleData } = useCurrentUserRoleQuery();
  const canViewAnalytics = isViewer ? !!roleData?.permissions?.canViewAnalytics : true;

  const filteredNavItems = isViewer
    ? navItems
      .filter((item) => (item.href === '/dashboard/usage' ? canViewAnalytics : true))
      .map((item) =>
        item.href === '/dashboard/users'
          ? { ...item, label: 'My Access', href: '/dashboard/access' }
          : item
      )
    : navItems;

  // The sidebar is "expanded" visually if it's NOT collapsed OR if it IS collapsed but currently hovered OR if the dropdown is open
  const isExpanded = !isCollapsed || isHovered || isDropdownOpen;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/signin');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div
      className={cn(
        "h-[calc(100vh-3.5rem)] bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/50 flex-col text-white fixed left-0 top-14 z-40 transition-all duration-300 ease-in-out hidden md:flex",
        isExpanded ? "w-72 shadow-2xl shadow-black/50" : "w-20"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Section */}
      <div className={cn("h-20 flex items-center border-b border-white/5 transition-all duration-300", isExpanded ? "px-6" : "px-0 justify-center")}>
        <ChatSQLLogo size="md" glow />
        <div className={cn("ml-3 flex flex-col justify-center transition-all duration-300 overflow-hidden whitespace-nowrap", isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0")}>
          <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            ChatSQL
          </span>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            Workspace
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-hidden flex flex-col overflow-y-auto custom-scrollbar">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                isExpanded ? "px-4 py-3" : "justify-center w-12 h-12 mx-auto p-0",
                isActive
                  ? "bg-indigo-500/10 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)] border border-indigo-500/20"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 hover:shadow-inner"
              )
            }
          >
            <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", ({ isActive }: { isActive: boolean }) => isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-100")} />
            <span className={cn("transition-all duration-300 overflow-hidden whitespace-nowrap", isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>
              {item.label}
            </span>

            {/* Tooltip for collapsed state */}
            {!isExpanded && (
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl font-medium">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}

        <div className="flex-1" />

        {/* Pricing CTA Section - Only visible when expanded */}
        {isExpanded && !isViewer && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">Upgrade Plan</h4>
                <p className="text-[10px] text-slate-400">Unlock full potential</p>
              </div>
            </div>

            <Button
              asChild
              size="sm"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 border-none h-8 text-xs font-semibold relative z-10"
            >
              <Link to="/dashboard/pricing">View Pricing</Link>
            </Button>
          </div>
        )}

        {/* Pricing Icon for collapsed state */}
        {!isExpanded && !isViewer && (
          <div className="flex justify-center mt-2">
            <Link
              to="/dashboard/pricing"
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/10 to-transparent flex items-center justify-center text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
            >
              <CreditCard className="w-5 h-5" />
            </Link>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-800/50 bg-black/20">
        <DropdownMenu onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button className={cn("flex items-center gap-3 rounded-xl bg-slate-800/30 border border-transparent hover:border-slate-700/50 hover:bg-slate-800/50 transition-all cursor-pointer group w-full outline-none", isExpanded ? "p-3" : "p-0 w-12 h-12 justify-center mx-auto")}>
              <UserAvatar user={user} className="w-9 h-9 border-2 border-slate-800" fallbackClassName="bg-slate-700 text-slate-300 text-sm" />
              <div className={cn("flex-1 min-w-0 text-left transition-all duration-300 overflow-hidden", isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>
                <p className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">{user?.username || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || 'user@chatsql.app'}</p>
              </div>
              {isExpanded && <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 bg-[#161b22] border-slate-800 text-white shadow-2xl rounded-xl p-1">
            <div className="px-2 py-1.5 bg-slate-800/50 rounded-lg mb-1 mx-1 mt-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Signed in as</p>
              <p className="text-sm font-medium text-white truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-slate-800 mx-1" />
            <DropdownMenuItem
              className="cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-400 focus:bg-indigo-500/10 focus:text-indigo-400 rounded-lg mx-1 my-0.5 transition-colors"
              onClick={() => navigate('/dashboard/profile')}
            >
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-400 focus:bg-indigo-500/10 focus:text-indigo-400 rounded-lg mx-1 my-0.5 transition-colors"
              onClick={() => navigate('/dashboard/pricing')}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing & Plans</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800 mx-1" />
            <DropdownMenuItem
              className="cursor-pointer hover:bg-red-500/10 text-red-400 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300 rounded-lg mx-1 my-1 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}