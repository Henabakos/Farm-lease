// Standardized pagination: `?page=1&pageSize=20`. Server caps pageSize to
// prevent unbounded queries. Returns a uniform envelope around `data`.
import { z } from 'zod';

const MAX_PAGE_SIZE = 100;

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(20),
});

export function paginate({ page, pageSize }) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function paginated(data, total, { page, pageSize }) {
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}
