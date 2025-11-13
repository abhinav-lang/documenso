import { WorkOrderStatus } from '@prisma/client';

import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { prisma } from '@documenso/prisma';

import type { CreateEnvelopeOptions } from '../envelope/create-envelope';
import { createEnvelope } from '../envelope/create-envelope';

export type CreateWorkOrderOptions = {
  workOrderNumber: string;
  siteId: string;
  contractorName: string;
  contractorPhone: string;
  contractorEmail?: string;
  envelopeOptions: CreateEnvelopeOptions;
};

export const createWorkOrder = async ({
  workOrderNumber,
  siteId,
  contractorName,
  contractorPhone,
  contractorEmail,
  envelopeOptions,
}: CreateWorkOrderOptions) => {
  // Validate site exists
  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });

  if (!site) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'Site not found',
    });
  }

  // Check if work order number already exists
  const existingWorkOrder = await prisma.workOrder.findUnique({
    where: { workOrderNumber },
  });

  if (existingWorkOrder) {
    throw new AppError(AppErrorCode.ALREADY_EXISTS, {
      message: 'Work order number already exists',
    });
  }

  // Find or create contractor
  let contractor = await prisma.contractor.findFirst({
    where: { phone: contractorPhone },
  });

  if (!contractor) {
    contractor = await prisma.contractor.create({
      data: {
        name: contractorName,
        phone: contractorPhone,
        email: contractorEmail,
      },
    });
  } else {
    // Update contractor info if exists
    contractor = await prisma.contractor.update({
      where: { id: contractor.id },
      data: {
        name: contractorName,
        email: contractorEmail,
      },
    });
  }

  // Create envelope
  const envelope = await createEnvelope(envelopeOptions);

  // Create work order
  const workOrder = await prisma.workOrder.create({
    data: {
      workOrderNumber,
      envelopeId: envelope.id,
      siteId,
      contractorId: contractor.id,
      status: WorkOrderStatus.DRAFT,
    },
    include: {
      envelope: true,
      site: true,
      contractor: true,
    },
  });

  return workOrder;
};
