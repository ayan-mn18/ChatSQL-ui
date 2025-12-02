import { useConnections } from '@/hooks/useConnections';
import { AddConnectionDialog } from '@/components/dashboard/AddConnectionDialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Database, Trash2, ArrowRight, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function ConnectionsPage() {
  const { connections, removeConnection } = useConnections();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Connections</h1>
          <p className="text-gray-400">Manage your database connections.</p>
        </div>
        <AddConnectionDialog onConnectionAdded={() => { }} />
      </div>

      {connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] border-none rounded-xl bg-[#273142] shadow-lg">
          <div className="w-16 h-16 bg-[#3b82f6]/10 rounded-full flex items-center justify-center mb-4">
            <Database className="w-8 h-8 text-[#3b82f6]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No connections yet</h3>
          <p className="text-gray-400 mb-6 max-w-md text-center">
            Connect to your database to start visualizing tables and running queries.
          </p>
          <AddConnectionDialog onConnectionAdded={() => { }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((conn) => (
            <Card key={conn.id} className="bg-[#273142] border-none shadow-lg hover:shadow-xl transition-all group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6]">
                    <Server className="w-5 h-5" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 -mr-2 -mt-2"
                    onClick={() => removeConnection(conn.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-white mt-4">{conn.name}</CardTitle>
                <CardDescription className="text-gray-500 font-mono text-xs">
                  {conn.user}@{conn.host}:{conn.port}/{conn.database}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {conn.type.toUpperCase()}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 text-[#3b82f6] border-none transition-all"
                  onClick={() => navigate(`/dashboard/connection/${conn.id}/overview`)}
                >
                  Open Dashboard
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
