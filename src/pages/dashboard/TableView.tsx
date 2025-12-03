import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import DataTable, { ColumnDef } from '@/components/DataTable';
import { mockDatabase } from '@/lib/mockData';

export default function TableView() {
  const { tableName } = useParams<{ tableName: string }>();

  // Normalize tableName to match mockDatabase keys (e.g., "users", "products")
  // If tableName is undefined, default to 'users' or handle error
  const dbKey = (tableName?.toLowerCase() || 'users') as keyof typeof mockDatabase;
  const data = mockDatabase[dbKey] || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500/20 text-green-500 hover:bg-green-500/30';
      case 'shipped': return 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30';
      case 'processing': return 'bg-purple-500/20 text-purple-500 hover:bg-purple-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-500 hover:bg-red-500/30';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  // Dynamic column definitions based on table name
  const getColumns = (): ColumnDef<any>[] => {
    switch (dbKey) {
      case 'users':
        return [
          {
            key: 'first_name',
            header: 'User',
            cell: (row) => (
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <AvatarFallback>{row.first_name[0]}{row.last_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-white font-medium">{row.first_name} {row.last_name}</div>
                  <div className="text-xs text-gray-500">{row.email}</div>
                </div>
              </div>
            )
          },
          { key: 'role', header: 'Role', cell: (row) => <Badge variant="outline" className="capitalize border-white/10 text-gray-400">{row.role}</Badge> },
          { key: 'job_title', header: 'Job Title', className: 'text-gray-300' },
          { key: 'department', header: 'Department', className: 'text-gray-300' },
          { key: 'company', header: 'Company', className: 'text-gray-300' },
          { key: 'phone', header: 'Phone', className: 'text-gray-400' },
          { key: 'country', header: 'Country', className: 'text-gray-300' },
          { key: 'city', header: 'City', className: 'text-gray-400' },
          { key: 'status', header: 'Status', cell: (row) => <Badge variant="outline" className={`capitalize border-white/10 ${row.status === 'active' ? 'text-green-400 bg-green-400/10' : 'text-gray-400'}`}>{row.status}</Badge> },
          { key: 'created_at', header: 'Joined', cell: (row) => new Date(row.created_at).toLocaleDateString(), className: 'text-gray-400' },
          { key: 'last_login', header: 'Last Login', cell: (row) => new Date(row.last_login).toLocaleDateString(), className: 'text-gray-400' },
        ];
      case 'products':
        return [
          { key: 'name', header: 'Product Name', className: 'text-white font-medium' },
          { key: 'price', header: 'Price', cell: (row) => `$${row.price}`, className: 'text-right font-mono text-gray-300' },
          { key: 'stock_quantity', header: 'Stock', className: 'text-right font-mono text-gray-300' },
          { key: 'created_at', header: 'Added', cell: (row) => new Date(row.created_at).toLocaleDateString(), className: 'text-gray-400' },
        ];
      case 'orders':
        return [
          { key: 'id', header: 'Order ID', className: 'font-mono text-xs text-gray-400' },
          {
            key: 'status',
            header: 'Status',
            cell: (row) => (
              <Badge className={`rounded-full px-3 py-0.5 border-none capitalize ${getStatusColor(row.status)}`}>
                {row.status}
              </Badge>
            )
          },
          { key: 'total_amount', header: 'Total', cell: (row) => `$${row.total_amount}`, className: 'text-right font-mono text-white font-medium' },
          { key: 'shipping_address', header: 'Address', className: 'text-gray-400 truncate max-w-[200px]' },
          { key: 'created_at', header: 'Date', cell: (row) => new Date(row.created_at).toLocaleDateString(), className: 'text-gray-400' },
        ];
      default:
        // Fallback to auto-generated columns from DataTable
        return [];
    }
  };

  const columns = getColumns();
  const title = dbKey.charAt(0).toUpperCase() + dbKey.slice(1);

  const handleSave = async (updatedData: any[]) => {
    // Update the mock database in memory
    (mockDatabase as any)[dbKey] = updatedData;
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col space-y-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          <p className="text-gray-400 text-sm">Manage your {dbKey} data.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-none bg-[#273142] text-white hover:bg-[#323d52]">
            <span className="mr-2">Filter</span>
            <ChevronRight className="w-4 h-4 rotate-90" />
          </Button>
        </div>
      </div>

      <div className="flex-1 border-none rounded-xl overflow-hidden bg-[#273142] shadow-lg min-h-0">
        <DataTable
          data={data}
          columns={columns.length > 0 ? columns : undefined}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}