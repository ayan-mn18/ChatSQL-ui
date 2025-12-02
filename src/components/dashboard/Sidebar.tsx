import { NavLink } from 'react-router-dom';
import { Database, Settings, BarChart3, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { icon: Database, label: 'Connections', href: '/dashboard/connections' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export function Sidebar() {
  return (
    <div className="h-screen w-64 bg-[#1B2431] border-r border-white/5 flex flex-col text-white fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <div className="w-8 h-8 bg-[#3b82f6] rounded-lg flex items-center justify-center mr-3">
          <div className="w-4 h-4 bg-white rounded-sm" />
        </div>
        <span className="text-lg font-bold tracking-tight">DashStack</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
          <Avatar className="w-8 h-8 border border-white/10">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>US</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">User Name</p>
            <p className="text-xs text-gray-500 truncate">user@chatsql.app</p>
          </div>
          <LogOut className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
        </div>
      </div>
    </div>
  );
}
