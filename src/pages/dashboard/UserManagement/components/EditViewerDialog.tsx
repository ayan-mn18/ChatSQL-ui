import { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Shield,
  Save,
  Database,
  Table2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { PermissionSelector } from './PermissionSelector';
import type { Connection, PermissionState, Viewer } from '../types';

interface EditViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewer: Viewer | null;
  connections?: Connection[];
  onSubmit: (viewerId: string, data: { name: string; email: string }) => void;
  isSubmitting?: boolean;
}

export function EditViewerDialog({
  open,
  onOpenChange,
  viewer,
  onSubmit,
  isSubmitting = false,
}: EditViewerDialogProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (viewer) {
      setFormData({
        email: viewer.email,
        name: viewer.name,
      });
    }
  }, [viewer]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !viewer) return;
    onSubmit(viewer.id, formData);
  };

  const handleClose = () => {
    setFormData({ email: '', name: '' });
    setErrors({});
    onOpenChange(false);
  };

  if (!viewer) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md gap-0 overflow-hidden border-white/10 bg-[#0f0f17] p-0">
        {/* Header */}
        <DialogHeader className="border-b border-white/[0.06] p-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white">
              Edit Viewer
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xl font-semibold text-white shadow-lg shadow-violet-500/25">
              {formData.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || 'NA'}
            </div>
            <div>
              <p className="text-lg font-medium text-white">
                {formData.name || 'Viewer Name'}
              </p>
              <p className="text-sm text-slate-400">
                {formData.email || 'email@example.com'}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-slate-300">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="edit-name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={cn(
                    'pl-10 border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500',
                    errors.name && 'border-red-500/50'
                  )}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-slate-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={cn(
                    'pl-10 border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500',
                    errors.email && 'border-red-500/50'
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] p-6">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-white/10 text-slate-300 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-purple-500"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Separate dialog for managing permissions
interface ManagePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewer: Viewer | null;
  connections: Connection[];
  onSubmit: (viewerId: string, permissions: PermissionState) => void;
  isSubmitting?: boolean;
}

export function ManagePermissionsDialog({
  open,
  onOpenChange,
  viewer,
  connections,
  onSubmit,
  isSubmitting = false,
}: ManagePermissionsDialogProps) {
  const [permissions, setPermissions] = useState<PermissionState>({
    connectionAccess: {},
    tablePermissions: {},
  });

  useEffect(() => {
    if (viewer?.permissions) {
      // Convert existing permissions to our format
      const connectionAccess: Record<string, 'full' | 'limited' | 'none'> = {};
      const tablePermissions: Record<string, { read: boolean; write: boolean }> = {};

      viewer.permissions.connections?.forEach((conn) => {
        connectionAccess[conn.connection_id] = conn.access_level;
      });

      viewer.permissions.tables?.forEach((table) => {
        const key = `${table.connection_id}:${table.schema_name}.${table.table_name}`;
        tablePermissions[key] = {
          read: table.can_read,
          write: table.can_write,
        };
      });

      setPermissions({ connectionAccess, tablePermissions });
    }
  }, [viewer]);

  const handleSubmit = () => {
    if (!viewer) return;
    onSubmit(viewer.id, permissions);
  };

  const handleClose = () => {
    setPermissions({ connectionAccess: {}, tablePermissions: {} });
    onOpenChange(false);
  };

  const getStats = () => {
    const connectionCount = Object.values(permissions.connectionAccess).filter(
      (access) => access !== 'none'
    ).length;

    const tableCount = Object.values(permissions.tablePermissions).filter(
      (perm) => perm.read || perm.write
    ).length;

    const writeCount = Object.values(permissions.tablePermissions).filter(
      (perm) => perm.write
    ).length;

    return { connectionCount, tableCount, writeCount };
  };

  if (!viewer) return null;

  const stats = getStats();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden border-white/10 bg-[#0f0f17] p-0 max-h-[85vh]">
        {/* Header */}
        <DialogHeader className="border-b border-white/[0.06] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-semibold text-white">
                {viewer.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-white">
                  Manage Permissions
                </DialogTitle>
                <p className="text-sm text-slate-400">{viewer.name} • {viewer.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 px-3 py-1.5">
              <Database className="h-4 w-4 text-violet-400" />
              <span className="text-sm font-medium text-violet-300">
                {stats.connectionCount} Connections
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-cyan-500/10 px-3 py-1.5">
              <Table2 className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-300">
                {stats.tableCount} Tables (R)
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-1.5">
              <Shield className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">
                {stats.writeCount} Tables (W)
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <PermissionSelector
            connections={connections}
            permissions={permissions}
            onChange={setPermissions}
            mode="both"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] p-6">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-white/10 text-slate-300 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-purple-500"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Permissions
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
