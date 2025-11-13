import type { WorkOrderStatus } from '@prisma/client';

import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { isValidStatusTransition } from '@documenso/lib/constants/work-orders';
import { prisma } from '@documenso/prisma';

export type UpdateWorkOrderStatusOptions = {
  workOrderId: string;
  newStatus: WorkOrderStatus;
  userId: number;
  remarks?: string;
};

export const updateWorkOrderStatus = async ({
  workOrderId,
  newStatus,
  userId,
  remarks,
}: UpdateWorkOrderStatusOptions) => {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      envelope: true,
    },
  });

  if (!workOrder) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'Work order not found',
    });
  }

  // Validate status transition
  if (!isValidStatusTransition(workOrder.status, newStatus)) {
    throw new AppError(AppErrorCode.INVALID_REQUEST, {
      message: `Invalid status transition from ${workOrder.status} to ${newStatus}`,
    });
  }

  // Update work order status
  const updateData: {
    status: WorkOrderStatus;
    approvedAt?: Date;
    signedAt?: Date;
    rejectedAt?: Date;
  } = {
    status: newStatus,
  };

  // Set timestamps based on status
  switch (newStatus) {
    case 'APPROVED_BY_HQ':
      updateData.approvedAt = new Date();
      break;
    case 'SIGNED_BY_CONTRACTOR':
      updateData.signedAt = new Date();
      break;
    case 'REJECTED':
      updateData.rejectedAt = new Date();
      break;
  }

  const updatedWorkOrder = await prisma.workOrder.update({
    where: { id: workOrderId },
    data: updateData,
    include: {
      envelope: {
        include: {
          recipients: true,
        },
      },
      site: true,
      contractor: true,
    },
  });

  return updatedWorkOrder;
};
