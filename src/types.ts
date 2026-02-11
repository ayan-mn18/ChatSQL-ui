export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  result?: QueryResult;
}

export interface QueryResult {
  data: any[];
  info: QueryDesc
}

export interface QueryDesc {
  columns: string[];
  error?: string;
  query?: string;
  desc?: string;
  reasoning?: {
    steps: string[];
    optimization_notes: string[];
  };
  tables_used?: string[];
  columns_used?: string[];
}

export interface QueryRequest {
  query: string;
  uri: string;
}

export interface Settings {
  dbName: string;
  dbUri: string;
  aiModel: 'openai' | 'claude';
}

// ============================================
// AUTH TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  username: string | null;
  profile_url: string | null;
  role: 'super_admin' | 'viewer';
  is_verified: boolean;
  is_temporary: boolean;
  expires_at: string | null;
  must_change_password: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  username?: string;
  profile_url?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: User;
    accessToken?: string;
    expiresIn?: number;
    email?: string;
  };
  error?: string;
  code?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

// ============================================
// CONNECTION TYPES
// ============================================
export interface Connection {
  id: string;
  user_id: string;
  name: string;
  host: string;
  port: number;
  type: 'postgres';
  db_name: string;
  username: string;
  password_enc: string; // Encrypted, never returned to client
  ssl: boolean;
  extra_options?: Record<string, unknown>;
  is_valid: boolean;
  schema_synced: boolean;
  schema_synced_at: string | null;
  last_tested_at: string | null;
  created_at: string;
  updated_at: string;
}

// Connection without sensitive data (for API responses)
export interface ConnectionPublic {
  id: string;
  user_id: string;
  name: string;
  host: string;
  port: number;
  type: 'postgres';
  db_name: string;
  username: string;
  ssl: boolean;
  is_valid: boolean;
  schema_synced: boolean;
  schema_synced_at: string | null;
  last_tested_at: string | null;
  created_at: string;
  updated_at: string;
}

// Request types for connection APIs
export interface TestConnectionRequest {
  host: string;
  port: number;
  db_name: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface CreateConnectionRequest {
  name: string;
  host: string;
  port: number;
  db_name: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface UpdateConnectionRequest {
  name?: string;
  host?: string;
  port?: number;
  db_name?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  latency_ms?: number;
  schemas?: string[]; // Available PostgreSQL schemas found during test
  error?: string;
  code?: string;
}

// ============================================
// DATABASE SCHEMA TYPES (PostgreSQL schemas like public, analytics, etc.)
// ============================================
export interface DatabaseSchema {
  id: string;
  connection_id: string;
  schema_name: string;
  is_selected: boolean;
  table_count: number;
  description?: string;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSchemaPublic {
  id: string;
  schema_name: string;
  is_selected: boolean;
  table_count: number;
  description?: string;
  last_synced_at: string | null;
}

// ============================================
// TABLE SCHEMA TYPES (Cached table metadata)
// ============================================
export interface TableSchema {
  id: string;
  connection_id: string;
  database_schema_id?: string;
  schema_name: string;
  table_name: string;
  table_type: 'BASE TABLE' | 'VIEW' | 'MATERIALIZED VIEW';
  columns: TableColumnDef[];
  primary_key_columns?: string[];
  indexes?: IndexDef[];
  row_count?: number;
  table_size_bytes?: number;
  description?: string;
  last_fetched_at: string;
  created_at: string;
  updated_at: string;
}

export interface TableColumnDef {
  name: string;
  data_type: string;
  udt_name: string;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  foreign_key_ref?: {
    table: string;
    column: string;
    schema: string;
  };
  default_value?: string;
  max_length?: number;
  numeric_precision?: number;
  column_comment?: string;
  enum_values?: string[];
}

export interface IndexDef {
  name: string;
  columns: string[];
  is_unique: boolean;
  is_primary: boolean;
}

// ============================================
// ERD RELATION TYPES (Foreign Key Relationships)
// ============================================
export interface ERDRelation {
  id: string;
  connection_id: string;
  source_schema: string;
  source_table: string;
  source_column: string;
  target_schema: string;
  target_table: string;
  target_column: string;
  constraint_name?: string;
  relation_type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  created_at: string;
}
