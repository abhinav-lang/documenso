import { z } from 'zod';

import type { TrpcRouteMeta } from '../trpc';

export const getWorkOrdersMeta: TrpcRouteMeta = {
  openapi: {
    method: 'GET',
    path: '/work-order',
    summary: 'Get work orders',
    description: 'Returns a list of work orders with filtering',
    tags: ['Work Order'],
  },
};

export const ZGetWorkOrdersRequestSchema = z.object({
  siteId: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED_BY_HQ', 'SIGNED_BY_CONTRACTOR', 'REJECTED']).optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(10),
  searchQuery: z.string().optional(),
});

export const ZGetWorkOrdersResponseSchema = z.object({
  workOrders: z.array(
    z.object({
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
      }),
    }),
  ),
  totalCount: z.number(),
  page: z.number(),
  perPage: z.number(),
  totalPages: z.number(),
});

export type TGetWorkOrdersRequest = z.infer<typeof ZGetWorkOrdersRequestSchema>;
export type TGetWorkOrdersResponse = z.infer<typeof ZGetWorkOrdersResponseSchema>;
