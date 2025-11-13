import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { prisma } from '@documenso/prisma';

export type GetWorkOrderOptions = {
  id?: string;
  workOrderNumber?: string;
  envelopeId?: string;
};

export const getWorkOrder = async ({ id, workOrderNumber, envelopeId }: GetWorkOrderOptions) => {
  if (!id && !workOrderNumber && !envelopeId) {
    throw new AppError(AppErrorCode.INVALID_REQUEST, {
      message: 'Must provide either id, workOrderNumber, or envelopeId',
    });
  }

  const workOrder = await prisma.workOrder.findFirst({
    where: {
      ...(id && { id }),
      ...(workOrderNumber && { workOrderNumber }),
      ...(envelopeId && { envelopeId }),
    },
    include: {
      envelope: {
        include: {
          recipients: true,
          fields: true,
          envelopeItems: {
            include: {
              documentData: true,
            },
          },
        },
      },
      site: {
        include: {
          siteUsers: {
            include: {
              user: true,
            },
          },
        },
      },
      contractor: true,
    },
  });

  if (!workOrder) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'Work order not found',
    });
  }

  return workOrder;
};
