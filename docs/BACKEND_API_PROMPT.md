# Backend API Implementation Prompt for Database Sidebar

## Context
You need to build backend APIs to replace the mock data in the DatabaseSidebar component. The frontend is already built and expects specific data formats.

## Required APIs

### 1. GET TABLES API

**Endpoint**: `POST /api/getTables`

**Purpose**: Fetch all database tables with metadata

**Request Body**:
```typescript
{
  uri: string; // Database connection string
}
```

**Return Type**:
```typescript
interface GetTablesResponse {
  success: boolean;
  tables: TableInfo[];
  totalTables: number;
  error: string | null;
}

interface TableInfo {
  id: string;           // Unique table identifier
  name: string;         // Table name
  description: string;  // Table description/comment
  rowCount: number;     // Number of rows in table
  schema?: string;      // Schema name (optional)
  columns: ColumnInfo[];
}

interface ColumnInfo {
  key: string;          // Column name
  label: string;        // Display label
  type: 'string' | 'number' | 'date' | 'boolean';
  dataType: string;     // Actual database type
  sortable: boolean;
  isPrimaryKey?: boolean;
  isNullable?: boolean;
}
```

**Success Response Example**:
```json
{
  "success": true,
  "tables": [
    {
      "id": "users",
      "name": "users",
      "description": "User account information",
      "rowCount": 1250,
      "schema": "public",
      "columns": [
        {
          "key": "id",
          "label": "ID",
          "type": "number",
          "dataType": "integer",
          "sortable": true,
          "isPrimaryKey": true,
          "isNullable": false
        },
        {
          "key": "name",
          "label": "Name", 
          "type": "string",
          "dataType": "varchar(255)",
          "sortable": true,
          "isPrimaryKey": false,
          "isNullable": false
        }
      ]
    }
  ],
  "totalTables": 3,
  "error": null
}
```

### 2. GET TABLE DATA API

**Endpoint**: `POST /api/getTableData`

**Purpose**: Fetch paginated table data with filtering/sorting

**Request Body**:
```typescript
interface GetTableDataRequest {
  uri: string;           // Database connection string
  tableName: string;     // Table to query
  page?: number;         // Page number (default: 1)
  pageSize?: number;     // Records per page (default: 10, max: 100)
  sortBy?: string;       // Column to sort by
  sortOrder?: 'asc' | 'desc'; // Sort direction
  filterValue?: string;  // Global search filter
  columns?: string[];    // Specific columns to fetch
}
```

**Return Type**:
```typescript
interface GetTableDataResponse {
  success: boolean;
  data: Record<string, any>[]; // Array of row objects
  pagination: PaginationInfo;
  columns: ColumnInfo[];
  error: string | null;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

**Success Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com",
      "created_at": "2023-01-01T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Bob", 
      "email": "bob@example.com",
      "created_at": "2023-02-01T11:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalRecords": 1250,
    "totalPages": 125,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "columns": [
    {
      "key": "id",
      "label": "ID",
      "type": "number",
      "dataType": "integer",
      "sortable": true
    }
  ],
  "error": null
}
```

## Implementation Requirements

### Database Support
- **PostgreSQL**: Primary target
- **MySQL**: Secondary support
- **SQLite**: For testing

### Data Type Mapping
Map database types to frontend types:
```typescript
const typeMapping = {
  // Numbers
  'integer': 'number',
  'bigint': 'number', 
  'decimal': 'number',
  'numeric': 'number',
  'real': 'number',
  'double': 'number',
  
  // Strings
  'varchar': 'string',
  'text': 'string',
  'char': 'string',
  
  // Dates
  'timestamp': 'date',
  'date': 'date',
  'datetime': 'date',
  'time': 'date',
  
  // Booleans
  'boolean': 'boolean',
  'bit': 'boolean'
};
```

### Security Features
1. **SQL Injection Prevention**: Use parameterized queries
2. **Input Validation**: Validate table names, column names
3. **Connection Limits**: Max 100 pageSize, 60-second timeouts
4. **Rate Limiting**: Prevent API abuse

### Error Handling
Return consistent error responses:

**Error Response Type**:
```typescript
interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}
```

**Common Error Responses**:
```json
// Connection failure
{
  "success": false,
  "error": "Failed to connect to database",
  "code": "CONNECTION_ERROR"
}

// Table not found
{
  "success": false, 
  "error": "Table 'invalid_table' not found",
  "code": "TABLE_NOT_FOUND"
}

// Invalid parameters
{
  "success": false,
  "error": "Invalid page size. Maximum allowed is 100",
  "code": "INVALID_PARAMS"
}
```

### Performance Requirements
1. **Response Time**: < 2 seconds for table lists, < 5 seconds for data
2. **Memory Usage**: Limit result sets, use streaming for large tables
3. **Connection Pooling**: Reuse database connections
4. **Caching**: Cache table metadata for 5 minutes

### SQL Query Examples

**PostgreSQL - Get Tables**:
```sql
SELECT 
    t.table_name as name,
    t.table_schema as schema,
    obj_description(c.oid) as description,
    (SELECT reltuples::bigint FROM pg_class WHERE relname = t.table_name) as row_count
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;
```

**PostgreSQL - Get Columns**:
```sql
SELECT 
    column_name as key,
    column_name as label,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = $1 AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Dynamic Data Query**:
```sql
SELECT {columns} 
FROM {table_name}
WHERE {filter_conditions}
ORDER BY {sort_column} {sort_direction}
LIMIT $1 OFFSET $2;
```

## Integration Points

The frontend DatabaseSidebar component will:
1. Call `/api/getTables` when sidebar opens
2. Call `/api/getTableData` when table is selected  
3. Handle loading states and error messages
4. Support real-time filtering and sorting
5. Cache table metadata to reduce API calls

## Testing Checklist

- [ ] Test with different database types (PostgreSQL, MySQL)
- [ ] Test with large tables (>10k rows)
- [ ] Test filtering and sorting edge cases
- [ ] Test connection failures and recovery
- [ ] Test with special characters in names
- [ ] Test pagination with various page sizes
- [ ] Test concurrent requests
- [ ] Test memory usage with large result sets

## Deployment Notes

1. **Environment Variables**:
   ```env
   DB_CONNECTION_TIMEOUT=60000
   MAX_PAGE_SIZE=100
   CACHE_TTL=300
   ```

2. **Health Check**: Add `/api/health` endpoint

3. **Monitoring**: Log query performance and errors

4. **Scaling**: Consider read replicas for large databases

This specification provides everything needed to implement the backend APIs that will seamlessly integrate with the existing DatabaseSidebar frontend component.
