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
import { Clock, Shield, Database, Sparkles, BarChart3, PenLine, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);

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
    if (submitting) return;
    try {
      setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const requestHasChanges = additionalHours > 0 || requestWrite || requestAnalytics || requestAi || requestExport;
  const permissionSummary = useMemo(() => {
    if (!viewer?.permissions?.length) return null;
    const connectionCount = new Set(viewer.permissions.map((p) => p.connectionId)).size;
    const anyWrite = viewer.permissions.some((p) => p.canInsert || p.canUpdate || p.canDelete);
    const anyAi = viewer.permissions.some((p) => p.canUseAi);
    const anyAnalytics = viewer.permissions.some((p) => p.canViewAnalytics);
    const anyExport = viewer.permissions.some((p) => p.canExport);
    return { connectionCount, anyWrite, anyAi, anyAnalytics, anyExport };
  }, [viewer?.permissions]);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8 overflow-y-auto h-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-400" />
            My Access
          </h1>
          <p className="text-sm md:text-base text-gray-400">
            Review your current access and request changes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={load}
            className="border-white/10 text-white hover:bg-white/5"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Request changes</Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1B2431] border-[#273142] text-white max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white">Request access changes</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Request more time and/or additional capabilities. Your admin will review.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">Time extension</p>
                      <p className="text-xs text-gray-500">Enter hours to extend your temporary access.</p>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Optional</Badge>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <Label className="text-gray-300">Additional hours</Label>
                    <Input
                      type="number"
                      min={0}
                      value={additionalHours}
                      onChange={(e) => setAdditionalHours(parseInt(e.target.value || '0', 10) || 0)}
                      className="bg-[#273142] border-[#3A4553] text-white"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">Capability upgrades</p>
                      <p className="text-xs text-gray-500">Applies to your existing scope (connections/schemas/tables).</p>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Optional</Badge>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-md border border-white/10 bg-[#273142]/40 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <PenLine className="h-4 w-4 text-yellow-400" />
                        <div>
                          <p className="text-sm text-white">Write access</p>
                          <p className="text-xs text-gray-500">Insert / Update / Delete</p>
                        </div>
                      </div>
                      <Switch checked={requestWrite} onCheckedChange={setRequestWrite} />
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-white/10 bg-[#273142]/40 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-green-400" />
                        <p className="text-sm text-white">Analytics</p>
                      </div>
                      <Switch checked={requestAnalytics} onCheckedChange={setRequestAnalytics} />
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-white/10 bg-[#273142]/40 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-400" />
                        <p className="text-sm text-white">AI</p>
                      </div>
                      <Switch checked={requestAi} onCheckedChange={setRequestAi} />
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-white/10 bg-[#273142]/40 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-purple-400" />
                        <p className="text-sm text-white">Export</p>
                      </div>
                      <Switch checked={requestExport} onCheckedChange={setRequestExport} />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#273142]/30 p-4">
                  <p className="text-sm font-medium text-white">Review</p>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Additional hours</span>
                      <span className="text-white">{additionalHours > 0 ? `+${additionalHours}h` : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Write</span>
                      <span className={requestWrite ? 'text-green-400' : 'text-gray-500'}>{requestWrite ? 'Requested' : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Analytics</span>
                      <span className={requestAnalytics ? 'text-green-400' : 'text-gray-500'}>{requestAnalytics ? 'Requested' : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">AI</span>
                      <span className={requestAi ? 'text-green-400' : 'text-gray-500'}>{requestAi ? 'Requested' : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Export</span>
                      <span className={requestExport ? 'text-green-400' : 'text-gray-500'}>{requestExport ? 'Requested' : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsRequestOpen(false)}
                  className="border-white/10 text-white hover:bg-white/5"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitRequest}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!requestHasChanges || submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit request'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1B2431] border-[#273142]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-400">Account</p>
              <p className="text-white font-semibold truncate">{viewer?.isTemporary ? 'Viewer (temporary)' : 'Viewer'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1B2431] border-[#273142]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-400">Expiry</p>
              {viewer?.isTemporary && expiresAtMs ? (
                <>
                  <p className="text-white font-semibold">
                    {remainingMs !== null && remainingMs > 0 ? formatRemaining(remainingMs) : 'Expired'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{viewer.expiresAt ? new Date(viewer.expiresAt).toLocaleString() : ''}</p>
                </>
              ) : (
                <p className="text-white font-semibold">No expiry</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1B2431] border-[#273142]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-400">Coverage</p>
              <p className="text-white font-semibold">
                {permissionSummary ? `${permissionSummary.connectionCount} connection${permissionSummary.connectionCount === 1 ? '' : 's'}` : '—'}
              </p>
              <p className="text-xs text-gray-500">
                {permissionSummary
                  ? [
                    permissionSummary.anyWrite ? 'Write' : null,
                    permissionSummary.anyAi ? 'AI' : null,
                    permissionSummary.anyAnalytics ? 'Analytics' : null,
                    permissionSummary.anyExport ? 'Export' : null,
                  ]
                    .filter(Boolean)
                    .join(' • ') || 'Read-only'
                  : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <div className="text-gray-400">Loading your access…</div>
          ) : groupedPermissions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/5 p-8 text-center">
              <Database className="h-10 w-10 mx-auto text-gray-500 mb-3" />
              <p className="text-white font-medium">No permissions assigned</p>
              <p className="text-sm text-gray-500 mt-1">Ask your admin to grant access, or submit a request.</p>
            </div>
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
    </div>
  );
}
