import { z } from 'zod';

import type { TrpcRouteMeta } from '../trpc';

export const getSitesMeta: TrpcRouteMeta = {
  openapi: {
    method: 'GET',
    path: '/work-order/sites',
    summary: 'Get sites',
    description: 'Returns a list of sites',
    tags: ['Work Order'],
  },
};

export const ZGetSitesRequestSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(50),
  searchQuery: z.string().optional(),
});

export const ZGetSitesResponseSchema = z.object({
  sites: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      location: z.string().nullable(),
      contactPhone: z.string().nullable(),
      createdAt: z.date(),
      siteUsers: z.array(
        z.object({
          id: z.string(),
          user: z.object({
            id: z.number(),
            name: z.string().nullable(),
            email: z.string(),
            workOrderRole: z.string().nullable(),
          }),
        }),
      ),
      _count: z.object({
        workOrders: z.number(),
      }),
    }),
  ),
  totalCount: z.number(),
  page: z.number(),
  perPage: z.number(),
  totalPages: z.number(),
});

export type TGetSitesRequest = z.infer<typeof ZGetSitesRequestSchema>;
export type TGetSitesResponse = z.infer<typeof ZGetSitesResponseSchema>;
