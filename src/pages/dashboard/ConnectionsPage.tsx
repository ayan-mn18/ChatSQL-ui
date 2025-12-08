import { useState, useEffect } from 'react';
import { AddConnectionDialog, DatabaseConnection } from '@/components/dashboard/AddConnectionDialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Database, Trash2, ArrowRight, Server, Pencil, Sparkles, Zap, Shield, Cable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Local storage hook for connections (until backend CRUD is implemented)
function useLocalConnections() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('chatsql_connections');
    if (stored) {
      setConnections(JSON.parse(stored));
    }
  }, [refreshKey]);

  const deleteConnection = (id: string) => {
    const stored = localStorage.getItem('chatsql_connections');
    const conns: DatabaseConnection[] = stored ? JSON.parse(stored) : [];
    const filtered = conns.filter(c => c.id !== id);
    localStorage.setItem('chatsql_connections', JSON.stringify(filtered));
    setConnections(filtered);
    toast.success('Connection deleted');
  };

  const refresh = () => setRefreshKey(k => k + 1);

  return { connections, deleteConnection, refresh };
}

export default function ConnectionsPage() {
  const { connections, deleteConnection, refresh } = useLocalConnections();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Connections</h1>
          <p className="text-gray-400">Manage your database connections.</p>
        </div>
        <AddConnectionDialog onConnectionAdded={refresh} />
      </div>

      {connections.length === 0 ? (
        <Card className="border-none rounded-xl bg-gradient-to-br from-[#273142] to-[#1e2736] shadow-2xl overflow-hidden">
          <div className="relative">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
              {/* Floating icons */}
              <Database className="absolute top-8 right-12 w-6 h-6 text-blue-500/20 animate-pulse" />
              <Server className="absolute top-24 right-32 w-5 h-5 text-purple-500/20 animate-pulse delay-300" />
              <Cable className="absolute bottom-16 left-12 w-5 h-5 text-green-500/20 animate-pulse delay-500" />
            </div>

            <CardContent className="flex flex-col items-center justify-center py-20 relative z-10">
              {/* Main icon with ring animation */}
              <div className="relative mb-8">
                <div className="absolute inset-0 w-24 h-24 bg-blue-500/20 rounded-full animate-ping opacity-20" />
                <div className="absolute inset-2 w-20 h-20 bg-blue-500/10 rounded-full animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-blue-500/20">
                  <Database className="w-10 h-10 text-blue-400" />
                </div>
              </div>

              {/* Title and description */}
              <Badge variant="secondary" className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Get Started
              </Badge>

              <h3 className="text-2xl font-bold text-white mb-3">
                No connections yet
              </h3>

              <p className="text-gray-400 mb-8 max-w-md text-center leading-relaxed">
                Connect your PostgreSQL database to unlock powerful AI-driven SQL generation,
                schema visualization, and query insights.
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">AI-Powered</p>
                    <p className="text-xs text-gray-500">Natural language to SQL</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Database className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Schema Sync</p>
                    <p className="text-xs text-gray-500">Auto-detect tables</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Secure</p>
                    <p className="text-xs text-gray-500">Encrypted credentials</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <AddConnectionDialog onConnectionAdded={refresh} />

              <p className="mt-4 text-xs text-gray-500">
                Currently supports PostgreSQL • More databases coming soon
              </p>
            </CardContent>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((conn) => (
            <Card key={conn.id} className="bg-[#273142] border-none shadow-lg hover:shadow-xl transition-all group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6]">
                    <Server className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1 -mr-2 -mt-2">
                    <AddConnectionDialog
                      onConnectionAdded={refresh}
                      connectionToEdit={conn}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-500 hover:text-blue-400 hover:bg-blue-400/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => deleteConnection(conn.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
