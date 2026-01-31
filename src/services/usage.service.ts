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

export interface SubscriptionInfo {
  id: string;
  userId: string;
  planType: string;
  status: string;
  isLifetime: boolean;
  amount: number;
  currency: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  dodoSubscriptionId?: string;
  dodoCustomerId?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  planType: string;
  description?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface ReadOnlyStatus {
  isReadOnly: boolean;
  planType: string;
  tokensUsed: number;
  tokensLimit: number;
  queriesUsed: number;
  queriesLimit: number;
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

  // ============================================
  // PAYMENT METHODS
  // ============================================

  /**
   * Create a checkout session for plan upgrade
   */
  createCheckout: async (planType: 'pro_monthly' | 'pro_yearly' | 'lifetime'): Promise<{
    success: boolean;
    data?: { checkoutUrl: string; sessionId: string };
    message?: string;
  }> => {
    const response = await api.post<any>('/payments/checkout', { planType });
    return response.data;
  },

  /**
   * Get user's current subscription
   */
  getSubscription: async (): Promise<{
    success: boolean;
    data: {
      subscription: SubscriptionInfo | null;
      isReadOnly: boolean;
      planType: string;
      tokensUsed: number;
      tokensLimit: number;
      queriesUsed: number;
      queriesLimit: number;
    };
  }> => {
    const response = await api.get<any>('/payments/subscription');
    return response.data;
  },

  /**
   * Cancel current subscription
   */
  cancelSubscription: async (): Promise<{ success: boolean; message?: string }> => {
    const response = await api.post<any>('/payments/cancel');
    return response.data;
  },

  /**
   * Get payment history
   */
  getPaymentHistory: async (page = 1, pageSize = 20): Promise<{
    success: boolean;
    data: PaymentRecord[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  }> => {
    const response = await api.get<any>(`/payments/history?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  /**
   * Get read-only status
   */
  getReadOnlyStatus: async (): Promise<{ success: boolean; data: ReadOnlyStatus }> => {
    const response = await api.get<any>('/payments/read-only-status');
    return response.data;
  },

  /**
   * Submit contact form
   */
  submitContactForm: async (data: {
    name: string;
    email: string;
    message: string;
    company?: string;
    phone?: string;
    subject?: string;
    requestType?: string;
    planInterest?: string;
  }): Promise<{ success: boolean; message?: string; data?: { id: string } }> => {
    const response = await api.post<any>('/contact', data);
    return response.data;
  },

  /**
   * Submit enterprise inquiry
   */
  submitEnterpriseInquiry: async (data: {
    name: string;
    email: string;
    message: string;
    company?: string;
    phone?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const response = await api.post<any>('/contact/enterprise', data);
    return response.data;
  },
};

export default usageService;
