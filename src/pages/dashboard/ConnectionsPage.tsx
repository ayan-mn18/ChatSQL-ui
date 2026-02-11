import { useState, useCallback } from 'react';
import { AddConnectionDialog } from '@/components/dashboard/AddConnectionDialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Database, Trash2, ArrowRight, Server, Pencil, Sparkles, Zap, Shield, Cable, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useConnectionsQuery, useDeleteConnectionMutation, useSyncSchemaMutation } from '@/hooks/useQueries';
import { ConnectionPublic } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { ViewerExpiryBanner } from '@/components/dashboard/ViewerExpiryBanner';

export default function ConnectionsPage() {
  const navigate = useNavigate();
  const { data: connections = [], isLoading, error, refetch } = useConnectionsQuery();
  const deleteConnectionMutation = useDeleteConnectionMutation();
  const syncSchemaMutation = useSyncSchemaMutation();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<ConnectionPublic | null>(null);

  // Handle sync schema
  const handleSyncSchema = async (id: string, name: string) => {
    syncSchemaMutation.mutate(id, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(`Schema sync started for "${name}"`);
        }
      },
      onError: (err: any) => {
        console.error('Failed to sync schema:', err);
        toast.error(err.response?.data?.error || `Failed to sync schema for "${name}"`);
      },
    });
  };

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      toast.success('Connections refreshed');
    } catch (err) {
      toast.error('Failed to refresh connections');
    }
  }, [refetch]);

  // Handle delete confirmation
  const handleDeleteClick = (connection: ConnectionPublic) => {
    setConnectionToDelete(connection);
    setDeleteDialogOpen(true);
  };

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!connectionToDelete) return;

    deleteConnectionMutation.mutate(connectionToDelete.id, {
      onSuccess: () => {
        toast.success(`Connection "${connectionToDelete.name}" deleted`);
        setDeleteDialogOpen(false);
        setConnectionToDelete(null);
      },
      onError: (err: any) => {
        toast.error(err.message || 'Failed to delete connection');
      },
    });
  };

  const isDeleting = deleteConnectionMutation.isPending;
  const syncingId = syncSchemaMutation.isPending ? (syncSchemaMutation.variables as string) : null;

  // Format last tested time
  const formatLastTested = (dateStr: string | null) => {
    if (!dateStr) return 'Never tested';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-8">
      <ViewerExpiryBanner />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Connections</h1>
          <p className="text-gray-400">Manage your database connections.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-gray-700 hover:bg-gray-800"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <AddConnectionDialog onConnectionAdded={handleRefresh} />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-500/20 bg-red-500/10">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{(error as any)?.message || 'Failed to load connections'}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && connections.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-[#273142] border-none shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <Skeleton className="w-10 h-10 rounded-lg bg-white/5" />
                  <div className="flex gap-1 -mr-2 -mt-2">
                    <Skeleton className="w-8 h-8 rounded-md bg-white/5" />
                    <Skeleton className="w-8 h-8 rounded-md bg-white/5" />
                  </div>
                </div>
                <Skeleton className="h-6 w-32 mt-4 bg-white/5" />
                <Skeleton className="h-4 w-48 mt-2 bg-white/5" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16 bg-white/5" />
                  <Skeleton className="h-5 w-24 rounded-full bg-white/5" />
                </div>
                <Skeleton className="h-3 w-32 mt-3 bg-white/5" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full rounded-md bg-white/5" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && connections.length === 0 && !error && (
        <Card className="border-none rounded-xl bg-gradient-to-br from-[#273142] to-[#1e2736] shadow-2xl overflow-hidden">
          <div className="relative">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
              {/* Floating icons */}
              <Database className="absolute top-8 right-12 w-6 h-6 text-blue-500/20 animate-pulse" />
              <Server className="absolute top-24 right-32 w-5 h-5 text-purple-500/20 animate-pulse delay-300" />
              <Cable className="absolute bottom-16 left-12 w-5 h-5 text-green-500/20 animate-pulse delay-500" />
            </div>

            <CardContent className="flex flex-col items-center justify-center py-20 relative z-10">
              {/* Main icon with ring animation */}
              <div className="relative mb-8">
                <div className="absolute inset-0 w-24 h-24 bg-blue-500/20 rounded-full animate-ping opacity-20" />
                <div className="absolute inset-2 w-20 h-20 bg-blue-500/10 rounded-full animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-blue-500/20">
                  <Database className="w-10 h-10 text-blue-400" />
                </div>
              </div>

              {/* Title and description */}
              <Badge variant="secondary" className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Get Started
              </Badge>

              <h3 className="text-2xl font-bold text-white mb-3">
                No connections yet
              </h3>

              <p className="text-gray-400 mb-8 max-w-md text-center leading-relaxed">
                Connect your PostgreSQL database to unlock powerful AI-driven SQL generation,
                schema visualization, and query insights.
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">AI-Powered</p>
                    <p className="text-xs text-gray-500">Natural language to SQL</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Database className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Schema Sync</p>
                    <p className="text-xs text-gray-500">Auto-detect tables</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Secure</p>
                    <p className="text-xs text-gray-500">Encrypted credentials</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <AddConnectionDialog onConnectionAdded={handleRefresh} />

              <p className="mt-4 text-xs text-gray-500">
                Currently supports PostgreSQL • More databases coming soon
              </p>
            </CardContent>
          </div>
        </Card>
      )}

      {/* Connections Grid */}
      {connections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((conn) => (
            <Card key={conn.id} className="bg-[#273142] border-none shadow-lg hover:shadow-xl transition-all group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6]">
                    <Server className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1 -mr-2 -mt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 ${syncingId === conn.id ? 'animate-pulse' : ''}`}
                      onClick={() => handleSyncSchema(conn.id, conn.name)}
                      disabled={syncingId === conn.id}
                      title="Sync Schema"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncingId === conn.id ? 'animate-spin' : ''}`} />
                    </Button>
                    <AddConnectionDialog
                      onConnectionAdded={handleRefresh}
                      connectionToEdit={conn}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-500 hover:text-blue-400 hover:bg-blue-400/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => handleDeleteClick(conn)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-white mt-4">{conn.name}</CardTitle>
                <CardDescription className="text-gray-500 font-mono text-xs">
                  {conn.username}@{conn.host}:{conn.port}/{conn.db_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className={`w-2 h-2 rounded-full ${conn.is_valid ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    {conn.type.toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2">
                    {conn.schema_synced ? (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-400 text-[10px]">
                        Schema Synced
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 text-[10px]">
                        Pending Sync
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-gray-500">
                  Last tested: {formatLastTested(conn.last_tested_at)}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 text-[#3b82f6] border-none transition-all"
                  onClick={() => navigate(`/dashboard/connection/${conn.id}/overview`)}
                >
                  Open Dashboard
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#273142] border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Connection</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{connectionToDelete?.name}"?
              This will also delete all synced schemas, tables, and query history associated with this connection.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
