import { router } from '../trpc';
import { createWorkOrderRoute } from './create-work-order';
import { getSitesRoute } from './get-sites';
import { getWorkOrderRoute } from './get-work-order';
import { getWorkOrdersRoute } from './get-work-orders';
import { requestContractorOtpRoute } from './request-contractor-otp';
import { verifyContractorOtpRoute } from './verify-contractor-otp';

export const workOrderRouter = router({
  create: createWorkOrderRoute,
  get: getWorkOrderRoute,
  getMany: getWorkOrdersRoute,
  getSites: getSitesRoute,
  requestContractorOtp: requestContractorOtpRoute,
  verifyContractorOtp: verifyContractorOtpRoute,
});
