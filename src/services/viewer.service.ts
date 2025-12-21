import { api } from '../lib/api';

// Types for viewer management
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
}

export interface CreateViewerRequest {
  email: string;
  username?: string;
  isTemporary: boolean;
  expiresInHours?: number;
  permissions: ViewerPermission[];
  sendEmail?: boolean;
}

export interface CurrentUserRole {
  role: 'super_admin' | 'viewer';
  isTemporary: boolean;
  expiresAt: string | null;
  mustChangePassword: boolean;
  isViewer: boolean;
  isSuperAdmin: boolean;
  permissions?: {
    connectionCount: number;
    canViewAnalytics: boolean;
    canUseAi: boolean;
  };
}

// Viewer service API calls
export const viewerService = {
  // Get current user's role
  getCurrentUserRole: async (): Promise<CurrentUserRole> => {
    const response = await api.get<{ success: boolean; data: CurrentUserRole }>('/viewers/me/role');
    return response.data.data;
  },

  // Get all viewers (admin only)
  getViewers: async (): Promise<Viewer[]> => {
    const response = await api.get<{ success: boolean; data: Viewer[] }>('/viewers');
    return response.data.data;
  },

  // Get a single viewer
  getViewer: async (id: string): Promise<Viewer> => {
    const response = await api.get<{ success: boolean; data: Viewer }>(`/viewers/${id}`);
    return response.data.data;
  },

  // Create a new viewer
  createViewer: async (data: CreateViewerRequest): Promise<{
    viewer: Viewer;
    credentials: { email: string; tempPassword: string };
  }> => {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: {
        viewer: Viewer;
        credentials: { email: string; tempPassword: string };
      };
    }>('/viewers', data);
    return response.data.data;
  },

  // Revoke viewer access
  revokeViewer: async (id: string): Promise<void> => {
    await api.post(`/viewers/${id}/revoke`);
  },

  // Delete viewer permanently
  deleteViewer: async (id: string): Promise<void> => {
    await api.delete(`/viewers/${id}`);
  },

  // Extend viewer expiry
  extendViewerExpiry: async (id: string, additionalHours: number): Promise<{ newExpiresAt: string }> => {
    const response = await api.post<{
      success: boolean;
      data: { newExpiresAt: string };
    }>(`/viewers/${id}/extend`, { additionalHours });
    return response.data.data;
  },

  // Update viewer permissions
  updateViewerPermissions: async (id: string, permissions: ViewerPermission[]): Promise<void> => {
    await api.put(`/viewers/${id}/permissions`, { permissions });
  },

  // Resend viewer invitation
  resendViewerInvite: async (id: string): Promise<{
    credentials: { email: string; tempPassword: string };
  }> => {
    const response = await api.post<{
      success: boolean;
      data: { credentials: { email: string; tempPassword: string } };
    }>(`/viewers/${id}/resend-invite`);
    return response.data.data;
  },
};
