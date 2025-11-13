import { useState } from 'react';

import { Trans, msg } from '@lingui/react/macro';
import { useLingui } from '@lingui/react';
import { Upload, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

import { trpc } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@documenso/ui/primitives/card';
import { Input } from '@documenso/ui/primitives/input';
import { Label } from '@documenso/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import { useToast } from '@documenso/ui/primitives/use-toast';
import { DocumentUploadButton } from '@documenso/ui/primitives/document-upload-button';

import { useCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags('Create Work Order');
}

type ApproverInput = {
  id: string;
  email: string;
};

export default function CreateWorkOrderPage() {
  const { _ } = useLingui();
  const { toast } = useToast();
  const navigate = useNavigate();
  const team = useCurrentTeam();
  const { teamUrl } = useParams();

  const [workOrderNumber, setWorkOrderNumber] = useState('');
  const [title, setTitle] = useState('');
  const [siteId, setSiteId] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [contractorPhone, setContractorPhone] = useState('');
  const [contractorEmail, setContractorEmail] = useState('');
  const [approvers, setApprovers] = useState<ApproverInput[]>([
    { id: crypto.randomUUID(), email: '' },
  ]);
  const [uploadedFile, setUploadedFile] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: sitesData } = trpc.workOrder.getSites.useQuery({
    page: 1,
    perPage: 100,
  });

  const { mutateAsync: createWorkOrder, isLoading } = trpc.workOrder.create.useMutation();

  const addApprover = () => {
    setApprovers([...approvers, { id: crypto.randomUUID(), email: '' }]);
  };

  const removeApprover = (id: string) => {
    setApprovers(approvers.filter((a) => a.id !== id));
  };

  const updateApprover = (id: string, email: string) => {
    setApprovers(approvers.map((a) => (a.id === id ? { ...a, email } : a)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedFile) {
      toast({
        title: 'Error',
        description: 'Please upload a work order document',
        variant: 'destructive',
      });
      return;
    }

    const validApprovers = approvers.filter((a) => a.email.trim() !== '');
    if (validApprovers.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one approver',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await createWorkOrder({
        workOrderNumber,
        title,
        siteId,
        contractorName,
        contractorPhone,
        contractorEmail: contractorEmail || undefined,
        documentDataId: uploadedFile.id,
        approverEmails: validApprovers.map((a) => a.email),
      });

      toast({
        title: 'Success',
        description: `Work order ${result.workOrderNumber} created successfully`,
      });

      navigate(`/t/${teamUrl}/work-orders/${result.workOrderId}`);
    } catch (error) {
      console.error('Error creating work order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create work order. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-screen-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">
          <Trans>Create Work Order</Trans>
        </h1>
        <p className="text-muted-foreground mt-2">
          <Trans>Create a new work order and assign it to site, contractor, and approvers</Trans>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans>Work Order Details</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Enter the work order information and upload the document</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Work Order Number */}
            <div className="space-y-2">
              <Label htmlFor="workOrderNumber">
                <Trans>Work Order Number</Trans> *
              </Label>
              <Input
                id="workOrderNumber"
                value={workOrderNumber}
                onChange={(e) => setWorkOrderNumber(e.target.value)}
                placeholder="WO-2024-001"
                required
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                <Trans>Title</Trans> *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Electrical Work - Building A"
                required
              />
            </div>

            {/* Document Upload */}
            <div className="space-y-2">
              <Label>
                <Trans>Work Order Document</Trans> *
              </Label>
              {uploadedFile ? (
                <div className="border-input flex items-center justify-between rounded-md border p-4">
                  <div className="flex items-center gap-2">
                    <Upload className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">{uploadedFile.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <DocumentUploadButton
                  onUploadSuccess={(file) => {
                    setUploadedFile({ id: file.id, name: file.name });
                  }}
                  type="button"
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="-ml-1 mr-2 h-4 w-4" />
                  <Trans>Upload Document</Trans>
                </DocumentUploadButton>
              )}
            </div>

            {/* Site Selection */}
            <div className="space-y-2">
              <Label htmlFor="site">
                <Trans>Site</Trans> *
              </Label>
              <Select value={siteId} onValueChange={setSiteId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {sitesData?.sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name} ({site.code})
                      {site.location && ` - ${site.location}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sitesData?.sites.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  <Trans>No sites available. Please create a site first.</Trans>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              <Trans>Contractor Details</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Enter contractor information (will be created if new)</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contractorName">
                <Trans>Contractor Name</Trans> *
              </Label>
              <Input
                id="contractorName"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                placeholder="John Contractor"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractorPhone">
                <Trans>Phone Number</Trans> * <span className="text-muted-foreground text-xs">(with country code)</span>
              </Label>
              <Input
                id="contractorPhone"
                type="tel"
                value={contractorPhone}
                onChange={(e) => setContractorPhone(e.target.value)}
                placeholder="+919876543210"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractorEmail">
                <Trans>Email</Trans> <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="contractorEmail"
                type="email"
                value={contractorEmail}
                onChange={(e) => setContractorEmail(e.target.value)}
                placeholder="john@contractor.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              <Trans>Approvers</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Add email addresses of approvers who will review this work order</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {approvers.map((approver, index) => (
              <div key={approver.id} className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`approver-${approver.id}`}>
                    <Trans>Approver {index + 1} Email</Trans> *
                  </Label>
                  <Input
                    id={`approver-${approver.id}`}
                    type="email"
                    value={approver.email}
                    onChange={(e) => updateApprover(approver.id, e.target.value)}
                    placeholder="approver@company.com"
                    required
                  />
                </div>
                {approvers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeApprover(approver.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addApprover}>
              <Trans>Add Another Approver</Trans>
            </Button>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/t/${teamUrl}/work-orders`)}
          >
            <Trans>Cancel</Trans>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Trans>Creating...</Trans> : <Trans>Create Work Order</Trans>}
          </Button>
        </div>
      </form>
    </div>
  );
}
