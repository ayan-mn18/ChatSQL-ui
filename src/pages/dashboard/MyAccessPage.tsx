import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Clock, Shield, Database } from 'lucide-react';
import { viewerService, Viewer, ViewerPermission } from '@/services/viewer.service';

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export default function MyAccessPage() {
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  const [additionalHours, setAdditionalHours] = useState<number>(0);
  const [requestWrite, setRequestWrite] = useState(false);
  const [requestAnalytics, setRequestAnalytics] = useState(false);
  const [requestAi, setRequestAi] = useState(false);
  const [requestExport, setRequestExport] = useState(false);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const expiresAtMs = useMemo(() => {
    if (!viewer?.expiresAt) return null;
    const d = new Date(viewer.expiresAt);
    const ms = d.getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [viewer?.expiresAt]);

  const remainingMs = useMemo(() => {
    if (!expiresAtMs) return null;
    return expiresAtMs - now;
  }, [expiresAtMs, now]);

  const groupedPermissions = useMemo(() => {
    const perms = viewer?.permissions ?? [];
    const map = new Map<string, { connectionName: string; permissions: ViewerPermission[] }>();
    for (const p of perms) {
      const key = p.connectionId;
      const existing = map.get(key);
      if (existing) {
        existing.permissions.push(p);
      } else {
        map.set(key, { connectionName: p.connectionName || p.connectionId, permissions: [p] });
      }
    }
    return Array.from(map.entries()).map(([connectionId, v]) => ({ connectionId, ...v }));
  }, [viewer?.permissions]);

  const load = async () => {
    setLoading(true);
    try {
      const me = await viewerService.getMyAccess();
      setViewer(me);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to load access');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildRequestedPermissions = (): ViewerPermission[] | undefined => {
    if (!viewer?.permissions?.length) return undefined;
    if (!requestWrite && !requestAnalytics && !requestAi && !requestExport) return undefined;

    return viewer.permissions.map((p) => ({
      ...p,
      canInsert: p.canInsert || requestWrite,
      canUpdate: p.canUpdate || requestWrite,
      canDelete: p.canDelete || requestWrite,
      canViewAnalytics: p.canViewAnalytics || requestAnalytics,
      canUseAi: p.canUseAi || requestAi,
      canExport: p.canExport || requestExport,
    }));
  };

  const submitRequest = async () => {
    try {
      const requestedPermissions = buildRequestedPermissions();
      const payload: any = {};
      if (additionalHours > 0) payload.additionalHours = additionalHours;
      if (requestedPermissions) payload.requestedPermissions = requestedPermissions;

      if (!payload.additionalHours && !payload.requestedPermissions) {
        toast.error('Select what you want to request');
        return;
      }

      await viewerService.createMyAccessRequest(payload);
      toast.success('Request submitted');
      setIsRequestOpen(false);
      setAdditionalHours(0);
      setRequestWrite(false);
      setRequestAnalytics(false);
      setRequestAi(false);
      setRequestExport(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to submit request');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8 overflow-y-auto h-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-400" />
          My Access
        </h1>
        <p className="text-sm md:text-base text-gray-400">
          View your allowed permissions and request extensions.
        </p>
      </div>

      {viewer?.isTemporary && expiresAtMs && (
        <Card className="bg-[#1B2431] border-[#273142]">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium">Temporary access</p>
                <p className="text-sm text-gray-400">
                  {remainingMs !== null && remainingMs > 0
                    ? `Expires in ${formatRemaining(remainingMs)}`
                    : 'Expired'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={remainingMs !== null && remainingMs > 0 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                {remainingMs !== null && remainingMs > 0 ? 'Limited time' : 'Expired'}
              </Badge>
              {viewer.expiresAt && (
                <span className="text-xs text-gray-500">{new Date(viewer.expiresAt).toLocaleString()}</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-[#1B2431] border-[#273142]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-400" />
            Allowed Permissions
          </CardTitle>
          <CardDescription className="text-gray-400">
            These permissions apply to your current account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-gray-400">Loading…</div>
          ) : groupedPermissions.length === 0 ? (
            <div className="text-gray-400">No permissions assigned.</div>
          ) : (
            <div className="space-y-6">
              {groupedPermissions.map((group) => (
                <div key={group.connectionId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-white font-medium">{group.connectionName}</div>
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">{group.permissions.length} rules</Badge>
                  </div>
                  <div className="rounded-lg border border-white/10 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-gray-400">Scope</TableHead>
                          <TableHead className="text-gray-400">Read</TableHead>
                          <TableHead className="text-gray-400">Write</TableHead>
                          <TableHead className="text-gray-400">AI</TableHead>
                          <TableHead className="text-gray-400">Analytics</TableHead>
                          <TableHead className="text-gray-400">Export</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.permissions.map((p, idx) => (
                          <TableRow key={`${group.connectionId}-${idx}`} className="border-white/10">
                            <TableCell className="text-gray-200">
                              {p.schemaName ? p.schemaName : 'All schemas'}
                              {p.tableName ? `.${p.tableName}` : p.schemaName ? '.*' : ''}
                            </TableCell>
                            <TableCell className={p.canSelect ? 'text-green-400' : 'text-gray-500'}>{p.canSelect ? 'Yes' : 'No'}</TableCell>
                            <TableCell className={p.canInsert || p.canUpdate || p.canDelete ? 'text-yellow-400' : 'text-gray-500'}>
                              {p.canInsert || p.canUpdate || p.canDelete ? 'Yes' : 'No'}
                            </TableCell>
                            <TableCell className={p.canUseAi ? 'text-green-400' : 'text-gray-500'}>{p.canUseAi ? 'Yes' : 'No'}</TableCell>
                            <TableCell className={p.canViewAnalytics ? 'text-green-400' : 'text-gray-500'}>{p.canViewAnalytics ? 'Yes' : 'No'}</TableCell>
                            <TableCell className={p.canExport ? 'text-green-400' : 'text-gray-500'}>{p.canExport ? 'Yes' : 'No'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Request Access Change</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1B2431] border-[#273142] text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Request Access</DialogTitle>
              <DialogDescription className="text-gray-400">
                Request more time and/or additional permissions. Your admin will review.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label className="text-gray-300">Additional hours</Label>
                <Input
                  type="number"
                  min={0}
                  value={additionalHours}
                  onChange={(e) => setAdditionalHours(parseInt(e.target.value || '0', 10) || 0)}
                  className="bg-[#273142] border-[#3A4553] text-white"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-gray-300">Permission upgrades (applies to your existing scope)</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm">Write access</p>
                      <p className="text-xs text-gray-500">Insert / Update / Delete</p>
                    </div>
                    <Switch checked={requestWrite} onCheckedChange={setRequestWrite} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm">Analytics</p>
                    <Switch checked={requestAnalytics} onCheckedChange={setRequestAnalytics} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm">AI</p>
                    <Switch checked={requestAi} onCheckedChange={setRequestAi} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm">Export</p>
                    <Switch checked={requestExport} onCheckedChange={setRequestExport} />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRequestOpen(false)} className="border-white/10 text-white hover:bg-white/5">
                Cancel
              </Button>
              <Button onClick={submitRequest} className="bg-blue-600 hover:bg-blue-700">
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
