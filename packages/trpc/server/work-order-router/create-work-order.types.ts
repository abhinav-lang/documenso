import { z } from 'zod';

import type { TrpcRouteMeta } from '../trpc';

export const createWorkOrderMeta: TrpcRouteMeta = {
  openapi: {
    method: 'POST',
    path: '/work-order',
    summary: 'Create work order',
    description: 'Creates a new work order with envelope',
    tags: ['Work Order'],
  },
};

export const ZCreateWorkOrderRequestSchema = z.object({
  workOrderNumber: z.string().min(1),
  siteId: z.string(),
  contractorName: z.string().min(1),
  contractorPhone: z.string().min(1),
  contractorEmail: z.string().email().optional(),
  title: z.string(),
  documentDataId: z.string(),
  approverEmails: z.array(z.string().email()),
});

export const ZCreateWorkOrderResponseSchema = z.object({
  workOrderId: z.string(),
  envelopeId: z.string(),
  workOrderNumber: z.string(),
  status: z.string(),
});

export type TCreateWorkOrderRequest = z.infer<typeof ZCreateWorkOrderRequestSchema>;
export type TCreateWorkOrderResponse = z.infer<typeof ZCreateWorkOrderResponseSchema>;
