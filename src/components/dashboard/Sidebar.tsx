import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Database, Users, BarChart3, LogOut, User as UserIcon, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
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
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Users, label: 'User Management', href: '/dashboard/users' },
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

  const filteredNavItems = isViewer
    ? navItems.map((item) =>
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
        "h-screen bg-[#1B2431] border-r border-white/5 flex-col text-white fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out hidden md:flex",
        isExpanded ? "w-64 shadow-2xl shadow-black/50" : "w-20"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={cn("h-16 flex items-center border-b border-white/5 transition-all duration-300", isExpanded ? "px-6" : "px-0 justify-center")}>
        <div className="w-8 h-8 bg-[#3b82f6] rounded-lg flex items-center justify-center shrink-0">
          <div className="w-4 h-4 bg-white rounded-sm" />
        </div>
        <span className={cn("text-lg font-bold tracking-tight ml-3 transition-all duration-300 overflow-hidden whitespace-nowrap", isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0")}>
          ChatSQL
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-hidden flex flex-col">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isExpanded ? "px-4 py-3" : "justify-center w-12 h-12 mx-auto p-0",
                isActive
                  ? "bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className={cn("transition-all duration-300 overflow-hidden whitespace-nowrap", isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>
              {item.label}
            </span>

            {/* Tooltip for collapsed state */}
            {!isExpanded && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-[#1e293b] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-50 shadow-xl">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5 overflow-hidden">
        <DropdownMenu onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button className={cn("flex items-center gap-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group w-full outline-none", isExpanded ? "px-4 py-3" : "p-0 w-10 h-10 justify-center mx-auto")}>
              <Avatar className="w-8 h-8 border border-white/10 shrink-0">
                <AvatarImage src={user?.profile_url || "https://github.com/shadcn.png"} />
                <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase() || 'US'}</AvatarFallback>
              </Avatar>
              <div className={cn("flex-1 min-w-0 text-left transition-all duration-300 overflow-hidden", isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>
                <p className="text-sm font-medium text-white truncate">{user?.username || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || 'user@chatsql.app'}</p>
              </div>
              {isExpanded && <ChevronUp className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors shrink-0" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#1B2431] border-gray-800 text-white">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem
              className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white"
              onClick={() => navigate('/dashboard/profile')}
            >
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-red-400 hover:text-red-400 focus:text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}