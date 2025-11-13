import { verifyContractorOTP } from '@documenso/lib/server-only/work-order/contractor-otp';

import { publicProcedure } from '../trpc';
import {
  ZVerifyContractorOtpRequestSchema,
  ZVerifyContractorOtpResponseSchema,
  verifyContractorOtpMeta,
} from './verify-contractor-otp.types';

export const verifyContractorOtpRoute = publicProcedure
  .meta(verifyContractorOtpMeta)
  .input(ZVerifyContractorOtpRequestSchema)
  .output(ZVerifyContractorOtpResponseSchema)
  .mutation(async ({ input }) => {
    const { phone, otp } = input;

    return await verifyContractorOTP(phone, otp);
  });
