import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  ArrowRight,
  ArrowLeft,
  Check,
  Database,
  Table2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { PermissionSelector } from './PermissionSelector';
import type { Connection, PermissionState, WizardStep, CreateViewerData } from '../types';

interface CreateViewerWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connections: Connection[];
  onSubmit: (data: CreateViewerData) => void;
  isSubmitting?: boolean;
}

const STEPS: { id: WizardStep; title: string; description: string }[] = [
  {
    id: 'details',
    title: 'Viewer Details',
    description: 'Enter the basic information for the new viewer',
  },
  {
    id: 'connections',
    title: 'Connection Access',
    description: 'Select which database connections they can access',
  },
  {
    id: 'tables',
    title: 'Table Permissions',
    description: 'Fine-tune access at the table level',
  },
  {
    id: 'review',
    title: 'Review & Create',
    description: 'Review the viewer details and permissions',
  },
];

export function CreateViewerWizard({
  open,
  onOpenChange,
  connections,
  onSubmit,
  isSubmitting = false,
}: CreateViewerWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('details');
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });
  const [permissions, setPermissions] = useState<PermissionState>({
    connectionAccess: {},
    tablePermissions: {},
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'details') {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
    }

    if (currentStep === 'connections') {
      const hasAccess = Object.values(permissions.connectionAccess).some(
        (access) => access !== 'none'
      );
      if (!hasAccess) {
        newErrors.connections = 'Please grant access to at least one connection';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if email already exists in the system
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const response = await api.post('/viewers/identity-check', { email });
      // If identityStatus is 'existing_viewer', the email already exists
      return response.data.data?.identityStatus === 'existing_viewer';
    } catch {
      // If check fails, return false and let the create endpoint handle it
      return false;
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    // On details step, validate email doesn't already exist
    if (currentStep === 'details') {
      setIsValidatingEmail(true);
      try {
        const emailExists = await checkEmailExists(formData.email);
        if (emailExists) {
          setErrors({ email: 'A user with this email already exists' });
          setIsValidatingEmail(false);
          return;
        }
      } catch {
        // Continue if check fails, the create endpoint will validate
      } finally {
        setIsValidatingEmail(false);
      }
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const handleSubmit = () => {
    if (!validateStep()) return;

    onSubmit({
      email: formData.email,
      name: formData.name,
      permissions,
    });
  };

  const handleClose = () => {
    // Reset state
    setCurrentStep('details');
    setFormData({ email: '', name: '' });
    setPermissions({ connectionAccess: {}, tablePermissions: {} });
    setErrors({});
    onOpenChange(false);
  };

  const getPermissionSummary = () => {
    const connectionCount = Object.values(permissions.connectionAccess).filter(
      (access) => access !== 'none'
    ).length;

    const tableCount = Object.values(permissions.tablePermissions).filter(
      (perm) => perm.read || perm.write
    ).length;

    const writeCount = Object.values(permissions.tablePermissions).filter(
      (perm) => perm.write
    ).length;

    return { connectionCount, tableCount, writeCount };
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-[95vw] gap-0 overflow-hidden border-white/10 bg-[#0f0f17] p-0 max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b border-white/[0.06] p-6 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-white">
            Add New Viewer
          </DialogTitle>

          {/* Progress Steps */}
          <div className="mt-6 flex items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all',
                    currentStepIndex > index
                      ? 'bg-emerald-500 text-white'
                      : currentStepIndex === index
                        ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                        : 'bg-white/[0.05] text-slate-500'
                  )}
                >
                  {currentStepIndex > index ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    'hidden text-sm sm:block',
                    currentStepIndex >= index ? 'text-white' : 'text-slate-500'
                  )}
                >
                  {step.title}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-8 rounded-full',
                      currentStepIndex > index
                        ? 'bg-emerald-500'
                        : 'bg-white/[0.08]'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Details */}
            {currentStep === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">
                    {STEPS[0].title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {STEPS[0].description}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className={cn(
                          'pl-10 border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500',
                          errors.name && 'border-red-500/50'
                        )}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-red-400">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className={cn(
                          'pl-10 border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500',
                          errors.email && 'border-red-500/50'
                        )}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-400">{errors.email}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      An invitation email will be sent to this address
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Connections */}
            {currentStep === 'connections' && (
              <motion.div
                key="connections"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">
                    {STEPS[1].title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {STEPS[1].description}
                  </p>
                </div>

                {errors.connections && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                    <p className="text-sm text-red-400">{errors.connections}</p>
                  </div>
                )}

                <PermissionSelector
                  connections={connections}
                  permissions={permissions}
                  onChange={setPermissions}
                  mode="connections"
                />
              </motion.div>
            )}

            {/* Step 3: Tables */}
            {currentStep === 'tables' && (
              <motion.div
                key="tables"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">
                    {STEPS[2].title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {STEPS[2].description}
                  </p>
                </div>

                <PermissionSelector
                  connections={connections.filter(
                    (c) => permissions.connectionAccess[c.id] !== 'none'
                  )}
                  permissions={permissions}
                  onChange={setPermissions}
                  mode="tables"
                />
              </motion.div>
            )}

            {/* Step 4: Review */}
            {currentStep === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">
                    {STEPS[3].title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {STEPS[3].description}
                  </p>
                </div>

                {/* User Info Summary */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-lg font-semibold text-white">
                      {formData.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {formData.name}
                      </h4>
                      <p className="text-sm text-slate-400">{formData.email}</p>
                    </div>
                  </div>
                </div>

                {/* Permissions Summary */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20">
                        <Database className="h-5 w-5 text-violet-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {getPermissionSummary().connectionCount}
                        </div>
                        <div className="text-sm text-slate-400">Connections</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                        <Table2 className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {getPermissionSummary().tableCount}
                        </div>
                        <div className="text-sm text-slate-400">Readable Tables</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                        <Sparkles className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {getPermissionSummary().writeCount}
                        </div>
                        <div className="text-sm text-slate-400">Writable Tables</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Note */}
                <div className="flex items-start gap-3 rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                  <Sparkles className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-300">
                      An invitation email will be sent to {formData.email} with
                      instructions to set up their account and access the
                      permitted databases.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.06] p-6 flex-shrink-0">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-white/10 text-slate-300 hover:bg-white/10"
            >
              Cancel
            </Button>

            {currentStep === 'review' ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-purple-500"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Viewer
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isValidatingEmail}
                className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-purple-500"
              >
                {isValidatingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
