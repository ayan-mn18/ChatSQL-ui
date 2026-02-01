import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Calendar,
  Clock,
  MoreVertical,
  Shield,
  Edit2,
  Trash2,
  UserX,
  UserCheck,
  Database,
  Table2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Viewer } from '../types';

interface ViewerCardProps {
  viewer: Viewer;
  onEdit: (viewer: Viewer) => void;
  onDelete: (viewer: Viewer) => void;
  onToggleStatus: (viewer: Viewer) => void;
  onManagePermissions: (viewer: Viewer) => void;
}

export function ViewerCard({
  viewer,
  onEdit,
  onDelete,
  onToggleStatus,
  onManagePermissions,
}: ViewerCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const statusConfig = {
    active: {
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      dot: 'bg-emerald-500',
      label: 'Active',
    },
    inactive: {
      color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      dot: 'bg-slate-500',
      label: 'Inactive',
    },
    pending: {
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      dot: 'bg-amber-500',
      label: 'Pending',
    },
  };

  // Get viewer status from either the computed status or the isActive flag
  const viewerStatus = viewer.status || (viewer.mustChangePassword ? 'pending' : (viewer.isActive ? 'active' : 'inactive'));
  const status = statusConfig[viewerStatus as keyof typeof statusConfig] || statusConfig.inactive;

  // Get permission counts - handle different permission structures
  const connectionCount = viewer.permissions?.length
    ? new Set(viewer.permissions.map(p => p.connectionId)).size
    : 0;
  const tableCount = viewer.permissions?.filter(p => p.tableName)?.length || 0;

  // Get viewer name
  const viewerName = viewer.name || viewer.username || viewer.email.split('@')[0];
  const createdDate = viewer.created_at || viewer.createdAt;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-transparent p-5 transition-all duration-300',
        isHovered && 'border-violet-500/30 shadow-lg shadow-violet-500/5'
      )}
    >
      {/* Background Glow Effect */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300',
          isHovered && 'opacity-100'
        )}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25">
                {getInitials(viewerName)}
              </div>
              <div
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#020617]',
                  status.dot
                )}
              />
            </div>

            {/* Name & Email */}
            <div>
              <h3 className="font-semibold text-white">{viewerName}</h3>
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <Mail className="h-3.5 w-3.5" />
                {viewer.email}
              </div>
            </div>
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 border-white/10 bg-[#1a1a24]"
            >
              <DropdownMenuItem
                onClick={() => onManagePermissions(viewer)}
                className="text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <Shield className="mr-2 h-4 w-4" />
                Manage Permissions
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit(viewer)}
                className="text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={() => onToggleStatus(viewer)}
                className="text-slate-300 hover:bg-white/10 hover:text-white"
              >
                {viewer.status === 'active' ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(viewer)}
                className="text-red-400 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Badge */}
        <div className="mt-4">
          <Badge
            variant="outline"
            className={cn('gap-1.5 border px-2.5 py-1', status.color)}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
            {status.label}
          </Badge>
        </div>

        {/* Permissions Summary */}
        <div className="mt-4 flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
                  <Database className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-medium text-white">
                    {connectionCount}
                  </span>
                  <span className="text-xs text-slate-500">connections</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Access to {connectionCount} database connections</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
                  <Table2 className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-white">
                    {tableCount}
                  </span>
                  <span className="text-xs text-slate-500">tables</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Access to {tableCount} specific tables</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Footer - Dates */}
        <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>Added {formatDate(createdDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{viewer.expiresAt ? `Expires ${formatDate(viewer.expiresAt)}` : 'No expiry'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
