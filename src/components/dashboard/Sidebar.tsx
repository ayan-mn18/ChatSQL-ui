import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Database, Settings, BarChart3, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { icon: Database, label: 'Connections', href: '/dashboard/connections' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);

  // The sidebar is "expanded" visually if it's NOT collapsed OR if it IS collapsed but currently hovered
  const isExpanded = !isCollapsed || isHovered;

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
        {navItems.map((item) => (
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
        <div className={cn("flex items-center gap-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group", isExpanded ? "px-4 py-3" : "p-0 w-10 h-10 justify-center mx-auto")}>
          <Avatar className="w-8 h-8 border border-white/10 shrink-0">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>US</AvatarFallback>
          </Avatar>
          <div className={cn("flex-1 min-w-0 transition-all duration-300 overflow-hidden", isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>
            <p className="text-sm font-medium text-white truncate">User Name</p>
            <p className="text-xs text-gray-500 truncate">user@chatsql.app</p>
          </div>
          {isExpanded && <LogOut className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors shrink-0" />}
        </div>
      </div>
    </div>
  );
}