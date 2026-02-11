import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  CreditCard,
  Calendar,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Crown,
  Sparkles,
  Zap,
  ArrowUpRight,
  RefreshCw,
  Infinity,
} from 'lucide-react';
import { usageService, type SubscriptionInfo, type PaymentRecord } from '@/services/usage.service';
import { useSubscriptionQuery, usePaymentsQuery, useCancelSubscriptionMutation } from '@/hooks/useQueries';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ============================================
// BILLING PAGE
// Subscription management and payment history
// ============================================

function SubscriptionCard({
  subscription,
  planType,
  isReadOnly,
  onCancel,
  isCancelling
}: {
  subscription: SubscriptionInfo | null;
  planType: string;
  isReadOnly: boolean;
  onCancel: () => void;
  isCancelling: boolean;
}) {
  const navigate = useNavigate();

  const getPlanIcon = () => {
    switch (planType) {
      case 'pro': return <Crown className="w-5 h-5" />;
      case 'lifetime': return <Sparkles className="w-5 h-5" />;
      case 'enterprise': return <Sparkles className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const getPlanColor = () => {
    switch (planType) {
      case 'pro': return 'text-blue-400 bg-blue-500/20';
      case 'lifetime': return 'text-purple-400 bg-purple-500/20';
      case 'enterprise': return 'text-amber-400 bg-amber-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusBadge = () => {
    if (!subscription) {
      return <Badge variant="outline" className="bg-gray-500/20 text-gray-400">Free Tier</Badge>;
    }

    switch (subscription.status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">Cancelled</Badge>;
      case 'past_due':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Past Due</Badge>;
      default:
        return <Badge variant="outline">{subscription.status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', getPlanColor())}>
              {getPlanIcon()}
            </div>
            <div>
              <CardTitle className="text-xl capitalize">{planType} Plan</CardTitle>
              <CardDescription>
                {subscription?.isLifetime ? 'Lifetime access' : 'Current subscription'}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription Details */}
        {subscription && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-lg font-semibold">
                ${subscription.amount} {subscription.currency}
                {!subscription.isLifetime && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
              </p>
            </div>
            {!subscription.isLifetime && subscription.currentPeriodEnd && (
              <div>
                <p className="text-sm text-muted-foreground">Next billing date</p>
                <p className="text-lg font-semibold">
                  {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                </p>
              </div>
            )}
            {subscription.isLifetime && (
              <div>
                <p className="text-sm text-muted-foreground">Access</p>
                <p className="text-lg font-semibold flex items-center gap-1">
                  <Infinity className="w-4 h-4" /> Lifetime
                </p>
              </div>
            )}
          </div>
        )}

        {/* Read-only Warning */}
        {isReadOnly && (
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-500">Usage Limits Reached</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You've reached your free tier limits. Upgrade to continue making changes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Notice */}
        {subscription?.cancelAtPeriodEnd && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <p className="font-medium text-red-400">Subscription Ending</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your subscription will end on {subscription.currentPeriodEnd && format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}.
                  You'll be downgraded to the Free plan.
                </p>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {planType === 'free' || isReadOnly ? (
            <Button onClick={() => navigate('/dashboard/pricing')}>
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate('/dashboard/pricing')}>
                Change Plan
              </Button>
              {subscription && !subscription.isLifetime && !subscription.cancelAtPeriodEnd && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isCancelling}>
                      {isCancelling ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Subscription'
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your subscription will remain active until the end of your current billing period.
                        After that, you'll be downgraded to the Free plan with limited features.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction onClick={onCancel} className="bg-red-500 hover:bg-red-600">
                        Yes, Cancel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentHistoryTable({
  payments,
  isLoading
}: {
  payments: PaymentRecord[];
  isLoading: boolean;
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No payment history yet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Receipt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>
              {format(new Date(payment.createdAt), 'MMM d, yyyy')}
            </TableCell>
            <TableCell>
              <span className="capitalize">{payment.planType}</span> Plan
              {payment.description && (
                <span className="text-muted-foreground text-sm ml-2">
                  - {payment.description}
                </span>
              )}
            </TableCell>
            <TableCell className="font-medium">
              ${payment.amount.toFixed(2)} {payment.currency}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getStatusIcon(payment.status)}
                <span className="capitalize">{payment.status}</span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              {payment.receiptUrl ? (
                <Button variant="ghost" size="sm" asChild>
                  <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-1" />
                    Receipt
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function BillingPage() {
  // TanStack Query hooks
  const { data: subscriptionData, isLoading, refetch: refetchSubscription } = useSubscriptionQuery();
  const { data: paymentsData, isLoading: isPaymentsLoading } = usePaymentsQuery();
  const cancelMutation = useCancelSubscriptionMutation();

  const subscription: SubscriptionInfo | null = subscriptionData?.data?.subscription || null;
  const planType: string = subscriptionData?.data?.planType || 'free';
  const isReadOnly: boolean = subscriptionData?.data?.isReadOnly || false;
  const payments: PaymentRecord[] = paymentsData?.data || [];
  const isCancelling = cancelMutation.isPending;

  const handleCancelSubscription = async () => {
    try {
      const result = await cancelMutation.mutateAsync();
      if (result.success) {
        toast.success('Subscription will be cancelled at the end of your billing period');
        refetchSubscription();
      } else {
        toast.error(result.message || 'Failed to cancel subscription');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <Skeleton className="h-64 w-full mb-8" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and view payment history
        </p>
      </div>

      {/* Subscription Card */}
      <div className="mb-8">
        <SubscriptionCard
          subscription={subscription}
          planType={planType}
          isReadOnly={isReadOnly}
          onCancel={handleCancelSubscription}
          isCancelling={isCancelling}
        />
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <CardTitle>Payment History</CardTitle>
          </div>
          <CardDescription>
            View your past payments and download receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentHistoryTable payments={payments} isLoading={isPaymentsLoading} />
        </CardContent>
      </Card>

      {/* Help */}
      <div className="mt-8 p-4 rounded-lg bg-muted/50 text-center">
        <p className="text-sm text-muted-foreground">
          Need help with billing? <a href="/contact" className="text-primary hover:underline">Contact our support team</a>
        </p>
      </div>
    </div>
  );
}
