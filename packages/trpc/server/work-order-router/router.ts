import { router } from '../trpc';
import { createWorkOrderRoute } from './create-work-order';
import { getSitesRoute } from './get-sites';
import { getWorkOrdersRoute } from './get-work-orders';

export const workOrderRouter = router({
  create: createWorkOrderRoute,
  getMany: getWorkOrdersRoute,
  getSites: getSitesRoute,
});
