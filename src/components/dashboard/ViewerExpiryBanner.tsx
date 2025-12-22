import { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function ViewerExpiryBanner() {
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';
  const isTemporary = !!user?.is_temporary;

  const expiresAtMs = useMemo(() => {
    if (!user?.expires_at) return null;
    const ms = new Date(user.expires_at).getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [user?.expires_at]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!isViewer || !isTemporary || !expiresAtMs) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isViewer, isTemporary, expiresAtMs]);

  if (!isViewer || !isTemporary || !expiresAtMs) return null;

  const remainingMs = expiresAtMs - now;
  const isExpired = remainingMs <= 0;

  return (
    <div className="sticky top-0 z-30">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mt-4 rounded-xl border border-white/10 bg-[#1B2431]/90 backdrop-blur supports-[backdrop-filter]:bg-[#1B2431]/70">
          <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className={
                isExpired
                  ? 'h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center'
                  : 'h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center'
              }>
                <Clock className={isExpired ? 'h-5 w-5 text-red-400' : 'h-5 w-5 text-yellow-400'} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">Temporary access</p>
                <p className="text-xs text-gray-400">
                  {isExpired ? 'Expired' : `Expires in ${formatRemaining(remainingMs)}`} ·{' '}
                  <span className="text-gray-500">{new Date(expiresAtMs).toLocaleString()}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                className={
                  isExpired
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : remainingMs < 30 * 60 * 1000
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }
              >
                {isExpired ? 'Expired' : remainingMs < 30 * 60 * 1000 ? 'Ending soon' : 'Limited time'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
