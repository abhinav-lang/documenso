import { z } from 'zod';

import type { TrpcRouteMeta } from '../trpc';

export const requestContractorOtpMeta: TrpcRouteMeta = {
  openapi: {
    method: 'POST',
    path: '/work-order/contractor/request-otp',
    summary: 'Request contractor OTP',
    description: 'Sends an OTP to the contractor phone number',
    tags: ['Work Order'],
  },
};

export const ZRequestContractorOtpRequestSchema = z.object({
  phone: z.string().min(1),
});

export const ZRequestContractorOtpResponseSchema = z.object({
  success: z.boolean(),
});

export type TRequestContractorOtpRequest = z.infer<typeof ZRequestContractorOtpRequestSchema>;
export type TRequestContractorOtpResponse = z.infer<typeof ZRequestContractorOtpResponseSchema>;
