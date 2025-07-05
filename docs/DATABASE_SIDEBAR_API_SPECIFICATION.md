# Database Sidebar API Specification

## Overview

This document outlines the backend APIs required to support the Database Sidebar visualization feature in ChatSQL. The APIs should dynamically fetch database schema information and table data based on the provided database URI.

## Authentication & Connection

All APIs use the existing database URI from the user's settings for authentication and connection.

**Base URL**: `https://api.chatsql.ayanmn18.live/api` (or your backend URL)

---

## API Endpoints

### 1. Get Database Tables List

**Endpoint**: `POST /api/getTables`

**Purpose**: Fetch all tables in the connected database with metadata

**Request Body**:
```json
{
  "uri": "postgresql://username:password@host:port/database_name"
}
```

**Response Format**:
```json
{
  "success": true,
  "tables": [
    {
      "id": "users",
      "name": "users", 
      "description": "User account information and authentication data",
      "rowCount": 1250,
      "schema": "public",
      "type": "table",
      "columns": [
        {
          "key": "id",
          "label": "ID", 
          "type": "number",
          "dataType": "integer",
          "isPrimaryKey": true,
          "isNullable": false,
          "sortable": true
        },
        {
          "key": "name",
          "label": "Name",
          "type": "string", 
          "dataType": "varchar(255)",
          "isPrimaryKey": false,
          "isNullable": false,
          "sortable": true
        },
        {
          "key": "email",
          "label": "Email",
          "type": "string",
          "dataType": "varchar(255)", 
          "isPrimaryKey": false,
          "isNullable": false,
          "sortable": true
        },
        {
          "key": "created_at",
          "label": "Created At",
          "type": "date",
          "dataType": "timestamp",
          "isPrimaryKey": false,
          "isNullable": false,
          "sortable": true
        }
      ]
    },
    {
      "id": "orders",
      "name": "orders",
      "description": "Customer order history and transaction records", 
      "rowCount": 2340,
      "schema": "public",
      "type": "table",
      "columns": [
        {
          "key": "order_id",
          "label": "Order ID",
          "type": "number",
          "dataType": "integer",
          "isPrimaryKey": true,
          "isNullable": false,
          "sortable": true
        },
        {
          "key": "user_id", 
          "label": "User ID",
          "type": "number",
          "dataType": "integer",
          "isPrimaryKey": false,
          "isNullable": false,
          "sortable": true
        },
        {
          "key": "amount",
          "label": "Amount", 
          "type": "number",
          "dataType": "decimal(10,2)",
          "isPrimaryKey": false,
          "isNullable": false,
          "sortable": true
        },
        {
          "key": "status",
          "label": "Status",
          "type": "string",
          "dataType": "varchar(50)",
          "isPrimaryKey": false,
          "isNullable": false,
          "sortable": true
        },
        {
          "key": "placed_at",
          "label": "Placed At",
          "type": "date",
          "dataType": "timestamp",
          "isPrimaryKey": false,
          "isNullable": false,
          "sortable": true
        }
      ]
    }
  ],
  "totalTables": 15,
  "error": null
}
```

**Error Response**:
```json
{
  "success": false,
  "tables": [],
  "totalTables": 0,
  "error": "Failed to connect to database or fetch tables"
}
```

---

### 2. Get Table Data

**Endpoint**: `POST /api/getTableData`

**Purpose**: Fetch paginated data from a specific table with filtering and sorting

**Request Body**:
```json
{
  "uri": "postgresql://username:password@host:port/database_name",
  "tableName": "users",
  "page": 1,
  "pageSize": 10,
  "sortBy": "id",
  "sortOrder": "asc",
  "filters": {
    "name": "john",
    "status": "active"
  },
  "columns": ["id", "name", "email", "created_at"]
}
```

**Request Parameters**:
- `uri`: Database connection string
- `tableName`: Name of the table to query
- `page`: Page number (1-based indexing)
- `pageSize`: Number of records per page (default: 10, max: 100)
- `sortBy`: Column name to sort by (optional)
- `sortOrder`: "asc" or "desc" (optional, default: "asc")
- `filters`: Object with column-value pairs for filtering (optional)
- `columns`: Array of column names to fetch (optional, defaults to all columns)

