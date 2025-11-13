import { useState } from 'react';

import { Trans } from '@lingui/react/macro';
import { WorkOrderStatus } from '@prisma/client';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  Phone,
  User,
  XCircle,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';

import { trpc } from '@documenso/trpc/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@documenso/ui/primitives/alert-dialog';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@documenso/ui/primitives/card';
import { Label } from '@documenso/ui/primitives/label';
import { Textarea } from '@documenso/ui/primitives/textarea';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { useCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags('Work Order Details');
}

const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.DRAFT]: 'bg-gray-500',
  [WorkOrderStatus.PENDING_APPROVAL]: 'bg-yellow-500',
  [WorkOrderStatus.APPROVED_BY_HQ]: 'bg-blue-500',
  [WorkOrderStatus.SIGNED_BY_CONTRACTOR]: 'bg-green-500',
  [WorkOrderStatus.REJECTED]: 'bg-red-500',
};

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.DRAFT]: 'Draft',
  [WorkOrderStatus.PENDING_APPROVAL]: 'Pending Approval',
  [WorkOrderStatus.APPROVED_BY_HQ]: 'Approved by HQ',
  [WorkOrderStatus.SIGNED_BY_CONTRACTOR]: 'Signed by Contractor',
  [WorkOrderStatus.REJECTED]: 'Rejected',
};

export default function WorkOrderDetailPage() {
  const { toast } = useToast();
  const { id, teamUrl } = useParams();
  const team = useCurrentTeam();

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionRemarks, setRejectionRemarks] = useState('');

  const { data: workOrder, isLoading, refetch } = trpc.workOrder.get.useQuery({ id: id! });

  if (isLoading) {
    return (
      <div className="mx-auto flex h-64 w-full max-w-screen-xl items-center justify-center">
        <div className="text-muted-foreground">
          <Trans>Loading work order...</Trans>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="mx-auto flex h-64 w-full max-w-screen-xl flex-col items-center justify-center">
        <AlertCircle className="text-muted-foreground mb-4 h-12 w-12" />
        <p className="text-muted-foreground mb-4">
          <Trans>Work order not found</Trans>
        </p>
        <Link to={`/t/${teamUrl}/work-orders`}>
          <Button>
            <Trans>Back to Work Orders</Trans>
          </Button>
        </Link>
      </div>
    );
  }

  const handleApprove = async () => {
    // This would call an approve endpoint
    // For now, we'll redirect to the envelope signing page
    toast({
      title: 'Redirecting',
      description: 'Redirecting to approval page...',
    });
    // TODO: Implement approval flow
  };

  const handleReject = async () => {
    if (!rejectionRemarks.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide remarks for rejection',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Implement rejection flow via tRPC
    toast({
      title: 'Success',
      description: 'Work order rejected successfully',
    });
    setShowRejectDialog(false);
    refetch();
  };

  return (
    <div className="mx-auto w-full max-w-screen-xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-4">
            <h1 className="text-3xl font-semibold">{workOrder.workOrderNumber}</h1>
            <Badge className={STATUS_COLORS[workOrder.status as WorkOrderStatus]}>
              {STATUS_LABELS[workOrder.status as WorkOrderStatus]}
            </Badge>
          </div>
          <p className="text-muted-foreground">{workOrder.envelope.title}</p>
        </div>
        <Link to={`/t/${teamUrl}/work-orders`}>
          <Button variant="outline">
            <Trans>Back to List</Trans>
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Site Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <Trans>Site Information</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-muted-foreground">
                  <Trans>Site Name</Trans>
                </Label>
                <p className="font-medium">{workOrder.site.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  <Trans>Site Code</Trans>
                </Label>
                <p className="font-medium">{workOrder.site.code}</p>
              </div>
              {workOrder.site.location && (
                <div>
                  <Label className="text-muted-foreground">
                    <Trans>Location</Trans>
                  </Label>
                  <p className="font-medium">{workOrder.site.location}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contractor Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <Trans>Contractor Information</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-muted-foreground">
                  <Trans>Name</Trans>
                </Label>
                <p className="font-medium">{workOrder.contractor.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  <Trans>Phone</Trans>
                </Label>
                <p className="font-medium">{workOrder.contractor.phone}</p>
              </div>
              {workOrder.contractor.email && (
                <div>
                  <Label className="text-muted-foreground">
                    <Trans>Email</Trans>
                  </Label>
                  <p className="font-medium">{workOrder.contractor.email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <Trans>Timeline</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-muted-foreground">
                  <Trans>Created</Trans>
                </Label>
                <p className="font-medium">
                  {new Date(workOrder.createdAt).toLocaleString()}
                </p>
              </div>
              {workOrder.approvedAt && (
                <div>
                  <Label className="text-muted-foreground">
                    <Trans>Approved</Trans>
                  </Label>
                  <p className="font-medium">
                    {new Date(workOrder.approvedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {workOrder.signedAt && (
                <div>
                  <Label className="text-muted-foreground">
                    <Trans>Signed by Contractor</Trans>
                  </Label>
                  <p className="font-medium">
                    {new Date(workOrder.signedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {workOrder.rejectedAt && (
                <div>
                  <Label className="text-muted-foreground">
                    <Trans>Rejected</Trans>
                  </Label>
                  <p className="font-medium">
                    {new Date(workOrder.rejectedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approvers Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <Trans>Approvers</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workOrder.envelope.recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="border-border flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{recipient.name || recipient.email}</p>
                    <p className="text-muted-foreground text-sm">{recipient.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {recipient.signingStatus === 'SIGNED' && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        <Trans>Signed</Trans>
                      </Badge>
                    )}
                    {recipient.signingStatus === 'REJECTED' && (
                      <Badge className="bg-red-500">
                        <XCircle className="mr-1 h-3 w-3" />
                        <Trans>Rejected</Trans>
                      </Badge>
                    )}
                    {recipient.signingStatus === 'NOT_SIGNED' && (
                      <Badge variant="outline">
                        <Trans>Pending</Trans>
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            <Trans>Document Actions</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>View, approve, or reject the work order document</Trans>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link to={`/t/${teamUrl}/documents/${workOrder.envelope.id}`}>
              <Button>
                <FileText className="-ml-1 mr-2 h-4 w-4" />
                <Trans>View Document</Trans>
              </Button>
            </Link>

            {workOrder.status === WorkOrderStatus.PENDING_APPROVAL && (
              <>
                <Button variant="default" onClick={handleApprove}>
                  <CheckCircle className="-ml-1 mr-2 h-4 w-4" />
                  <Trans>Approve & Sign</Trans>
                </Button>
                <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>
                  <XCircle className="-ml-1 mr-2 h-4 w-4" />
                  <Trans>Reject</Trans>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Trans>Reject Work Order</Trans>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans>
                Please provide remarks explaining why you are rejecting this work order. The
                contracts team will be notified.
              </Trans>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="remarks">
              <Trans>Remarks</Trans> *
            </Label>
            <Textarea
              id="remarks"
              value={rejectionRemarks}
              onChange={(e) => setRejectionRemarks(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Trans>Cancel</Trans>
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleReject}>
              <Trans>Confirm Rejection</Trans>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
