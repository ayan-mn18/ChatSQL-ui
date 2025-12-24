import { api } from '../lib/api';

// ============================================
// TYPES
// ============================================

export interface PlanInfo {
  type: string;
  displayName: string;
  billingCycleStart: string;
  billingCycleEnd: string;
  daysRemaining: number;
}

export interface TokenUsage {
  limit: number;
  used: number;
  remaining: number;
  usagePercent: number;
  isUnlimited: boolean;
}

export interface QueryUsage {
  limit: number;
  used: number;
  remaining: number;
  usagePercent: number;
  isUnlimited: boolean;
  stats: {
    total_queries: number;
    ai_queries: number;
    manual_queries: number;
    successful_queries: number;
    failed_queries: number;
    avg_execution_time: number;
  };
}

export interface ConnectionUsage {
  limit: number;
  used: number;
  usagePercent: number;
  isUnlimited: boolean;
}

export interface TokenBreakdown {
  operation_type: string;
  total_tokens: number;
  operation_count: number;
}

export interface DailyUsage {
  date: string;
  tokens?: number;
  operations?: number;
  count?: number;
  ai_count?: number;
}

export interface RecentOperation {
  id: string;
  operation_type: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  prompt_preview: string;
  execution_time_ms: number;
  created_at: string;
}

export interface UsageDashboardData {
  plan: PlanInfo;
  tokens: TokenUsage;
  queries: QueryUsage;
  connections: ConnectionUsage;
  tokenBreakdown: TokenBreakdown[];
  dailyTokenUsage: DailyUsage[];
  dailyQueries: DailyUsage[];
  recentOperations: RecentOperation[];
}

export interface PlanConfiguration {
  plan_type: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  ai_tokens_limit: number;
  queries_limit: number;
  connections_limit: number;
  storage_limit_mb: number;
  features: string[];
}

export interface TokenHistoryItem {
  id: string;
  operation_type: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  prompt_preview: string;
  response_preview: string;
  execution_time_ms: number;
  created_at: string;
  connection_name: string;
}

// ============================================
// USAGE SERVICE
// ============================================

export const usageService = {
  /**
   * Get user's complete usage dashboard data
   * Including plan info, token usage, query stats, connections
   */
  getDashboard: async (): Promise<{ success: boolean; data: UsageDashboardData }> => {
    const response = await api.get<{ success: boolean; data: UsageDashboardData }>('/usage/dashboard');
    return response.data;
  },

  /**
   * Get all available subscription plans
   */
  getAvailablePlans: async (): Promise<{ success: boolean; data: PlanConfiguration[] }> => {
    const response = await api.get<{ success: boolean; data: PlanConfiguration[] }>('/usage/plans');
    return response.data;
  },

  /**
   * Get token usage history with pagination
   */
  getTokenHistory: async (page = 1, pageSize = 50): Promise<{
    success: boolean;
    data: TokenHistoryItem[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  }> => {
    const response = await api.get<any>(`/usage/tokens?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },
};

export default usageService;
