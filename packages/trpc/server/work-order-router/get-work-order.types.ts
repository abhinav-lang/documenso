import { z } from 'zod';

import type { TrpcRouteMeta } from '../trpc';

export const getWorkOrderMeta: TrpcRouteMeta = {
  openapi: {
    method: 'GET',
    path: '/work-order/{id}',
    summary: 'Get work order',
    description: 'Returns a single work order by ID',
    tags: ['Work Order'],
  },
};

export const ZGetWorkOrderRequestSchema = z.object({
  id: z.string(),
});

export const ZGetWorkOrderResponseSchema = z.object({
  id: z.string(),
  workOrderNumber: z.string(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  approvedAt: z.date().nullable(),
  signedAt: z.date().nullable(),
  rejectedAt: z.date().nullable(),
  site: z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    location: z.string().nullable(),
  }),
  contractor: z.object({
    id: z.string(),
    name: z.string(),
    phone: z.string(),
    email: z.string().nullable(),
  }),
  envelope: z.object({
    id: z.string(),
    title: z.string(),
    status: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    completedAt: z.date().nullable(),
    recipients: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
        role: z.string(),
        signingStatus: z.string(),
        signedAt: z.date().nullable(),
        rejectionReason: z.string().nullable(),
      }),
    ),
  }),
});

export type TGetWorkOrderRequest = z.infer<typeof ZGetWorkOrderRequestSchema>;
export type TGetWorkOrderResponse = z.infer<typeof ZGetWorkOrderResponseSchema>;
