import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Loader2,
  Info,
  Database,
  Zap,
  Cloud,
  Leaf,
  Table,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Snowflake,
  Check
} from 'lucide-react';
import { useConnections } from '@/hooks/useConnections';
import { cn } from '@/lib/utils';

const DB_PROVIDERS = [
  {
    id: 'supabase',
    name: 'Supabase',
    type: 'postgres',
    icon: Zap,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/20',
    hoverBorder: 'hover:border-emerald-400/50',
    description: 'Postgres database with realtime capabilities'
  },
  {
    id: 'rds',
    name: 'Amazon RDS',
    type: 'postgres',
    icon: Cloud,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20',
    hoverBorder: 'hover:border-purple-400/50',
    description: 'Managed relational database service'
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    type: 'mongodb',
    icon: Leaf,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    hoverBorder: 'hover:border-green-500/50',
    description: 'NoSQL document database'
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    type: 'postgres',
    icon: Database,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
    hoverBorder: 'hover:border-blue-400/50',
    description: 'Advanced open source relational database'
  },
  {
    id: 'mysql',
    name: 'MySQL',
    type: 'mysql',
    icon: Table,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400/20',
    hoverBorder: 'hover:border-orange-400/50',
    description: 'Popular open source relational database'
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    type: 'postgres', // Mapping to postgres for now as generic SQL interface
    icon: Snowflake,
    color: 'text-sky-400',
    bgColor: 'bg-sky-400/10',
    borderColor: 'border-sky-400/20',
    hoverBorder: 'hover:border-sky-400/50',
    description: 'Cloud data platform'
  }
];

const STEPS = [
  {
    title: 'Select Provider',
    description: 'Choose your database type'
  },
  {
    title: 'Configuration',
    description: 'Enter connection details'
  },
  {
    title: 'Review & Connect',
    description: 'Test and save connection'
  }
];

