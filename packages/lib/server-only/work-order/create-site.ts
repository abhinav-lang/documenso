import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { prisma } from '@documenso/prisma';

export type CreateSiteOptions = {
  name: string;
  code: string;
  location?: string;
  contactPhone?: string;
  userIds?: number[];
};

export const createSite = async ({
  name,
  code,
  location,
  contactPhone,
  userIds = [],
}: CreateSiteOptions) => {
  // Check if site code already exists
  const existingSite = await prisma.site.findUnique({
    where: { code },
  });

  if (existingSite) {
    throw new AppError(AppErrorCode.ALREADY_EXISTS, {
      message: 'Site code already exists',
    });
  }

  // Create site with users
  const site = await prisma.site.create({
    data: {
      name,
      code,
      location,
      contactPhone,
      siteUsers: {
        create: userIds.map((userId) => ({
          userId,
        })),
      },
    },
    include: {
      siteUsers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              workOrderRole: true,
            },
          },
        },
      },
    },
  });

  return site;
};
