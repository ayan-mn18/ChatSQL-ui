import { useParams, useSearchParams } from 'react-router-dom';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useConnectionQuery } from '@/hooks/useQueries';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function StandaloneChatPage() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const [searchParams] = useSearchParams();
  const selectedSchemas = searchParams.get('schemas')?.split(',') || [];

  const { data: connectionData } = useConnectionQuery(connectionId);
  const connectionName = connectionData?.data?.name || connectionData?.name || '';

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