import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Info, Database } from 'lucide-react';
import { useConnections } from '@/hooks/useConnections';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function AddConnectionDialog({ onConnectionAdded }: { onConnectionAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { addConnection, testConnection } = useConnections();

  const [formData, setFormData] = useState({
    name: '',
    type: 'postgres',
    host: 'localhost',
    port: '5432',
    user: 'postgres',
    password: '',
    database: 'postgres'
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTestStatus('idle'); // Reset status on change
  };

  const handleTest = async () => {
    setTesting(true);
    setTestStatus('idle');
    try {
      await testConnection(formData);
      setTestStatus('success');
    } catch (e) {
      setTestStatus('error');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (testStatus !== 'success') return;
    addConnection(formData as any);
    setOpen(false);
    onConnectionAdded();
    setTestStatus('idle');
    setFormData({
      name: '',
      type: 'postgres',
      host: 'localhost',
      port: '5432',
      user: 'postgres',
      password: '',
      database: 'postgres'
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4 mr-2" />
          Add Connection
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#273142] border-none text-white sm:max-w-[500px] shadow-2xl">
        <DialogHeader>
          <DialogTitle>Add New Connection</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter your database credentials to connect.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-gray-400">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="col-span-3 bg-[#1B2431] border-none text-white focus:ring-1 focus:ring-[#3b82f6]"
              placeholder="My Production DB"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right text-gray-400">Type</Label>
            <Select value={formData.type} onValueChange={(val) => handleChange('type', val)}>
              <SelectTrigger className="col-span-3 bg-[#1B2431] border-none text-white focus:ring-1 focus:ring-[#3b82f6]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-[#273142] border-none text-white">
                <SelectItem value="postgres">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="mongodb">MongoDB</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="host" className="text-right text-gray-400">Host</Label>
            <Input
              id="host"
              value={formData.host}
              onChange={(e) => handleChange('host', e.target.value)}
              className="col-span-3 bg-[#1B2431] border-none text-white focus:ring-1 focus:ring-[#3b82f6]"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="port" className="text-right text-gray-400">Port</Label>
            <Input
              id="port"
              value={formData.port}
              onChange={(e) => handleChange('port', e.target.value)}
              className="col-span-3 bg-[#1B2431] border-none text-white focus:ring-1 focus:ring-[#3b82f6]"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="user" className="text-right text-gray-400">User</Label>
            <Input
              id="user"
              value={formData.user}
              onChange={(e) => handleChange('user', e.target.value)}
              className="col-span-3 bg-[#1B2431] border-none text-white focus:ring-1 focus:ring-[#3b82f6]"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right text-gray-400">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="col-span-3 bg-[#1B2431] border-none text-white focus:ring-1 focus:ring-[#3b82f6]"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="database" className="text-right text-gray-400">Database</Label>
            <Input
              id="database"
              value={formData.database}
              onChange={(e) => handleChange('database', e.target.value)}
              className="col-span-3 bg-[#1B2431] border-none text-white focus:ring-1 focus:ring-[#3b82f6]"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between items-center">
          <div className="flex items-center text-xs text-gray-500">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1 cursor-help hover:text-gray-300 transition-colors">
                  <Info className="w-3 h-3" />
                  Secure Storage
                </TooltipTrigger>
                <TooltipContent className="bg-[#1B2431] border-none text-white">
                  <p>Credentials are encrypted and stored locally.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing}
              className={`border-none bg-[#1B2431] hover:bg-[#1B2431]/80 text-white ${testStatus === 'success' ? 'text-green-400' : ''}`}
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {testStatus === 'success' ? 'Success' : 'Test Connection'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={testStatus !== 'success'}
              className="bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
