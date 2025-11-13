import { useEffect, useMemo, useState } from 'react';

import { Trans, msg } from '@lingui/react/macro';
import { useLingui } from '@lingui/react';
import { WorkOrderStatus } from '@prisma/client';
import { Plus } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router';
import { z } from 'zod';

import { formatTeamUrl } from '@documenso/lib/utils/teams';
import { trpc } from '@documenso/trpc/react';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@documenso/ui/primitives/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@documenso/ui/primitives/table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';

import { useCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags('Work Orders');
}

const ZSearchParamsSchema = z.object({
  status: z.nativeEnum(WorkOrderStatus).optional(),
  siteId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().default(10),
  searchQuery: z.string().optional(),
});

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

export default function WorkOrdersPage() {
  const { _ } = useLingui();
  const team = useCurrentTeam();
  const { teamUrl } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const parsedParams = useMemo(
    () => ZSearchParamsSchema.safeParse(Object.fromEntries(searchParams.entries())).data || {},
    [searchParams],
  );

  const { data, isLoading } = trpc.workOrder.getMany.useQuery({
    ...parsedParams,
  });

  const { data: sitesData } = trpc.workOrder.getSites.useQuery({
    page: 1,
    perPage: 100,
  });

  const handleStatusFilter = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'ALL') {
      params.delete('status');
    } else {
      params.set('status', value);
    }
    params.delete('page');
    setSearchParams(params);
  };

  const handleSiteFilter = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'ALL') {
      params.delete('siteId');
    } else {
      params.set('siteId', value);
    }
    params.delete('page');
    setSearchParams(params);
  };

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set('searchQuery', query);
    } else {
      params.delete('searchQuery');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const workOrders = data?.workOrders || [];
  const totalPages = data?.totalPages || 0;
  const currentPage = data?.page || 1;

  return (
    <div className="mx-auto w-full max-w-screen-xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">
            <Trans>Work Orders</Trans>
          </h1>
          <p className="text-muted-foreground mt-2">
            <Trans>Manage and track work orders across all sites</Trans>
          </p>
        </div>
        <Link to={`/t/${teamUrl}/work-orders/new`}>
          <Button>
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            <Trans>Create Work Order</Trans>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <Select
                value={parsedParams.status || 'ALL'}
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={parsedParams.siteId || 'ALL'}
                onValueChange={handleSiteFilter}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sites</SelectItem>
                  {sitesData?.sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name} ({site.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-auto">
              <input
                type="text"
                placeholder="Search work orders..."
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-[300px]"
                defaultValue={parsedParams.searchQuery}
                onChange={(e) => {
                  const timeoutId = setTimeout(() => handleSearch(e.target.value), 500);
                  return () => clearTimeout(timeoutId);
                }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-muted-foreground">
                <Trans>Loading work orders...</Trans>
              </div>
            </div>
          ) : workOrders.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <p className="text-muted-foreground mb-4">
                <Trans>No work orders found</Trans>
              </p>
              <Link to={`/t/${teamUrl}/work-orders/new`}>
                <Button>
                  <Plus className="-ml-1 mr-2 h-4 w-4" />
                  <Trans>Create your first work order</Trans>
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">
                      <Trans>Sr. No.</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Work Order</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Site</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Contractor</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Status</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Created</Trans>
                    </TableHead>
                    <TableHead className="w-[100px]">
                      <Trans>Actions</Trans>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrders.map((workOrder, index) => (
                    <TableRow key={workOrder.id}>
                      <TableCell className="font-medium">
                        {(currentPage - 1) * (data?.perPage || 10) + index + 1}
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/t/${teamUrl}/work-orders/${workOrder.id}`}
                          className="hover:underline"
                        >
                          <div className="font-medium">{workOrder.workOrderNumber}</div>
                          <div className="text-muted-foreground text-sm">
                            {workOrder.envelope.title}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>{workOrder.site.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {workOrder.site.code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{workOrder.contractor.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {workOrder.contractor.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={STATUS_COLORS[workOrder.status]}
                        >
                          {STATUS_LABELS[workOrder.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(workOrder.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(workOrder.createdAt).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link to={`/t/${teamUrl}/work-orders/${workOrder.id}`}>
                          <Button variant="outline" size="sm">
                            <Trans>View</Trans>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4">
                  <DataTablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    perPage={data?.perPage || 10}
                    totalCount={data?.totalCount || 0}
                    onPageChange={(page) => {
                      const params = new URLSearchParams(searchParams);
                      params.set('page', page.toString());
                      setSearchParams(params);
                    }}
                    onPerPageChange={(perPage) => {
                      const params = new URLSearchParams(searchParams);
                      params.set('perPage', perPage.toString());
                      params.delete('page');
                      setSearchParams(params);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
