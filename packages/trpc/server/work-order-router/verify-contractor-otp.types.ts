import { z } from 'zod';

import type { TrpcRouteMeta } from '../trpc';

export const verifyContractorOtpMeta: TrpcRouteMeta = {
  openapi: {
    method: 'POST',
    path: '/work-order/contractor/verify-otp',
    summary: 'Verify contractor OTP',
    description: 'Verifies the OTP and returns contractor ID',
    tags: ['Work Order'],
  },
};

export const ZVerifyContractorOtpRequestSchema = z.object({
  phone: z.string().min(1),
  otp: z.string().length(6),
});

export const ZVerifyContractorOtpResponseSchema = z.object({
  contractorId: z.string(),
  verified: z.boolean(),
});

export type TVerifyContractorOtpRequest = z.infer<typeof ZVerifyContractorOtpRequestSchema>;
export type TVerifyContractorOtpResponse = z.infer<typeof ZVerifyContractorOtpResponseSchema>;
