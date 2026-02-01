// Types for User Management
// API response types matching the backend
export interface ViewerPermission {
  connectionId: string;
  connectionName?: string;
  schemaName: string | null;
  tableName: string | null;
  canSelect: boolean;
  canInsert: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canUseAi: boolean;
  canViewAnalytics: boolean;
  canExport: boolean;
}

export interface Viewer {
  id: string;
  email: string;
  username: string | null;
  isTemporary: boolean;
  expiresAt: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  permissions: ViewerPermission[];
  // Computed fields for UI
  name?: string;
  status?: 'active' | 'inactive' | 'pending';
  created_at?: string;
  last_active?: string;
}

export interface ViewerPermissions {
  connections: ConnectionPermission[];
  tables: TablePermission[];
}

export interface ConnectionPermission {
  connection_id: string;
  connection_name: string;
  access_level: 'full' | 'limited' | 'none';
}

export interface TablePermission {
  connection_id: string;
  connection_name: string;
  schema_name: string;
  table_name: string;
  can_read: boolean;
  can_write: boolean;
}

export interface Connection {
  id: string;
  name: string;
  type: string;
  host: string;
  database: string;
  schemas?: Schema[];
}

export interface Schema {
  name: string;
  tables: Table[];
}

export interface Table {
  name: string;
  columns?: Column[];
}

export interface Column {
  name: string;
  type: string;
}

export interface PermissionState {
  connectionAccess: Record<string, 'full' | 'limited' | 'none'>;
  tablePermissions: Record<string, { read: boolean; write: boolean }>;
}

export interface CreateViewerData {
  email: string;
  name: string;
  permissions: PermissionState;
}

export type WizardStep = 'details' | 'connections' | 'tables' | 'review';
