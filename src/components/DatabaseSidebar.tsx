import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, Filter, Download, Database, X, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { databaseApi, TableInfo, GetTableDataRequest, PaginationInfo } from '../services/databaseApi';

interface TableData {
  id: string;
  name: string;
  description: string;
  rowCount: number;
  columns: Column[];
  data: Record<string, unknown>[];
}

interface Column {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  sortable: boolean;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface DatabaseSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onTableSelect?: (tableId: string) => void;
  dbUri: string; // Database connection string
}

export default function DatabaseSidebar({ isOpen, onClose, onTableSelect, dbUri }: DatabaseSidebarProps) {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' });
  const [filterValue, setFilterValue] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingTableData, setIsLoadingTableData] = useState(false);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [tableDataError, setTableDataError] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    setIsLoadingTables(true);
    setTablesError(null);

    try {
      const response = await databaseApi.getTables(dbUri);
      if (response.success) {
        setTables(response.tables);
      } else {
        setTablesError(response.error || 'Failed to fetch tables');
        setTables([]);
      }
    } catch (error) {
      setTablesError(error instanceof Error ? error.message : 'Failed to fetch tables');
      setTables([]);
    } finally {
      setIsLoadingTables(false);
    }
  }, [dbUri]);

  // Fetch tables when the sidebar opens
  useEffect(() => {
    if (isOpen && dbUri) {
      fetchTables();
    }
  }, [isOpen, dbUri, fetchTables]);

  // Filter tables based on search query
  const filteredTables = useMemo(() => {
    return tables.filter(table =>
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tables, searchQuery]);

  const fetchTableData = useCallback(async () => {
    if (!selectedTable || !dbUri) {
      return;
    }

    setIsLoadingTableData(true);
    setTableDataError(null);

    try {
      const request: GetTableDataRequest = {
        uri: dbUri,
        tableName: selectedTable,
        page: currentPage,
        pageSize: pageSize,
        sortBy: sortConfig.key || undefined,
        sortOrder: sortConfig.direction,
        filterValue: filterValue || undefined,
      };

      const response = await databaseApi.getTableData(request);

      if (response.success) {
        // Convert the API response to our local TableData format
        const selectedTableInfo = tables.find(t => t.id === selectedTable);
        if (selectedTableInfo) {
          setTableData({
            id: selectedTableInfo.id,
            name: selectedTableInfo.name,
            description: selectedTableInfo.description,
            rowCount: response.pagination.totalRecords,
            columns: selectedTableInfo.columns,
            data: response.data,
          });
          setPagination(response.pagination);
          setVisibleColumns(new Set(selectedTableInfo.columns.map(col => col.key)));
        }
      } else {
        setTableDataError(response.error || 'Failed to fetch table data');
        setTableData(null);
        setPagination(null);
      }
    } catch (error) {
      setTableDataError(error instanceof Error ? error.message : 'Failed to fetch table data');
      setTableData(null);
      setPagination(null);
    } finally {
      setIsLoadingTableData(false);
    }
  }, [selectedTable, dbUri, sortConfig, filterValue, currentPage, pageSize, tables]);

  // Load table data when selectedTable changes
  useEffect(() => {
    if (selectedTable && dbUri) {
      fetchTableData();
    }
  }, [selectedTable, dbUri, sortConfig, filterValue, currentPage, pageSize, fetchTableData]);

  const handleTableSelect = (tableId: string) => {
    setSelectedTable(tableId);
    setCurrentPage(1); // Reset to first page when selecting a new table
    setFilterValue(''); // Clear any existing filter
    setSortConfig({ key: '', direction: 'asc' }); // Reset sorting

    // Call the optional callback prop
    if (onTableSelect) {
      onTableSelect(tableId);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page when sorting
  };

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  };

  const downloadData = (format: 'csv' | 'json') => {
    if (!tableData) {
      return;
    }

    // For download, use the current displayed data
    const dataToDownload = tableData.data;
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'csv') {
      const headers = tableData.columns
        .filter(col => visibleColumns.has(col.key))
        .map(col => col.label)
        .join(',');

      const rows = dataToDownload.map(row =>
        tableData.columns
          .filter(col => visibleColumns.has(col.key))
          .map(col => row[col.key])
          .join(',')
      ).join('\n');

      content = `${headers}\n${rows}`;
      filename = `${tableData.name}_data.csv`;
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(dataToDownload, null, 2);
      filename = `${tableData.name}_data.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Sidebar taking 70-80% width */}
      <div className="w-4/5 bg-white shadow-xl flex">
        {/* Table List Section (Left) */}
        <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Database Tables</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Table List */}
          <div className="flex-1 overflow-y-auto scroll-container scroll-smooth">
            <div className="space-y-2 pr-2">
              {isLoadingTables ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p className="text-sm">Loading tables...</p>
                </div>
              ) : tablesError ? (
                <div className="flex flex-col items-center justify-center py-8 text-red-500">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p className="text-sm text-center">{tablesError}</p>
                  <button
                    onClick={fetchTables}
                    className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredTables.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Database className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No tables found</p>
                </div>
              ) : (
                filteredTables.map((table) => (
                  <div
                    key={table.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border ${selectedTable === table.id
                      ? 'bg-blue-50 border-blue-500 shadow-sm'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    onClick={() => handleTableSelect(table.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="h-4 w-4 text-gray-500" />
                      <h3 className="font-medium text-sm text-gray-900">{table.name}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{table.description}</p>
                    <span className="inline-block px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                      {table.rowCount.toLocaleString()} rows
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Data Viewer Section (Right) */}
        <div className="flex-1 p-6 flex flex-col h-full w-96">
          {!selectedTable ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Database className="h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a Table</h3>
              <p className="text-sm">Choose a table from the left to view its data</p>
            </div>
          ) : isLoadingTableData ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Loader2 className="h-12 w-12 mb-4 animate-spin" />
              <h3 className="text-lg font-medium mb-2">Loading Table Data</h3>
              <p className="text-sm">Fetching data from {selectedTable}...</p>
            </div>
          ) : tableDataError ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
              <AlertCircle className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
              <p className="text-sm text-center mb-4">{tableDataError}</p>
              <button
                onClick={fetchTableData}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          ) : tableData ? (
            <div className="h-full flex flex-col">
              {/* Fixed Header - Always visible */}
              <div className="flex-shrink-0 mb-4">
                <div className="flex items-center justify-between mb-4 w-full">
                  <div className="min-w-0 flex-1 mr-4">
                    <h3 className="text-xl font-semibold text-gray-900 truncate">{tableData.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{tableData.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Column Selector */}
                    <div className="relative">
                      <button
                        onClick={() => setShowColumnSelector(!showColumnSelector)}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 whitespace-nowrap"
                      >
                        <Eye className="w-4 h-4" />
                        Columns
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {showColumnSelector && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto scroll-container">
                          <div className="p-2">
                            {tableData.columns.map((column) => (
                              <label key={column.key} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.has(column.key)}
                                  onChange={() => toggleColumnVisibility(column.key)}
                                  className="rounded"
                                />
                                <span className="text-sm">{column.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Download Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadData('csv')}
                        className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2 whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        CSV
                      </button>
                      <button
                        onClick={() => downloadData('json')}
                        className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2 whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        JSON
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Filter data..."
                      value={filterValue}
                      onChange={(e) => {
                        setFilterValue(e.target.value);
                        setCurrentPage(1); // Reset to first page when filtering
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Scrollable Table Container */}
              <div className="flex-1 border border-gray-200 rounded-lg bg-white overflow-hidden min-h-0">
                <div className="w-full h-full overflow-auto scroll-container scroll-smooth">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        {tableData.columns
                          .filter(col => visibleColumns.has(col.key))
                          .map((column) => (
                            <th
                              key={column.key}
                              className={`px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200 ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                                }`}
                              style={{ minWidth: '120px' }}
                              onClick={() => column.sortable && handleSort(column.key)}
                            >
                              <div className="flex items-center gap-2">
                                <span className="whitespace-nowrap">{column.label}</span>
                                {column.sortable && sortConfig.key === column.key && (
                                  sortConfig.direction === 'asc' ?
                                    <ChevronUp className="h-4 w-4 flex-shrink-0" /> :
                                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                )}
                              </div>
                            </th>
                          ))}
                      </tr>
                    </thead>                    <tbody className="divide-y divide-gray-200 bg-white">
                      {!tableData?.data || tableData.data.length === 0 ? (
                        <tr>
                          <td colSpan={visibleColumns.size} className="px-4 py-8 text-center text-gray-500">
                            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No data available</p>
                          </td>
                        </tr>
                      ) : (
                        tableData.data.map((row: Record<string, unknown>, index: number) => (
                          <tr key={index} className="hover:bg-gray-50 border-b border-gray-100">
                            {tableData.columns
                              .filter(col => visibleColumns.has(col.key))
                              .map((column) => (
                                <td key={column.key} className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100" style={{ minWidth: '120px' }}>
                                  <div className="whitespace-nowrap overflow-hidden text-ellipsis" title={String(row[column.key])}>
                                    {column.key === 'status' ? (
                                      <span className={`inline-block px-2 py-1 text-xs rounded ${row[column.key] === 'Completed' || row[column.key] === 'active' ? 'bg-green-100 text-green-800' :
                                        row[column.key] === 'Pending' || row[column.key] === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                        {String(row[column.key])}
                                      </span>
                                    ) : column.type === 'number' && (column.key.includes('price') || column.key.includes('amount')) ? (
                                      `$${row[column.key]}`
                                    ) : (
                                      String(row[column.key])
                                    )}
                                  </div>
                                </td>
                              ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fixed Pagination Footer */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex-shrink-0 flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)} of {pagination.totalRecords} results
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!pagination.hasPreviousPage}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                      disabled={!pagination.hasNextPage}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Database className="h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Data Available</h3>
              <p className="text-sm">Unable to load table data</p>
            </div>
          )}
        </div>
      </div>

      {/* Blurred Background - Chat Area */}
      <div
        className="flex-1 bg-black bg-opacity-30 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
    </div>
  );
}
