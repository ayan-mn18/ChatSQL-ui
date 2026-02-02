import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { connectionService } from '@/services/connection.service';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function StandaloneChatPage() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const [searchParams] = useSearchParams();
  const selectedSchemas = searchParams.get('schemas')?.split(',') || [];
  const [connectionName, setConnectionName] = useState<string>('');

  useEffect(() => {
    if (connectionId) {
      loadConnectionInfo();
    }
  }, [connectionId]);

  const loadConnectionInfo = async () => {
    try {
      const response = await connectionService.getConnection(connectionId!);
      if (response.success && response.data) {
        setConnectionName(response.data.name);
      }
    } catch (error) {
      console.error('Failed to load connection info:', error);
    }
  };

  if (!connectionId) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <p>Connection ID is required</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <ChatPanel
        connectionId={connectionId}
        selectedSchemas={selectedSchemas}
        connectionName={connectionName}
        standalone
        hideExternalLink
      />
    </TooltipProvider>
  );
}