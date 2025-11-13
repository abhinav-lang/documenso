import { Trans } from '@lingui/react/macro';
import { MapPin, Users } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router';

import { trpc } from '@documenso/trpc/react';
import { Badge } from '@documenso/ui/primitives/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@documenso/ui/primitives/card';
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
  return appMetaTags('Sites Management');
}

export default function SitesManagementPage() {
  const team = useCurrentTeam();
  const { teamUrl } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page') || '1');
  const perPage = Number(searchParams.get('perPage') || '10');

  const { data, isLoading } = trpc.workOrder.getSites.useQuery({
    page,
    perPage,
  });

  const sites = data?.sites || [];
  const totalPages = data?.totalPages || 0;
  const currentPage = data?.page || 1;

  return (
    <div className="mx-auto w-full max-w-screen-xl">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">
          <Trans>Sites Management</Trans>
        </h1>
        <p className="text-muted-foreground mt-2">
          <Trans>View and manage all sites</Trans>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Trans>All Sites</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>List of all sites with assigned users and work order count</Trans>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-muted-foreground">
                <Trans>Loading sites...</Trans>
              </div>
            </div>
          ) : sites.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <MapPin className="text-muted-foreground mb-4 h-12 w-12" />
              <p className="text-muted-foreground mb-4">
                <Trans>No sites found</Trans>
              </p>
              <p className="text-muted-foreground text-sm">
                <Trans>Contact your administrator to create sites</Trans>
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Trans>Site Name</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Code</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Location</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Assigned Users</Trans>
                    </TableHead>
                    <TableHead>
                      <Trans>Work Orders</Trans>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="font-medium">{site.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{site.code}</Badge>
                      </TableCell>
                      <TableCell>
                        {site.location || (
                          <span className="text-muted-foreground text-sm">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="text-muted-foreground h-4 w-4" />
                          <span>{site.siteUsers.length} users</span>
                        </div>
                        {site.siteUsers.length > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            {site.siteUsers
                              .slice(0, 2)
                              .map((su) => su.user.email)
                              .join(', ')}
                            {site.siteUsers.length > 2 && ` +${site.siteUsers.length - 2} more`}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge>{site._count.workOrders}</Badge>
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
