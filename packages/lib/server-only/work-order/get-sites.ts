import { prisma } from '@documenso/prisma';

export type GetSitesOptions = {
  userId?: number;
  page?: number;
  perPage?: number;
  searchQuery?: string;
};

export const getSites = async ({
  userId,
  page = 1,
  perPage = 50,
  searchQuery,
}: GetSitesOptions = {}) => {
  const skip = (page - 1) * perPage;

  const whereClause: any = {};

  // If userId is provided, filter sites where user is assigned
  if (userId) {
    whereClause.siteUsers = {
      some: {
        userId,
      },
    };
  }

  // Add search query
  if (searchQuery) {
    whereClause.OR = [
      {
        name: {
          contains: searchQuery,
          mode: 'insensitive',
        },
      },
      {
        code: {
          contains: searchQuery,
          mode: 'insensitive',
        },
      },
      {
        location: {
          contains: searchQuery,
          mode: 'insensitive',
        },
      },
    ];
  }

  const [sites, totalCount] = await Promise.all([
    prisma.site.findMany({
      where: whereClause,
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
        _count: {
          select: {
            workOrders: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      skip,
      take: perPage,
    }),
    prisma.site.count({ where: whereClause }),
  ]);

  return {
    sites,
    totalCount,
    page,
    perPage,
    totalPages: Math.ceil(totalCount / perPage),
  };
};
