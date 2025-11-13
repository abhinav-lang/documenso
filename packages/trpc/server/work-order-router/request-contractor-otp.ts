import { requestContractorOTP } from '@documenso/lib/server-only/work-order/contractor-otp';

import { publicProcedure } from '../trpc';
import {
  ZRequestContractorOtpRequestSchema,
  ZRequestContractorOtpResponseSchema,
  requestContractorOtpMeta,
} from './request-contractor-otp.types';

export const requestContractorOtpRoute = publicProcedure
  .meta(requestContractorOtpMeta)
  .input(ZRequestContractorOtpRequestSchema)
  .output(ZRequestContractorOtpResponseSchema)
  .mutation(async ({ input }) => {
    const { phone } = input;

    return await requestContractorOTP(phone);
  });
