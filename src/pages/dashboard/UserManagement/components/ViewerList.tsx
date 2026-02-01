import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Users,
  UserPlus,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ViewerCard } from './ViewerCard';
import { ViewerTableRow } from './ViewerTableRow';
import type { Viewer } from '../types';

interface ViewerListProps {
  viewers: Viewer[];
  loading: boolean;
  onCreateViewer: () => void;
  onEditViewer: (viewer: Viewer) => void;
  onDeleteViewer: (viewer: Viewer) => void;
  onToggleStatus: (viewer: Viewer) => void;
  onManagePermissions: (viewer: Viewer) => void;
}

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'email' | 'created_at' | 'status';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'inactive' | 'pending';

export function ViewerList({
  viewers,
  loading,
  onCreateViewer,
  onEditViewer,
  onDeleteViewer,
  onToggleStatus,
  onManagePermissions,
}: ViewerListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Filter and sort viewers
  const filteredViewers = viewers
    .filter((viewer) => {
      // Search filter
      const viewerName = viewer.name || viewer.username || viewer.email.split('@')[0];
      const matchesSearch =
        viewerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        viewer.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const viewerStatus = viewer.status || (viewer.isActive ? 'active' : 'inactive');
      const matchesStatus =
        statusFilter === 'all' || viewerStatus === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      const nameA = a.name || a.username || a.email.split('@')[0];
      const nameB = b.name || b.username || b.email.split('@')[0];
      const statusA = a.status || (a.isActive ? 'active' : 'inactive');
      const statusB = b.status || (b.isActive ? 'active' : 'inactive');
      const createdAtA = a.created_at || a.createdAt;
      const createdAtB = b.created_at || b.createdAt;

      switch (sortField) {
        case 'name':
          comparison = nameA.localeCompare(nameB);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'created_at':
          comparison =
            new Date(createdAtA).getTime() -
            new Date(createdAtB).getTime();
          break;
        case 'status':
          comparison = statusA.localeCompare(statusB);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const statusCounts = {
    all: viewers.length,
    active: viewers.filter((v) => v.status === 'active' || v.isActive).length,
    inactive: viewers.filter((v) => v.status === 'inactive' || (!v.isActive && !v.mustChangePassword)).length,
    pending: viewers.filter((v) => v.status === 'pending' || v.mustChangePassword).length,
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  if (loading) {
    return <ViewerListSkeleton viewMode={viewMode} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 shadow-lg shadow-violet-500/10">
            <Users className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Team Members</h2>
            <p className="text-sm text-slate-400">
              Manage your viewers and their access permissions
            </p>
          </div>
        </div>

        <Button
          onClick={onCreateViewer}
          className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-purple-500"
        >
          <UserPlus className="h-4 w-4" />
          Add Viewer
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-white/[0.03] p-1">
          {(['all', 'active', 'inactive', 'pending'] as StatusFilter[]).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                  statusFilter === status
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <span className="capitalize">{status}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'h-5 min-w-[20px] justify-center rounded-full px-1.5 text-xs',
                    statusFilter === status
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'bg-white/10 text-slate-400'
                  )}
                >
                  {statusCounts[status]}
                </Badge>
              </button>
            )
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <Select
            value={sortField}
            onValueChange={(value) => setSortField(value as SortField)}
          >
            <SelectTrigger className="w-[140px] border-white/10 bg-white/[0.03] text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#1a1a24]">
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="created_at">Date Added</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortOrder}
            className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10"
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-white/[0.03] p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={cn(
              'h-8 w-8',
              viewMode === 'grid'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('list')}
            className={cn(
              'h-8 w-8',
              viewMode === 'list'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-slate-400">
        Showing {filteredViewers.length} of {viewers.length} viewers
      </div>

      {/* Viewer List/Grid */}
      {filteredViewers.length === 0 ? (
        <EmptyState
          hasFilters={searchQuery !== '' || statusFilter !== 'all'}
          onClearFilters={() => {
            setSearchQuery('');
            setStatusFilter('all');
          }}
          onCreateViewer={onCreateViewer}
        />
      ) : viewMode === 'grid' ? (
        <motion.div
          layout
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredViewers.map((viewer) => (
              <ViewerCard
                key={viewer.id}
                viewer={viewer}
                onEdit={onEditViewer}
                onDelete={onDeleteViewer}
                onToggleStatus={onToggleStatus}
                onManagePermissions={onManagePermissions}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Permissions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Added
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Last Active
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              <AnimatePresence mode="popLayout">
                {filteredViewers.map((viewer) => (
                  <ViewerTableRow
                    key={viewer.id}
                    viewer={viewer}
                    onEdit={onEditViewer}
                    onDelete={onDeleteViewer}
                    onToggleStatus={onToggleStatus}
                    onManagePermissions={onManagePermissions}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Empty State Component
function EmptyState({
  hasFilters,
  onClearFilters,
  onCreateViewer,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreateViewer: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] py-16"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
        <Users className="h-8 w-8 text-violet-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">
        {hasFilters ? 'No viewers found' : 'No viewers yet'}
      </h3>
      <p className="mt-2 max-w-sm text-center text-sm text-slate-400">
        {hasFilters
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Get started by adding your first viewer to give them access to your databases.'}
      </p>
      <div className="mt-6">
        {hasFilters ? (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="border-white/10 text-white hover:bg-white/10"
          >
            Clear Filters
          </Button>
        ) : (
          <Button
            onClick={onCreateViewer}
            className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white"
          >
            <UserPlus className="h-4 w-4" />
            Add Your First Viewer
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Skeleton Loader
function ViewerListSkeleton({ viewMode }: { viewMode: ViewMode }) {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-xl bg-white/[0.05]" />
          <div className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded bg-white/[0.05]" />
            <div className="h-4 w-48 animate-pulse rounded bg-white/[0.05]" />
          </div>
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-white/[0.05]" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-10 flex-1 animate-pulse rounded-lg bg-white/[0.05]" />
        <div className="h-10 w-64 animate-pulse rounded-lg bg-white/[0.05]" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-white/[0.05]" />
      </div>

      {/* Cards/List Skeleton */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl bg-white/[0.05]"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-white/[0.05]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
