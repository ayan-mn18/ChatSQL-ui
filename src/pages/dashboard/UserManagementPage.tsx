import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  UserPlus,
  Mail,
  Clock,
  Shield,
  MoreVertical,
  Trash2,
  Key,
  Copy,
  Check,
  AlertCircle,
  X,
  Database,
  Eye,
  Ban
} from 'lucide-react';
import { viewerService, Viewer, ViewerPermission, CreateViewerRequest } from '@/services/viewer.service';
import { connectionService } from '@/services/connection.service';
import { ConnectionPublic, DatabaseSchemaPublic, TableSchema } from '@/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

export default function UserManagementPage() {
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';

  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [connections, setConnections] = useState<ConnectionPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedViewer, setSelectedViewer] = useState<Viewer | null>(null);
  const [isViewPermissionsOpen, setIsViewPermissionsOpen] = useState(false);

  // Granular permission state
  const [availableSchemas, setAvailableSchemas] = useState<DatabaseSchemaPublic[]>([]);
  const [availableTables, setAvailableTables] = useState<TableSchema[]>([]);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<{
    connectionId: string;
    connectionName: string;
    selectedSchemas: string[];
    selectedTables: string[];
    canSelect: boolean;
    canInsert: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canUseAi: boolean;
    canViewAnalytics: boolean;
    canExport: boolean;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    isTemporary: false,
    expiresInHours: 24,
    sendEmail: true,
    mustChangePassword: true,
  });
  const [selectedPermissions, setSelectedPermissions] = useState<ViewerPermission[]>([]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    console.log('Loading data for UserManagementPage...');

    // Load connections first (always needed)
    try {
      const connectionsResponse = await connectionService.getAllConnections();
      console.log('Connections response:', connectionsResponse);
      if (connectionsResponse.success && Array.isArray(connectionsResponse.data)) {
        setConnections(connectionsResponse.data);
      } else {
        console.warn('Connections response data is not an array:', connectionsResponse);
        setConnections([]);
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
      toast.error('Failed to load connections');
    }

    // Load viewers (may fail if schema not applied)
    try {
      const viewersData = await viewerService.getViewers();
      setViewers(viewersData);
    } catch (error) {
      console.error('Failed to load viewers:', error);
      // Don't show error - viewers API may not be available yet
    }

    setLoading(false);
  };

  // Handle connection selection for permission
  const handleConnectionSelect = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    setCurrentPermission({
      connectionId,
      connectionName: connection.name,
      selectedSchemas: [],
      selectedTables: [],
      canSelect: true,
      canInsert: false,
      canUpdate: false,
      canDelete: false,
      canUseAi: true,
      canViewAnalytics: true,
      canExport: true,
    });

    setLoadingSchemas(true);
    try {
      const response = await connectionService.getSchemas(connectionId);
      if (response.success && response.data) {
        setAvailableSchemas(response.data);
      }
    } catch (error) {
      console.error('Failed to load schemas:', error);
      toast.error('Failed to load schemas');
    } finally {
      setLoadingSchemas(false);
    }
  };

  // Handle schema selection
  const handleSchemaToggle = async (schemaName: string) => {
    if (!currentPermission) return;

    const isSelected = currentPermission.selectedSchemas.includes(schemaName);
    const newSchemas = isSelected
      ? currentPermission.selectedSchemas.filter(s => s !== schemaName)
      : [...currentPermission.selectedSchemas, schemaName];

    setCurrentPermission({
      ...currentPermission,
      selectedSchemas: newSchemas,
      selectedTables: [], // Reset tables when schemas change
    });

    if (newSchemas.length > 0) {
      setLoadingTables(true);
      try {
        // Fetch tables for all selected schemas
        const allTables: TableSchema[] = [];
        for (const schema of newSchemas) {
          const response = await connectionService.getTablesBySchema(currentPermission.connectionId, schema);
          if (response.success && response.data) {
            allTables.push(...response.data);
          }
        }
        setAvailableTables(allTables);
      } catch (error) {
        console.error('Failed to load tables:', error);
      } finally {
        setLoadingTables(false);
      }
    } else {
      setAvailableTables([]);
    }
  };

  // Handle table selection
  const handleTableToggle = (tableName: string) => {
    if (!currentPermission) return;

    const isSelected = currentPermission.selectedTables.includes(tableName);
    const newTables = isSelected
      ? currentPermission.selectedTables.filter(t => t !== tableName)
      : [...currentPermission.selectedTables, tableName];

    setCurrentPermission({
      ...currentPermission,
      selectedTables: newTables,
    });
  };

  // Add the configured permission
  const handleAddConfiguredPermission = () => {
    if (!currentPermission) return;

    const newPermissions: ViewerPermission[] = [];

    // If no schemas selected, add for all schemas
    if (currentPermission.selectedSchemas.length === 0) {
      newPermissions.push({
        connectionId: currentPermission.connectionId,
        connectionName: currentPermission.connectionName,
        schemaName: null,
        tableName: null,
        canSelect: currentPermission.canSelect,
        canInsert: currentPermission.canInsert,
        canUpdate: currentPermission.canUpdate,
        canDelete: currentPermission.canDelete,
        canUseAi: currentPermission.canUseAi,
        canViewAnalytics: currentPermission.canViewAnalytics,
        canExport: currentPermission.canExport,
      });
    } else {
      // For each selected schema
      for (const schema of currentPermission.selectedSchemas) {
        // Filter tables for this schema
        const schemaTables = currentPermission.selectedTables.filter(t => {
          const tableInfo = availableTables.find(at => at.table_name === t && at.schema_name === schema);
          return !!tableInfo;
        });

        if (schemaTables.length === 0) {
          // Add for all tables in this schema
          newPermissions.push({
            connectionId: currentPermission.connectionId,
            connectionName: currentPermission.connectionName,
            schemaName: schema,
            tableName: null,
            canSelect: currentPermission.canSelect,
            canInsert: currentPermission.canInsert,
            canUpdate: currentPermission.canUpdate,
            canDelete: currentPermission.canDelete,
            canUseAi: currentPermission.canUseAi,
            canViewAnalytics: currentPermission.canViewAnalytics,
            canExport: currentPermission.canExport,
          });
        } else {
          // Add for each selected table in this schema
          for (const table of schemaTables) {
            newPermissions.push({
              connectionId: currentPermission.connectionId,
              connectionName: currentPermission.connectionName,
              schemaName: schema,
              tableName: table,
              canSelect: currentPermission.canSelect,
              canInsert: currentPermission.canInsert,
              canUpdate: currentPermission.canUpdate,
              canDelete: currentPermission.canDelete,
              canUseAi: currentPermission.canUseAi,
              canViewAnalytics: currentPermission.canViewAnalytics,
              canExport: currentPermission.canExport,
            });
          }
        }
      }
    }

    setSelectedPermissions([...selectedPermissions, ...newPermissions]);
    setCurrentPermission(null);
    setAvailableSchemas([]);
    setAvailableTables([]);
  };

  // Create viewer
  const handleCreateViewer = async () => {
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }
    if (selectedPermissions.length === 0) {
      toast.error('Please add at least one connection permission');
      return;
    }

    try {
      const request: CreateViewerRequest = {
        email: formData.email,
        username: formData.username || undefined,
        isTemporary: formData.isTemporary,
        expiresInHours: formData.isTemporary ? formData.expiresInHours : undefined,
        mustChangePassword: formData.mustChangePassword,
        permissions: selectedPermissions,
        sendEmail: formData.sendEmail,
      };

      const result = await viewerService.createViewer(request);

      // Show credentials dialog
      setCredentials(result.credentials);
      setIsCredentialsDialogOpen(true);
      setIsCreateDialogOpen(false);

      // Reset form
      setFormData({
        email: '',
        username: '',
        isTemporary: false,
        expiresInHours: 24,
        sendEmail: true,
        mustChangePassword: true,
      });
      setSelectedPermissions([]);

      // Reload viewers
      loadData();
      toast.success('Viewer created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create viewer');
    }
  };

  // Remove permission
  const handleRemovePermission = (index: number) => {
    setSelectedPermissions(selectedPermissions.filter((_, i) => i !== index));
  };

  // Update permission
  const handleUpdatePermission = (index: number, field: keyof ViewerPermission, value: boolean) => {
    const updated = [...selectedPermissions];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedPermissions(updated);
  };

  // Revoke viewer
  const handleRevokeViewer = async (viewer: Viewer) => {
    if (!confirm(`Are you sure you want to revoke access for ${viewer.email}?`)) return;

    try {
      await viewerService.revokeViewer(viewer.id);
      loadData();
      toast.success('Viewer access revoked');
    } catch (error) {
      toast.error('Failed to revoke viewer');
    }
  };

  // Delete viewer
  const handleDeleteViewer = async (viewer: Viewer) => {
    if (!confirm(`Are you sure you want to permanently delete ${viewer.email}? This cannot be undone.`)) return;

    try {
      await viewerService.deleteViewer(viewer.id);
      loadData();
      toast.success('Viewer deleted');
    } catch (error) {
      toast.error('Failed to delete viewer');
    }
  };

  // Resend invite
  const handleResendInvite = async (viewer: Viewer) => {
    try {
      const result = await viewerService.resendViewerInvite(viewer.id);
      setCredentials(result.credentials);
      setIsCredentialsDialogOpen(true);
      toast.success('Invitation resent with new password');
    } catch (error) {
      toast.error('Failed to resend invitation');
    }
  };

  // Extend expiry
  const handleExtendExpiry = async (viewer: Viewer, hours: number) => {
    try {
      await viewerService.extendViewerExpiry(viewer.id, hours);
      loadData();
      toast.success(`Expiry extended by ${hours} hours`);
    } catch (error) {
      toast.error('Failed to extend expiry');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  // Get status badge
  const getStatusBadge = (viewer: Viewer) => {
    if (!viewer.isActive) {
      return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Revoked</Badge>;
    }
    if (viewer.isTemporary && viewer.expiresAt) {
      const expiresAt = new Date(viewer.expiresAt);
      if (expiresAt < new Date()) {
        return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Expired</Badge>;
      }
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Temporary</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-400" />
            User Management
          </h1>
          <p className="text-sm md:text-base text-gray-400">
            {isViewer
              ? "View your access permissions and account status."
              : "Manage viewer access and permissions for your database connections."}
          </p>
        </div>
        {!isViewer && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Viewer
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1B2431] border-[#273142] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Viewer</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Create a viewer account with restricted access to selected database connections.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-gray-300">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="viewer@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-[#273142] border-[#3A4553] text-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="username" className="text-gray-300">Username (optional)</Label>
                    <Input
                      id="username"
                      placeholder="john_doe"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="bg-[#273142] border-[#3A4553] text-white"
                    />
                  </div>
                </div>

                {/* Connection Permissions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300 font-medium">Connection Permissions *</Label>
                    {!currentPermission && (
                      <Select onValueChange={handleConnectionSelect}>
                        <SelectTrigger className="w-[200px] bg-[#273142] border-[#3A4553] text-white">
                          <SelectValue placeholder="Add connection" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#273142] border-[#3A4553]">
                          {connections.length === 0 ? (
                            <div className="px-2 py-4 text-sm text-gray-400 text-center">
                              No connections available
                            </div>
                          ) : (
                            connections.map((conn) => (
                              <SelectItem key={conn.id} value={conn.id}>
                                <span className="flex items-center gap-2">
                                  <Database className="h-4 w-4" />
                                  {conn.name}
                                </span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Granular Permission Configuration */}
                  {currentPermission && (
                    <Card className="bg-[#1B2431] border-blue-500/50 border-2">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-bold text-blue-400 flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Configuring: {currentPermission.connectionName}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentPermission(null)}
                            className="h-8 w-8 p-0 text-gray-400"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Schema Selection */}
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-400 uppercase tracking-wider">Select Schemas (Optional - defaults to all)</Label>
                          {loadingSchemas ? (
                            <div className="flex flex-wrap gap-2">
                              {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-6 w-20 bg-slate-700 rounded-full" />
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {availableSchemas.map(schema => (
                                <Badge
                                  key={schema.schema_name}
                                  variant={currentPermission.selectedSchemas.includes(schema.schema_name) ? "default" : "outline"}
                                  className={`cursor-pointer ${currentPermission.selectedSchemas.includes(schema.schema_name)
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "border-[#3A4553] text-gray-400 hover:bg-[#273142]"
                                    }`}
                                  onClick={() => handleSchemaToggle(schema.schema_name)}
                                >
                                  {schema.schema_name}
                                </Badge>
                              ))}
                              {availableSchemas.length === 0 && <p className="text-sm text-gray-500 italic">No schemas found</p>}
                            </div>
                          )}
                        </div>

                        {/* Table Selection */}
                        {currentPermission.selectedSchemas.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs text-gray-400 uppercase tracking-wider">Select Tables (Optional - defaults to all in schema)</Label>
                            {loadingTables ? (
                              <div className="flex flex-wrap gap-2 p-1">
                                {[...Array(5)].map((_, i) => (
                                  <Skeleton key={i} className="h-6 w-32 bg-slate-700 rounded-full" />
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                                {availableTables.map(table => (
                                  <Badge
                                    key={`${table.schema_name}.${table.table_name}`}
                                    variant={currentPermission.selectedTables.includes(table.table_name) ? "default" : "outline"}
                                    className={`cursor-pointer ${currentPermission.selectedTables.includes(table.table_name)
                                      ? "bg-green-600 hover:bg-green-700"
                                      : "border-[#3A4553] text-gray-400 hover:bg-[#273142]"
                                      }`}
                                    onClick={() => handleTableToggle(table.table_name)}
                                  >
                                    {table.schema_name}.{table.table_name}
                                  </Badge>
                                ))}
                                {availableTables.length === 0 && <p className="text-sm text-gray-500 italic">No tables found for selected schemas</p>}
                              </div>
                            )}
                          </div>
                        )}

                        {/* CRUD Permissions */}
                        <div className="space-y-3 pt-2 border-t border-[#3A4553]">
                          <Label className="text-xs text-gray-400 uppercase tracking-wider">Permissions for selection</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                              <Checkbox
                                checked={currentPermission.canSelect}
                                onCheckedChange={(c) => setCurrentPermission({ ...currentPermission, canSelect: !!c })}
                              />
                              Read
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                              <Checkbox
                                checked={currentPermission.canInsert}
                                onCheckedChange={(c) => setCurrentPermission({ ...currentPermission, canInsert: !!c })}
                              />
                              Insert
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                              <Checkbox
                                checked={currentPermission.canUpdate}
                                onCheckedChange={(c) => setCurrentPermission({ ...currentPermission, canUpdate: !!c })}
                              />
                              Update
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                              <Checkbox
                                checked={currentPermission.canDelete}
                                onCheckedChange={(c) => setCurrentPermission({ ...currentPermission, canDelete: !!c })}
                              />
                              Delete
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                              <Checkbox
                                checked={currentPermission.canUseAi}
                                onCheckedChange={(c) => setCurrentPermission({ ...currentPermission, canUseAi: !!c })}
                              />
                              AI Chat
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                              <Checkbox
                                checked={currentPermission.canViewAnalytics}
                                onCheckedChange={(c) => setCurrentPermission({ ...currentPermission, canViewAnalytics: !!c })}
                              />
                              Analytics
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                              <Checkbox
                                checked={currentPermission.canExport}
                                onCheckedChange={(c) => setCurrentPermission({ ...currentPermission, canExport: !!c })}
                              />
                              Export
                            </label>
                          </div>
                        </div>

                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                          onClick={handleAddConfiguredPermission}
                        >
                          Add Permission Entry
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {selectedPermissions.length === 0 && !currentPermission ? (
                    <div className="border border-dashed border-[#3A4553] rounded-lg p-8 text-center">
                      <Database className="h-12 w-12 mx-auto text-gray-500 mb-3" />
                      <p className="text-gray-400">No connections added yet</p>
                      <p className="text-sm text-gray-500">Select a connection above to add permissions</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedPermissions.map((perm, index) => (
                        <Card key={index} className="bg-[#273142] border-[#3A4553]">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Database className="h-4 w-4 text-blue-400" />
                                  <span className="text-white font-medium">{perm.connectionName}</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-[10px] py-0">
                                    {perm.schemaName || 'All schemas'}
                                  </Badge>
                                  {perm.tableName && (
                                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-[10px] py-0">
                                      {perm.tableName}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePermission(index)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-gray-500 uppercase">Read</span>
                                <Checkbox checked={perm.canSelect} onCheckedChange={(c) => handleUpdatePermission(index, 'canSelect', !!c)} />
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-gray-500 uppercase">Insert</span>
                                <Checkbox checked={perm.canInsert} onCheckedChange={(c) => handleUpdatePermission(index, 'canInsert', !!c)} />
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-gray-500 uppercase">Update</span>
                                <Checkbox checked={perm.canUpdate} onCheckedChange={(c) => handleUpdatePermission(index, 'canUpdate', !!c)} />
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-gray-500 uppercase">Delete</span>
                                <Checkbox checked={perm.canDelete} onCheckedChange={(c) => handleUpdatePermission(index, 'canDelete', !!c)} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Temporary Access */}
                <div className="space-y-4 p-4 bg-[#273142]/50 rounded-lg border border-[#3A4553]">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300 font-medium">Temporary Access</Label>
                      <p className="text-sm text-gray-500">Set an expiration time for this viewer</p>
                    </div>
                    <Switch
                      checked={formData.isTemporary}
                      onCheckedChange={(checked) => {
                        console.log('isTemporary changed:', checked);
                        setFormData({ ...formData, isTemporary: checked });
                      }}
                    />
                  </div>
                  {formData.isTemporary && (
                    <div className="grid gap-2 pt-2">
                      <Label className="text-gray-300">Expires In</Label>
                      <Select
                        value={formData.expiresInHours.toString()}
                        onValueChange={(v) => {
                          console.log('expiresInHours changed:', v);
                          setFormData({ ...formData, expiresInHours: parseInt(v) });
                        }}
                      >
                        <SelectTrigger className="bg-[#273142] border-[#3A4553] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#273142] border-[#3A4553]">
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="6">6 hours</SelectItem>
                          <SelectItem value="12">12 hours</SelectItem>
                          <SelectItem value="24">24 hours</SelectItem>
                          <SelectItem value="48">48 hours</SelectItem>
                          <SelectItem value="72">72 hours (3 days)</SelectItem>
                          <SelectItem value="168">168 hours (1 week)</SelectItem>
                          <SelectItem value="720">720 hours (30 days)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Email Option */}
                <div className="flex items-center justify-between p-4 bg-[#273142]/50 rounded-lg border border-[#3A4553]">
                  <div>
                    <Label className="text-gray-300 font-medium">Send Invitation Email</Label>
                    <p className="text-sm text-gray-500">Email credentials to the viewer</p>
                  </div>
                  <Switch
                    checked={formData.sendEmail}
                    onCheckedChange={(checked) => {
                      console.log('sendEmail changed:', checked);
                      setFormData({ ...formData, sendEmail: checked });
                    }}
                  />
                </div>

                {/* Force Password Change */}
                <div className="flex items-center justify-between p-4 bg-[#273142]/50 rounded-lg border border-[#3A4553]">
                  <div>
                    <Label className="text-gray-300 font-medium">Force Password Change</Label>
                    <p className="text-sm text-gray-500">User must change password on first login</p>
                  </div>
                  <Switch
                    checked={formData.mustChangePassword}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, mustChangePassword: checked });
                    }}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-[#3A4553] text-gray-300">
                  Cancel
                </Button>
                <Button onClick={handleCreateViewer} className="bg-blue-600 hover:bg-blue-700">
                  Create Viewer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#273142] border-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Viewers</p>
              {loading ? (
                <Skeleton className="h-8 w-16 bg-slate-700 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-white">{viewers.length}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#273142] border-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active</p>
              {loading ? (
                <Skeleton className="h-8 w-16 bg-slate-700 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-white">{viewers.filter(v => v.isActive).length}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#273142] border-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Temporary</p>
              {loading ? (
                <Skeleton className="h-8 w-16 bg-slate-700 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-white">{viewers.filter(v => v.isTemporary).length}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Viewers Table */}
      <Card className="bg-[#273142] border-none">
        <CardHeader>
          <CardTitle className="text-white">Viewers</CardTitle>
          <CardDescription className="text-gray-400">
            Manage viewer accounts and their access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#3A4553]">
                    <TableHead className="text-gray-400">User</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Connections</TableHead>
                    <TableHead className="text-gray-400">Expires</TableHead>
                    <TableHead className="text-gray-400">Created</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-[#3A4553]">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full bg-slate-700" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32 bg-slate-700" />
                            <Skeleton className="h-3 w-20 bg-slate-700" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-16 bg-slate-700" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 bg-slate-700" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 bg-slate-700" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 bg-slate-700" /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Skeleton className="h-8 w-8 bg-slate-700" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : viewers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No viewers yet</h3>
              <p className="text-gray-400 mb-6">Create your first viewer to grant restricted access to your databases.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Viewer
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#3A4553]">
                    <TableHead className="text-gray-400">User</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Connections</TableHead>
                    <TableHead className="text-gray-400">Expires</TableHead>
                    <TableHead className="text-gray-400">Created</TableHead>
                    {!isViewer && <TableHead className="text-gray-400 text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewers.map((viewer) => (
                    <TableRow key={viewer.id} className="border-[#3A4553]">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#1B2431] rounded-full">
                            <Users className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{viewer.email}</p>
                            {viewer.username && (
                              <p className="text-sm text-gray-500">@{viewer.username}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(viewer)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedViewer(viewer);
                            setIsViewPermissionsOpen(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                        >
                          {viewer.permissions.length} connection{viewer.permissions.length !== 1 ? 's' : ''}
                          <Eye className="h-3 w-3 ml-1" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {viewer.isTemporary ? formatDate(viewer.expiresAt) : 'Never'}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {formatDate(viewer.createdAt)}
                      </TableCell>
                      {!isViewer && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#273142] border-[#3A4553]">
                              <DropdownMenuItem
                                onClick={() => handleResendInvite(viewer)}
                                className="text-gray-300 hover:text-white hover:bg-[#3A4553] cursor-pointer"
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Resend Invite
                              </DropdownMenuItem>
                              {viewer.isTemporary && viewer.isActive && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleExtendExpiry(viewer, 24)}
                                    className="text-gray-300 hover:text-white hover:bg-[#3A4553] cursor-pointer"
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Extend 24 hours
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleExtendExpiry(viewer, 168)}
                                    className="text-gray-300 hover:text-white hover:bg-[#3A4553] cursor-pointer"
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Extend 1 week
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator className="bg-[#3A4553]" />
                              {viewer.isActive && (
                                <DropdownMenuItem
                                  onClick={() => handleRevokeViewer(viewer)}
                                  className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 cursor-pointer"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Revoke Access
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDeleteViewer(viewer)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credentials Dialog */}
      <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
        <DialogContent className="bg-[#1B2431] border-[#273142] text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-yellow-400" />
              Viewer Credentials
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Save these credentials. The password will not be shown again.
            </DialogDescription>
          </DialogHeader>

          {credentials && (
            <div className="space-y-4 py-4">
              <div className="bg-[#273142] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-400 text-xs">Email</Label>
                    <p className="text-white font-mono">{credentials.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.email, 'email')}
                    className="text-gray-400 hover:text-white"
                  >
                    {copiedField === 'email' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-400 text-xs">Temporary Password</Label>
                    <p className="text-white font-mono">{credentials.tempPassword}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.tempPassword, 'password')}
                    className="text-gray-400 hover:text-white"
                  >
                    {copiedField === 'password' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm text-yellow-400 bg-yellow-500/10 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>The user will be required to change this password on first login.</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsCredentialsDialogOpen(false)} className="bg-blue-600 hover:bg-blue-700">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Permissions Dialog */}
      <Dialog open={isViewPermissionsOpen} onOpenChange={setIsViewPermissionsOpen}>
        <DialogContent className="bg-[#1B2431] border-[#273142] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              Permissions for {selectedViewer?.email}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              View and manage this viewer's access permissions
            </DialogDescription>
          </DialogHeader>

          {selectedViewer && (
            <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
              {selectedViewer.permissions.map((perm, index) => (
                <Card key={index} className="bg-[#273142] border-[#3A4553]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="h-4 w-4 text-blue-400" />
                      <span className="text-white font-medium">{perm.connectionName || perm.connectionId}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className={`flex items-center gap-2 ${perm.canSelect ? 'text-green-400' : 'text-gray-500'}`}>
                        {perm.canSelect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Read
                      </div>
                      <div className={`flex items-center gap-2 ${perm.canInsert ? 'text-green-400' : 'text-gray-500'}`}>
                        {perm.canInsert ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Insert
                      </div>
                      <div className={`flex items-center gap-2 ${perm.canUpdate ? 'text-green-400' : 'text-gray-500'}`}>
                        {perm.canUpdate ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Update
                      </div>
                      <div className={`flex items-center gap-2 ${perm.canDelete ? 'text-green-400' : 'text-gray-500'}`}>
                        {perm.canDelete ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Delete
                      </div>
                      <div className={`flex items-center gap-2 ${perm.canUseAi ? 'text-green-400' : 'text-gray-500'}`}>
                        {perm.canUseAi ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} AI Chat
                      </div>
                      <div className={`flex items-center gap-2 ${perm.canViewAnalytics ? 'text-green-400' : 'text-gray-500'}`}>
                        {perm.canViewAnalytics ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Analytics
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsViewPermissionsOpen(false)} className="bg-blue-600 hover:bg-blue-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
