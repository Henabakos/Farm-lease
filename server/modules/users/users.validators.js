import { z } from "zod";

export const uuidParam = z.object({ id: z.string().uuid() });

export const updateProfileSchema = z
    .object({
        full_name: z.string().trim().min(2).max(120).optional(),
        fullName: z.string().trim().min(2).max(120).optional(),
        phone: z.string().trim().min(5).max(40).optional().nullable(),
        bio: z.string().trim().max(2000).optional().nullable(),
        location: z.string().trim().max(255).optional().nullable(),
        avatar_url: z.string().url().max(2048).optional().nullable(),
        avatarUrl: z.string().url().max(2048).optional().nullable(),
    })
    .strict()
    .partial();

export const listUsersQuery = z.object({
    q: z.string().trim().min(1).max(120).optional(),
    role: z.enum(["ADMIN", "INVESTOR", "CLUSTER_REP", "FARMER"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
});
