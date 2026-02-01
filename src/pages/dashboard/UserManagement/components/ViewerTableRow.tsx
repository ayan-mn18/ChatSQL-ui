import { motion } from 'framer-motion';
import {
  Mail,
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
import { cn } from '@/lib/utils';
import type { Viewer } from '../types';

interface ViewerTableRowProps {
  viewer: Viewer;
  onEdit: (viewer: Viewer) => void;
  onDelete: (viewer: Viewer) => void;
  onToggleStatus: (viewer: Viewer) => void;
  onManagePermissions: (viewer: Viewer) => void;
}

export function ViewerTableRow({
  viewer,
  onEdit,
  onDelete,
  onToggleStatus,
  onManagePermissions,
}: ViewerTableRowProps) {
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

  // Get permission counts
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
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="group transition-colors hover:bg-white/[0.02]"
    >
      {/* User Info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-semibold text-white">
            {getInitials(viewerName)}
          </div>
          <div>
            <div className="font-medium text-white">{viewerName}</div>
            <div className="flex items-center gap-1 text-sm text-slate-400">
              <Mail className="h-3 w-3" />
              {viewer.email}
            </div>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <Badge
          variant="outline"
          className={cn('gap-1.5 border px-2 py-0.5', status.color)}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
          {status.label}
        </Badge>
      </td>

      {/* Permissions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Database className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-white">{connectionCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Table2 className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-white">{tableCount}</span>
          </div>
        </div>
      </td>

      {/* Added Date */}
      <td className="px-4 py-3 text-sm text-slate-400">
        {formatDate(createdDate)}
      </td>

      {/* Last Active */}
      <td className="px-4 py-3 text-sm text-slate-400">
        {formatDate(viewer.last_active)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10 hover:text-white"
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
              {viewerStatus === 'active' ? (
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
      </td>
    </motion.tr>
  );
}
