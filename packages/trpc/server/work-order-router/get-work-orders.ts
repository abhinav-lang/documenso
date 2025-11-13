import { getWorkOrders } from '@documenso/lib/server-only/work-order/get-work-orders';

import { authenticatedProcedure } from '../trpc';
import {
  ZGetWorkOrdersRequestSchema,
  ZGetWorkOrdersResponseSchema,
  getWorkOrdersMeta,
} from './get-work-orders.types';

export const getWorkOrdersRoute = authenticatedProcedure
  .meta(getWorkOrdersMeta)
  .input(ZGetWorkOrdersRequestSchema)
  .output(ZGetWorkOrdersResponseSchema)
  .query(async ({ input, ctx }) => {
    const { user } = ctx;
    const { siteId, status, page, perPage, searchQuery } = input;

    return await getWorkOrders({
      userId: user.id,
      userWorkOrderRole: user.workOrderRole,
      siteId,
      status,
      page,
      perPage,
      searchQuery,
    });
  });
