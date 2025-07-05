// API configuration and service functions
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Types for API responses (matching the backend specification)
export interface TableInfo {
  id: string;
  name: string;
  description: string;
  rowCount: number;
  schema?: string;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  dataType: string;
  sortable: boolean;
  isPrimaryKey?: boolean;
  isNullable?: boolean;
}

export interface GetTablesResponse {
  success: boolean;
  tables: TableInfo[];
  totalTables: number;
  error: string | null;
}

export interface GetTableDataRequest {
  uri: string;
  tableName: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterValue?: string;
  columns?: string[];
}

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetTableDataResponse {
  success: boolean;
  data: Record<string, any>[];
  pagination: PaginationInfo;
  columns: ColumnInfo[];
  error: string | null;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

// API service functions
export const databaseApi = {
  // Get all tables from the database
  async getTables(uri: string): Promise<GetTablesResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/getTables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uri }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tables:', error);
      return {
        success: false,
        tables: [],
        totalTables: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch tables',
      };
    }
  },

  // Get table data with pagination, filtering, and sorting
  async getTableData(request: GetTableDataRequest): Promise<GetTableDataResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/getTableData`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching table data:', error);
      return {
        success: false,
        data: [],
        pagination: {
          currentPage: 1,
          pageSize: 10,
          totalRecords: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        columns: [],
        error: error instanceof Error ? error.message : 'Failed to fetch table data',
      };
    }
  },
};

// Utility function to map database types to frontend types
export const mapDatabaseTypeToFrontendType = (dataType: string): 'string' | 'number' | 'date' | 'boolean' => {
  const type = dataType.toLowerCase();
  
  // Numbers
  if (type.includes('int') || type.includes('decimal') || type.includes('numeric') || 
      type.includes('real') || type.includes('double') || type.includes('float')) {
    return 'number';
  }
  
  // Dates
  if (type.includes('timestamp') || type.includes('date') || type.includes('time')) {
    return 'date';
  }
  
  // Booleans
  if (type.includes('boolean') || type.includes('bit')) {
    return 'boolean';
  }
  
  // Default to string
  return 'string';
};
