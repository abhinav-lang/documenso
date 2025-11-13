import { getSites } from '@documenso/lib/server-only/work-order/get-sites';

import { authenticatedProcedure } from '../trpc';
import { ZGetSitesRequestSchema, ZGetSitesResponseSchema, getSitesMeta } from './get-sites.types';

export const getSitesRoute = authenticatedProcedure
  .meta(getSitesMeta)
  .input(ZGetSitesRequestSchema)
  .output(ZGetSitesResponseSchema)
  .query(async ({ input }) => {
    const { page, perPage, searchQuery } = input;

    return await getSites({
      page,
      perPage,
      searchQuery,
    });
  });
