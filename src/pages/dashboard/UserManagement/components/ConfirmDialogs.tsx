import {
  AlertTriangle,
  Trash2,
  UserX,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Viewer } from '../types';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewer: Viewer | null;
  onConfirm: (viewerId: string) => void;
  isSubmitting?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  viewer,
  onConfirm,
  isSubmitting = false,
}: DeleteConfirmDialogProps) {
  if (!viewer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden border-white/10 bg-[#0f0f17] p-0">
        {/* Header */}
        <DialogHeader className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogTitle className="mt-4 text-xl font-semibold text-white">
            Remove Viewer
          </DialogTitle>
          <DialogDescription className="mt-2 text-slate-400">
            Are you sure you want to remove <span className="font-medium text-white">{viewer.name}</span> from your team? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {/* Viewer Info */}
        <div className="mx-6 mb-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-semibold text-white">
              {viewer.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <p className="font-medium text-white">{viewer.name}</p>
              <p className="text-sm text-slate-400">{viewer.email}</p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mx-6 mb-6 flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
          <UserX className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-300">
              This will immediately revoke all their access to your databases and connections. They will no longer be able to view or query any data.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] p-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-slate-300 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(viewer.id)}
            disabled={isSubmitting}
            className="gap-2 bg-red-600 text-white hover:bg-red-500"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Remove Viewer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ToggleStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewer: Viewer | null;
  onConfirm: (viewerId: string, newStatus: 'active' | 'inactive') => void;
  isSubmitting?: boolean;
}

export function ToggleStatusDialog({
  open,
  onOpenChange,
  viewer,
  onConfirm,
  isSubmitting = false,
}: ToggleStatusDialogProps) {
  if (!viewer) return null;

  const isActivating = viewer.status !== 'active';
  const newStatus = isActivating ? 'active' : 'inactive';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden border-white/10 bg-[#0f0f17] p-0">
        {/* Header */}
        <DialogHeader className="p-6">
          <div className="flex items-center justify-between">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${isActivating ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                }`}
            >
              <UserX
                className={`h-6 w-6 ${isActivating ? 'text-emerald-500' : 'text-amber-500'
                  }`}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogTitle className="mt-4 text-xl font-semibold text-white">
            {isActivating ? 'Activate' : 'Deactivate'} Viewer
          </DialogTitle>
          <DialogDescription className="mt-2 text-slate-400">
            {isActivating
              ? `Reactivate ${viewer.name}'s access to your databases?`
              : `Temporarily suspend ${viewer.name}'s access? They can be reactivated later.`}
          </DialogDescription>
        </DialogHeader>

        {/* Viewer Info */}
        <div className="mx-6 mb-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-semibold text-white">
              {viewer.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <p className="font-medium text-white">{viewer.name}</p>
              <p className="text-sm text-slate-400">{viewer.email}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] p-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-slate-300 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(viewer.id, newStatus)}
            disabled={isSubmitting}
            className={`gap-2 ${isActivating
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-amber-600 text-white hover:bg-amber-500'
              }`}
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {isActivating ? 'Activating...' : 'Deactivating...'}
              </>
            ) : (
              <>
                {isActivating ? 'Activate' : 'Deactivate'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
