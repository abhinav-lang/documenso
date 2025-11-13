import { getWorkOrder } from '@documenso/lib/server-only/work-order/get-work-order';

import { authenticatedProcedure } from '../trpc';
import {
  ZGetWorkOrderRequestSchema,
  ZGetWorkOrderResponseSchema,
  getWorkOrderMeta,
} from './get-work-order.types';

export const getWorkOrderRoute = authenticatedProcedure
  .meta(getWorkOrderMeta)
  .input(ZGetWorkOrderRequestSchema)
  .output(ZGetWorkOrderResponseSchema)
  .query(async ({ input }) => {
    const { id } = input;

    return await getWorkOrder({ id });
  });
