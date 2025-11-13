import type { Prisma, WorkOrderRole, WorkOrderStatus } from '@prisma/client';

import { canViewAllWorkOrders } from '@documenso/lib/constants/work-orders';
import { prisma } from '@documenso/prisma';

export type GetWorkOrdersOptions = {
  userId: number;
  userWorkOrderRole?: WorkOrderRole | null;
  siteId?: string;
  status?: WorkOrderStatus;
  page?: number;
  perPage?: number;
  searchQuery?: string;
};

export const getWorkOrders = async ({
  userId,
  userWorkOrderRole,
  siteId,
  status,
  page = 1,
  perPage = 10,
  searchQuery,
}: GetWorkOrdersOptions) => {
  const skip = (page - 1) * perPage;

  // Build where clause based on user role
  const whereClause: Prisma.WorkOrderWhereInput = {
    ...(status && { status }),
  };

  // Apply role-based filtering
  if (userWorkOrderRole && !canViewAllWorkOrders(userWorkOrderRole)) {
    // Site managers can only see their site's work orders
    if (userWorkOrderRole === 'SITE_MANAGER') {
      // Get user's sites
      const userSites = await prisma.siteUser.findMany({
        where: { userId },
        select: { siteId: true },
      });

      const userSiteIds = userSites.map((s) => s.siteId);

      whereClause.siteId = {
        in: userSiteIds,
      };
    }
    // Contractors can only see their own work orders
    else if (userWorkOrderRole === 'CONTRACTOR') {
      const contractor = await prisma.contractor.findFirst({
        where: {
          // Assuming contractor is linked somehow to userId
          // This might need adjustment based on how contractors are managed
          phone: '', // TODO: Need to link contractor to user
        },
      });

      if (contractor) {
        whereClause.contractorId = contractor.id;
      }
    }
  }

  // If siteId is provided, filter by it
  if (siteId) {
    whereClause.siteId = siteId;
  }

  // Add search query
  if (searchQuery) {
    whereClause.OR = [
      {
        workOrderNumber: {
          contains: searchQuery,
          mode: 'insensitive',
        },
      },
      {
        site: {
          name: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
      },
      {
        contractor: {
          name: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  const [workOrders, totalCount] = await Promise.all([
    prisma.workOrder.findMany({
      where: whereClause,
      include: {
        envelope: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            completedAt: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            code: true,
            location: true,
          },
        },
        contractor: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: perPage,
    }),
    prisma.workOrder.count({ where: whereClause }),
  ]);

  return {
    workOrders,
    totalCount,
    page,
    perPage,
    totalPages: Math.ceil(totalCount / perPage),
  };
};