export function AddConnectionDialog({ onConnectionAdded }: { onConnectionAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<typeof DB_PROVIDERS[0] | null>(null);
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

  const handleProviderSelect = (provider: typeof DB_PROVIDERS[0]) => {
    setSelectedProvider(provider);
    setFormData(prev => ({
      ...prev,
      type: provider.type,
      name: provider.name === 'Supabase' || provider.name === 'Amazon RDS' ? `${provider.name} DB` : prev.name
    }));
    setStep(2);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTestStatus('idle');
  };

  const handleTest = async () => {
    setTesting(true);
    setTestStatus('idle');
    try {
      await testConnection(formData);
      setTestStatus('success');
      if (step === 2) setStep(3);
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
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setSelectedProvider(null);
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

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Small delay to reset form after animation
      setTimeout(resetForm, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4 mr-2" />
          Add Connection
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#273142] border-none text-white sm:max-w-5xl shadow-2xl p-0 overflow-hidden gap-0 flex h-[600px]">

        {/* Left Sidebar - Stepper */}
        <div className="w-[240px] bg-[#1B2431] border-r border-gray-800 p-6 flex flex-col">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white">Add Connection</h2>
            <p className="text-xs text-gray-400 mt-1">Follow the steps to connect your database</p>
          </div>

          <div className="space-y-8 relative">
            {/* Vertical Line Background */}
            <div className="absolute left-[11px] top-2 bottom-2 w-[1px] bg-gray-800" />

            {STEPS.map((s, i) => {
              const stepNum = i + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum || (stepNum === 3 && testStatus === 'success');

              return (
                <div key={i} className="relative flex gap-4 items-start">
                  <div className={cn(
                    "relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs border transition-colors duration-200",
                    isActive ? "bg-[#3b82f6] border-[#3b82f6] text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]" :
                      isCompleted ? "bg-green-500 border-green-500 text-white" :
                        "bg-[#1B2431] border-gray-600 text-gray-400"
                  )}>
                    {isCompleted ? <Check className="w-3 h-3" /> : stepNum}
                  </div>
                  <div className="pt-0.5">
                    <p className={cn(
                      "text-sm font-medium transition-colors duration-200",
                      isActive ? "text-white" :
                        isCompleted ? "text-green-400" : "text-gray-400"
                    )}>
                      {s.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-6 border-t border-gray-800">
            <div className="flex items-center text-xs text-gray-500">
              <Info className="w-3 h-3 mr-2 text-gray-400" />
              <span className="text-gray-400">Secure Storage</span>
            </div>
            <p className="text-[10px] text-gray-600 mt-1 pl-5">
              Credentials are encrypted and stored locally on your device.
            </p>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col bg-[#273142]">
          <div className="p-6 border-b border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                {step > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 mr-2 hover:bg-gray-800 rounded-full -ml-2"
                    onClick={() => setStep(step - 1)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                {step === 1 ? 'Select Database Provider' :
                  step === 2 ? `Configure ${selectedProvider?.name}` :
                    'Review & Connect'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {step === 1 ? 'Choose the type of database you want to connect to.' :
                  step === 2 ? 'Enter your connection details below.' :
                    'Test your connection and save.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {step === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DB_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderSelect(provider)}
                    className={cn(
                      "flex flex-col items-start p-5 rounded-xl border transition-all duration-200 group text-left h-full",
                      "bg-[#1B2431] hover:bg-[#1f2937]",
                      provider.borderColor,
                      provider.hoverBorder
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-lg mb-4 transition-transform group-hover:scale-110 duration-200",
                      provider.bgColor
                    )}>
                      <provider.icon className={cn("w-6 h-6", provider.color)} />
                    </div>
                    <h3 className="text-base font-medium text-white mb-1">{provider.name}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2">{provider.description}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6 max-w-2xl mx-auto">
                {/* Connection Form */}
                <div className="grid gap-6">
                  {/* Row 1: Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-400">Connection Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="bg-[#1B2431] border-gray-800 text-white focus:ring-1 focus:ring-[#3b82f6] h-11"
                      placeholder="e.g. Production DB"
                    />
                  </div>

                  {/* Row 2: Host & Port */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="host" className="text-gray-400">Host</Label>
                      <Input
                        id="host"
                        value={formData.host}
                        onChange={(e) => handleChange('host', e.target.value)}
                        className="bg-[#1B2431] border-gray-800 text-white focus:ring-1 focus:ring-[#3b82f6] h-11"
                        placeholder="localhost"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port" className="text-gray-400">Port</Label>
                      <Input
                        id="port"
                        value={formData.port}
                        onChange={(e) => handleChange('port', e.target.value)}
                        className="bg-[#1B2431] border-gray-800 text-white focus:ring-1 focus:ring-[#3b82f6] h-11"
                        placeholder="5432"
                      />
                    </div>
                  </div>

                  {/* Row 3: User & Password */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="user" className="text-gray-400">Username</Label>
                      <Input
                        id="user"
                        value={formData.user}
                        onChange={(e) => handleChange('user', e.target.value)}
                        className="bg-[#1B2431] border-gray-800 text-white focus:ring-1 focus:ring-[#3b82f6] h-11"
                        placeholder="postgres"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-400">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        className="bg-[#1B2431] border-gray-800 text-white focus:ring-1 focus:ring-[#3b82f6] h-11"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Row 4: Database */}
                  <div className="space-y-2">
                    <Label htmlFor="database" className="text-gray-400">Database Name</Label>
                    <Input
                      id="database"
                      value={formData.database}
                      onChange={(e) => handleChange('database', e.target.value)}
                      className="bg-[#1B2431] border-gray-800 text-white focus:ring-1 focus:ring-[#3b82f6] h-11"
                      placeholder="postgres"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {step >= 2 && (
            <div className="p-6 bg-[#1B2431]/50 border-t border-gray-800 flex justify-end items-center gap-3">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing}
                className={cn(
                  "border-gray-700 bg-transparent hover:bg-gray-800 text-white min-w-[140px]",
                  testStatus === 'success' && "border-green-500/50 text-green-400 hover:text-green-300 hover:bg-green-500/10",
                  testStatus === 'error' && "border-red-500/50 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                )}
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Testing...
                  </>
                ) : testStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Connected
                  </>
                ) : testStatus === 'error' ? (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Failed
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={testStatus !== 'success'}
                className="bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
              >
                Save & Finish
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
