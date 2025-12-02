import { useParams } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Trash2, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function TableView() {
  const { tableName } = useParams();

  // Mock Data matching the "Deals Details" reference style
  const columns = ['Product Name', 'Location', 'Date - Time', 'Piece', 'Amount', 'Status'];
  const data = [
    { id: 1, name: 'Apple Watch', image: 'https://github.com/shadcn.png', location: '6096 Marjolaine Landing', date: '12.09.2019 - 12.53 PM', piece: 423, amount: '$34,295', status: 'Delivered' },
    { id: 2, name: 'AirPods Pro', image: 'https://github.com/shadcn.png', location: '4234 Kaley Road', date: '13.09.2019 - 10.20 AM', piece: 120, amount: '$24,500', status: 'Pending' },
    { id: 3, name: 'MacBook Pro', image: 'https://github.com/shadcn.png', location: '1234 Broadway Ave', date: '14.09.2019 - 09.00 AM', piece: 50, amount: '$120,000', status: 'Delivered' },
    { id: 4, name: 'iPhone 13', image: 'https://github.com/shadcn.png', location: '5678 Market St', date: '15.09.2019 - 02.30 PM', piece: 200, amount: '$180,000', status: 'Cancelled' },
    { id: 5, name: 'iPad Air', image: 'https://github.com/shadcn.png', location: '9012 Sunset Blvd', date: '16.09.2019 - 04.15 PM', piece: 80, amount: '$45,000', status: 'Delivered' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-500/20 text-green-500 hover:bg-green-500/30';
      case 'Pending': return 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30';
      case 'Cancelled': return 'bg-red-500/20 text-red-500 hover:bg-red-500/30';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className="p-8 h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Deals Details</h1>
          <p className="text-gray-400 text-sm">Manage your product deals and status.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-none bg-[#273142] text-white hover:bg-[#323d52]">
            <span className="mr-2">October</span>
            <ChevronRight className="w-4 h-4 rotate-90" />
          </Button>
        </div>
      </div>

      <div className="border-none rounded-xl overflow-hidden bg-[#273142] shadow-lg">
        <Table>
          <TableHeader className="bg-[#323d52]">
            <TableRow className="border-none hover:bg-[#323d52]">
              {columns.map(col => (
                <TableHead key={col} className="text-gray-300 font-medium py-4">{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id} className="border-b border-gray-700/50 hover:bg-[#323d52]/50">
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-xl">
                      <AvatarImage src={row.image} />
                      <AvatarFallback>PD</AvatarFallback>
                    </Avatar>
                    <span className="text-white font-medium">{row.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-400">{row.location}</TableCell>
                <TableCell className="text-gray-400">{row.date}</TableCell>
                <TableCell className="text-gray-400">{row.piece}</TableCell>
                <TableCell className="text-white font-medium">{row.amount}</TableCell>
                <TableCell>
                  <Badge className={`rounded-full px-4 py-1 border-none ${getStatusColor(row.status)}`}>
                    {row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
