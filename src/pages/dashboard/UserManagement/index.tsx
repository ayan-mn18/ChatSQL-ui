import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users,
  Activity,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useViewersQuery, useConnectionsQuery } from '@/hooks/useQueries';
import {
  ViewerList,
  CreateViewerWizard,
  EditViewerDialog,
  ManagePermissionsDialog,
  DeleteConfirmDialog,
  ToggleStatusDialog,
} from './components';
import type { Viewer, Connection, PermissionState, CreateViewerData } from './types';

export function UserManagementPage() {
  // TanStack Query for viewers
  const { data: viewersData, isLoading: viewersLoading, refetch: refetchViewers } = useViewersQuery();
  const rawViewers = Array.isArray(viewersData)
    ? viewersData
    : (viewersData as any)?.data || [];
  const viewers: Viewer[] = rawViewers.map((v: any) => ({
    ...v,
    name: v.username || v.email.split('@')[0],
    status: v.mustChangePassword ? 'pending' : (v.isActive ? 'active' : 'inactive'),
    created_at: v.createdAt,
  }));

  // TanStack Query for connections
  const { data: connectionsRaw, isLoading: connectionsLoading } = useConnectionsQuery();

  // Fetch schema details for each connection (complex nested fetch, keep manual for now)
  const [connections, setConnections] = useState<Connection[]>([]);
  const loading = viewersLoading || connectionsLoading;

  // Modal states
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [editingViewer, setEditingViewer] = useState<Viewer | null>(null);
  const [managingPermissionsFor, setManagingPermissionsFor] = useState<Viewer | null>(null);
  const [deletingViewer, setDeletingViewer] = useState<Viewer | null>(null);
  const [togglingStatusFor, setTogglingStatusFor] = useState<Viewer | null>(null);

  // Submission states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch connection details with schemas/tables when connections list changes
  useEffect(() => {
    if (!connectionsRaw?.length) return;
    const fetchConnectionDetails = async () => {
      const connectionsData = connectionsRaw;
      const connectionsWithSchemas = await Promise.all(
        connectionsData.map(async (conn: any) => {
          try {
            const schemaResponse = await api.get(`/connections/${conn.id}/schemas`);
            const schemasData = schemaResponse.data.data || schemaResponse.data.schemas || [];
            const schemasWithTables = await Promise.all(
              schemasData.map(async (schema: any) => {
                try {
                  const tablesResponse = await api.get(
                    `/connections/${conn.id}/schemas/${schema.schema_name}/tables`
                  );
                  const tablesData = tablesResponse.data.data || tablesResponse.data.tables || [];
                  return {
                    name: schema.schema_name,
                    tables: tablesData.map((t: any) => ({
                      name: t.table_name || t.name,
                      columns: t.columns || [],
                    })),
                  };
                } catch {
                  return { name: schema.schema_name, tables: [] };
                }
              })
            );
            return {
              id: conn.id,
              name: conn.name,
              type: conn.type || conn.db_type || 'postgres',
              host: conn.host || '',
              database: conn.database || conn.db_name || '',
              schemas: schemasWithTables,
            };
          } catch {
            return {
              id: conn.id,
              name: conn.name,
              type: conn.type || conn.db_type || 'postgres',
              host: conn.host || '',
              database: conn.database || conn.db_name || '',
              schemas: []
            };
          }
        })
      );
      setConnections(connectionsWithSchemas);
    };
    fetchConnectionDetails();
  }, [connectionsRaw]);

  // Create viewer
  const handleCreateViewer = async (data: CreateViewerData) => {
    setIsCreating(true);
    try {
      // Convert permissions to API format (ViewerPermission[])
      // Build permissions array from connection and table permissions
      const permissions: Array<{
        connectionId: string;
        schemaName: string | null;
        tableName: string | null;
        canSelect: boolean;
        canInsert: boolean;
        canUpdate: boolean;
        canDelete: boolean;
        canUseAi: boolean;
        canViewAnalytics: boolean;
        canExport: boolean;
      }> = [];

      // Process table-level permissions
      Object.entries(data.permissions.tablePermissions)
        .filter(([_, perm]) => perm.read || perm.write)
        .forEach(([key, perm]) => {
          const [connectionId, schemaTable] = key.split(':');
          const [schemaName, tableName] = schemaTable.split('.');
          permissions.push({
            connectionId,
            schemaName,
            tableName,
            canSelect: perm.read,
            canInsert: perm.write,
            canUpdate: perm.write,
            canDelete: perm.write,
            canUseAi: true,
            canViewAnalytics: true,
            canExport: true,
          });
        });

      // For connections with 'full' access but no specific table permissions, add connection-level access
      Object.entries(data.permissions.connectionAccess)
        .filter(([_, access]) => access === 'full')
        .forEach(([connectionId]) => {
          // Check if there are already table-level permissions for this connection
          const hasTablePerms = permissions.some(p => p.connectionId === connectionId);
          if (!hasTablePerms) {
            // Add connection-level access (null schema/table means all)
            permissions.push({
              connectionId,
              schemaName: null,
              tableName: null,
              canSelect: true,
              canInsert: true,
              canUpdate: true,
              canDelete: true,
              canUseAi: true,
              canViewAnalytics: true,
              canExport: true,
            });
          }
        });

      // For 'limited' access connections without table permissions, add read-only access
      Object.entries(data.permissions.connectionAccess)
        .filter(([_, access]) => access === 'limited')
        .forEach(([connectionId]) => {
          const hasTablePerms = permissions.some(p => p.connectionId === connectionId);
          if (!hasTablePerms) {
            permissions.push({
              connectionId,
              schemaName: null,
              tableName: null,
              canSelect: true,
              canInsert: false,
              canUpdate: false,
              canDelete: false,
              canUseAi: true,
              canViewAnalytics: true,
              canExport: true,
            });
          }
        });

      await api.post('/viewers', {
        email: data.email,
        username: data.name,
        isTemporary: false,
        mustChangePassword: true,
        permissions,
        sendEmail: true,
      });

      toast.success(`Viewer ${data.name} created successfully`);
      setShowCreateWizard(false);
      refetchViewers();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to create viewer';

      // Handle specific error cases with user-friendly messages
      if (errorMsg.toLowerCase().includes('already exists')) {
        toast.error('A user with this email already exists. Please use a different email address.', {
          duration: 5000,
        });
      } else if (errorMsg.toLowerCase().includes('permission')) {
        toast.error('You do not have permission to create viewers. Please contact an administrator.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Update viewer details
  const handleUpdateViewer = async (viewerId: string, data: { name: string; email: string }) => {
    setIsUpdating(true);
    try {
      await api.put(`/viewers/${viewerId}`, data);
      toast.success('Viewer updated successfully');
      setEditingViewer(null);
      refetchViewers();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update viewer';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Update viewer permissions
  const handleUpdatePermissions = async (viewerId: string, permissions: PermissionState) => {
    setIsUpdating(true);
    try {
      const connectionPermissions = Object.entries(permissions.connectionAccess)
        .filter(([_, access]) => access !== 'none')
        .map(([connectionId, accessLevel]) => ({
          connection_id: connectionId,
          access_level: accessLevel,
        }));

      const tablePermissions = Object.entries(permissions.tablePermissions)
        .filter(([_, perm]) => perm.read || perm.write)
        .map(([key, perm]) => {
          const [connectionId, schemaTable] = key.split(':');
          const [schemaName, tableName] = schemaTable.split('.');
          return {
            connection_id: connectionId,
            schema_name: schemaName,
            table_name: tableName,
            can_read: perm.read,
            can_write: perm.write,
          };
        });

      await api.put(`/viewers/${viewerId}/permissions`, {
        connections: connectionPermissions,
        tables: tablePermissions,
      });

      toast.success('Permissions updated successfully');
      setManagingPermissionsFor(null);
      refetchViewers();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update permissions';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete viewer
  const handleDeleteViewer = async (viewerId: string) => {
    setIsDeleting(true);
    try {
      await api.delete(`/viewers/${viewerId}`);
      toast.success('Viewer removed successfully');
      setDeletingViewer(null);
      refetchViewers();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to remove viewer';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle viewer status
  const handleToggleStatus = async (viewerId: string, newStatus: 'active' | 'inactive') => {
    setIsUpdating(true);
    try {
      if (newStatus === 'inactive') {
        await api.post(`/viewers/${viewerId}/revoke`);
      } else {
        await api.post(`/viewers/${viewerId}/extend`);
      }
      toast.success(`Viewer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      setTogglingStatusFor(null);
      refetchViewers();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update status';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Stats calculations
  const stats = {
    total: viewers.length,
    active: viewers.filter((v) => v.status === 'active' || (!v.status && v.isActive && !v.mustChangePassword)).length,
    pending: viewers.filter((v) => v.status === 'pending' || (!v.status && v.mustChangePassword)).length,
    recentlyAdded: viewers.filter((v) => {
      const dateStr = v.created_at || v.createdAt;
      if (!dateStr) return false;
      const addedDate = new Date(dateStr);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return addedDate >= weekAgo;
    }).length,
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">User Management</h1>
        <p className="text-slate-400">
          Manage your team members and their database access permissions
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatsCard
          title="Total Viewers"
          value={stats.total}
          icon={Users}
          color="violet"
          description="Team members with access"
        />
        <StatsCard
          title="Active Users"
          value={stats.active}
          icon={Activity}
          color="emerald"
          description="Currently active viewers"
        />
        <StatsCard
          title="Pending Invites"
          value={stats.pending}
          icon={Clock}
          color="amber"
          description="Awaiting acceptance"
        />
        <StatsCard
          title="Added This Week"
          value={stats.recentlyAdded}
          icon={TrendingUp}
          color="cyan"
          description="New team members"
        />
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-transparent p-6"
      >
        <ViewerList
          viewers={viewers}
          loading={loading}
          onCreateViewer={() => setShowCreateWizard(true)}
          onEditViewer={(viewer) => setEditingViewer(viewer)}
          onDeleteViewer={(viewer) => setDeletingViewer(viewer)}
          onToggleStatus={(viewer) => setTogglingStatusFor(viewer)}
          onManagePermissions={(viewer) => setManagingPermissionsFor(viewer)}
        />
      </motion.div>

      {/* Modals */}
      <CreateViewerWizard
        open={showCreateWizard}
        onOpenChange={setShowCreateWizard}
        connections={connections}
        onSubmit={handleCreateViewer}
        isSubmitting={isCreating}
      />

      <EditViewerDialog
        open={!!editingViewer}
        onOpenChange={(open) => !open && setEditingViewer(null)}
        viewer={editingViewer}
        connections={connections}
        onSubmit={handleUpdateViewer}
        isSubmitting={isUpdating}
      />

      <ManagePermissionsDialog
        open={!!managingPermissionsFor}
        onOpenChange={(open) => !open && setManagingPermissionsFor(null)}
        viewer={managingPermissionsFor}
        connections={connections}
        onSubmit={handleUpdatePermissions}
        isSubmitting={isUpdating}
      />

      <DeleteConfirmDialog
        open={!!deletingViewer}
        onOpenChange={(open) => !open && setDeletingViewer(null)}
        viewer={deletingViewer}
        onConfirm={handleDeleteViewer}
        isSubmitting={isDeleting}
      />

      <ToggleStatusDialog
        open={!!togglingStatusFor}
        onOpenChange={(open) => !open && setTogglingStatusFor(null)}
        viewer={togglingStatusFor}
        onConfirm={handleToggleStatus}
        isSubmitting={isUpdating}
      />
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'violet' | 'emerald' | 'amber' | 'cyan';
  description: string;
}

function StatsCard({ title, value, icon: Icon, color, description }: StatsCardProps) {
  const colorConfig = {
    violet: {
      bg: 'bg-violet-500/10',
      icon: 'text-violet-400',
      gradient: 'from-violet-500 to-transparent',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      icon: 'text-emerald-400',
      gradient: 'from-emerald-500 to-transparent',
    },
    amber: {
      bg: 'bg-amber-500/10',
      icon: 'text-amber-400',
      gradient: 'from-amber-500 to-transparent',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      icon: 'text-cyan-400',
      gradient: 'from-cyan-500 to-transparent',
    },
  };

  const config = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-800 backdrop-blur-sm overflow-hidden relative group rounded-xl"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-gradient-to-br ${config.gradient}`} />
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${config.bg}`}>
            <Icon className={`w-6 h-6 ${config.icon}`} />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">{description}</p>
      </div>
    </motion.div>
  );
}

export default UserManagementPage;
