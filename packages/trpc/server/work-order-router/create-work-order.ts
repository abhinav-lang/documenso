import { RecipientRole } from '@prisma/client';

import { createWorkOrder } from '@documenso/lib/server-only/work-order/create-work-order';
import { extractRequestMetadata } from '@documenso/lib/universal/extract-request-metadata';

import { authenticatedProcedure } from '../trpc';
import {
  ZCreateWorkOrderRequestSchema,
  ZCreateWorkOrderResponseSchema,
  createWorkOrderMeta,
} from './create-work-order.types';

export const createWorkOrderRoute = authenticatedProcedure
  .meta(createWorkOrderMeta)
  .input(ZCreateWorkOrderRequestSchema)
  .output(ZCreateWorkOrderResponseSchema)
  .mutation(async ({ input, ctx }) => {
    const { teamId, user } = ctx;
    const {
      workOrderNumber,
      siteId,
      contractorName,
      contractorPhone,
      contractorEmail,
      title,
      documentDataId,
      approverEmails,
    } = input;

    const requestMetadata = extractRequestMetadata(ctx.req);

    // Create work order with envelope
    const workOrder = await createWorkOrder({
      workOrderNumber,
      siteId,
      contractorName,
      contractorPhone,
      contractorEmail,
      envelopeOptions: {
        userId: user.id,
        teamId,
        internalVersion: 2,
        normalizePdf: true,
        data: {
          type: 'DOCUMENT',
          title,
          envelopeItems: [
            {
              title,
              documentDataId,
              order: 0,
            },
          ],
          recipients: approverEmails.map((email, index) => ({
            email,
            name: '',
            role: RecipientRole.APPROVER,
            signingOrder: index + 1,
          })),
        },
        requestMetadata,
      },
    });

    return {
      workOrderId: workOrder.id,
      envelopeId: workOrder.envelopeId,
      workOrderNumber: workOrder.workOrderNumber,
      status: workOrder.status,
    };
  });
