import { Card, CardContent } from '@/components/ui/card';
import { Database } from 'lucide-react';

export default function SchemaVisualizer() {
  return (
    <div className="space-y-8 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Schema Visualizer</h1>
        <p className="text-gray-400">Visualize your database relationships.</p>
      </div>

      <Card className="bg-[#273142] border-none shadow-lg flex-1 flex items-center justify-center min-h-[400px]">
        <CardContent className="text-center space-y-4">
          <div className="bg-[#1B2431] p-4 rounded-full inline-block">
            <Database className="h-12 w-12 text-[#3b82f6]" />
          </div>
          <h2 className="text-xl font-semibold text-white">Interactive ERD</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            The schema visualization tool is currently under development. Soon you will be able to view and interact with your database entity relationships here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