**Response Format**:
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
      "dataType": "integer"
    },
    {
      "key": "name", 
      "label": "Name",
      "type": "string",
      "dataType": "varchar(255)"
    },
    {
      "key": "email",
      "label": "Email", 
      "type": "string",
      "dataType": "varchar(255)"
    },
    {
      "key": "created_at",
      "label": "Created At",
      "type": "date",
      "dataType": "timestamp"
    }
  ],
  "error": null
}
```

**Error Response**:
```json
{
  "success": false,
  "data": [],
  "pagination": null,
  "columns": [],
  "error": "Table 'users' not found or access denied"
}
```

---

### 3. Get Table Schema Details

**Endpoint**: `POST /api/getTableSchema`

**Purpose**: Get detailed schema information for a specific table

**Request Body**:
```json
{
  "uri": "postgresql://username:password@host:port/database_name",
  "tableName": "users"
}
```

**Response Format**:
```json
{
  "success": true,
  "schema": {
    "tableName": "users",
    "schemaName": "public",
    "tableType": "table",
    "description": "User account information and authentication data",
    "rowCount": 1250,
    "columns": [
      {
        "columnName": "id",
        "dataType": "integer",
        "isNullable": false,
        "defaultValue": "nextval('users_id_seq'::regclass)",
        "isPrimaryKey": true,
        "isForeignKey": false,
        "maxLength": null,
        "precision": 32,
        "scale": 0,
        "ordinalPosition": 1
      },
      {
        "columnName": "name",
        "dataType": "character varying",
        "isNullable": false,
        "defaultValue": null,
        "isPrimaryKey": false,
        "isForeignKey": false,
        "maxLength": 255,
        "precision": null,
        "scale": null,
        "ordinalPosition": 2
      }
    ],
    "indexes": [
      {
        "indexName": "users_pkey",
        "columnNames": ["id"],
        "isUnique": true,
        "isPrimary": true
      },
      {
        "indexName": "users_email_idx",
        "columnNames": ["email"],
        "isUnique": true,
        "isPrimary": false
      }
    ],
    "foreignKeys": [],
    "constraints": [
      {
        "constraintName": "users_email_check",
        "constraintType": "CHECK",
        "columnNames": ["email"],
        "definition": "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'"
      }
    ]
  },
  "error": null
}
```

---

## Data Type Mapping

The frontend expects these standardized data types:

| Database Type | Frontend Type | Description |
|---------------|---------------|-------------|
| `integer`, `bigint`, `smallint`, `numeric`, `decimal`, `real`, `double` | `number` | Numeric values |
| `varchar`, `text`, `char`, `string` | `string` | Text values |
| `timestamp`, `date`, `time`, `datetime` | `date` | Date/time values |
| `boolean`, `bit` | `boolean` | Boolean values |

---

## Implementation Guidelines

### Database Connection Handling

1. **Connection Pooling**: Use connection pooling to efficiently manage database connections
2. **Connection Validation**: Validate the URI format and test connectivity before executing queries
3. **Timeout Handling**: Implement appropriate timeouts (30-60 seconds) for long-running queries
4. **Error Handling**: Provide meaningful error messages for connection failures

### Security Considerations

1. **SQL Injection Prevention**: Use parameterized queries/prepared statements
2. **Input Validation**: Validate all input parameters (table names, column names, filters)
3. **Query Limits**: Implement maximum limits for page sizes and result sets
4. **Rate Limiting**: Implement rate limiting to prevent abuse

### Performance Optimization

1. **Query Optimization**: Use efficient queries with proper indexing
2. **Caching**: Cache table schema information for frequently accessed tables
3. **Pagination**: Always use LIMIT/OFFSET for pagination to avoid large result sets
4. **Column Selection**: Only select requested columns to reduce data transfer

### Error Handling

Return consistent error responses with appropriate HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Invalid database credentials
- `404 Not Found`: Table or database not found
- `500 Internal Server Error`: Server or database errors
- `503 Service Unavailable`: Database connection issues

### Sample Implementation Queries

**PostgreSQL - Get Tables List**:
```sql
SELECT 
    t.table_name as name,
    t.table_schema as schema,
    t.table_type as type,
    obj_description(c.oid) as description,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = t.table_name) as row_count
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;
```

**PostgreSQL - Get Table Columns**:
```sql
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = $1 
    AND table_schema = 'public'
ORDER BY ordinal_position;
```

**MySQL - Get Tables List**:
```sql
SELECT 
    TABLE_NAME as name,
    TABLE_SCHEMA as schema,
    TABLE_TYPE as type,
    TABLE_COMMENT as description,
    TABLE_ROWS as row_count
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

## Frontend Integration

The frontend `DatabaseSidebar` component expects:

1. Call `/api/getTables` when the sidebar opens
2. Call `/api/getTableData` when a table is selected
3. Handle loading states and errors gracefully
4. Support real-time filtering and sorting
5. Cache table metadata to reduce API calls

## Testing Considerations

1. Test with different database types (PostgreSQL, MySQL, SQLite, etc.)
2. Test with large tables (pagination performance)
3. Test with special characters in table/column names
4. Test connection failures and recovery
5. Test filtering and sorting edge cases
6. Test with empty tables and databases

---

This API specification provides a solid foundation for implementing the backend services needed to support the Database Sidebar feature with dynamic data fetching from any connected database.
