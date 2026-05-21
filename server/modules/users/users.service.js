// Users service — profile reads/writes + admin user search.
//
// Authorization rules:
//   • Anyone authenticated can read their own profile.
//   • Reading another user's profile returns a PUBLIC subset (no email, phone,
//     audit fields). Admins see the full record.
//   • Only the user themself (or admin) can update their profile.
//   • Only admins can change `verificationStatus`.
import { prisma } from "../../db/prisma.js";
import { ForbiddenError, NotFoundError } from "../../shared/errors.js";
import { isAdmin } from "../../shared/scope.js";
import { toUserDto } from "../auth/dto.js";
import { paginate, paginated } from "../../shared/pagination.js";

function toPublicUserDto(user) {
    if (!user) return null;
    return {
        id: user.id,
        full_name: user.fullName,
        role: user.role,
        avatar_url: user.avatarUrl ?? null,
        bio: user.bio ?? null,
        verification_status: (
            user.verificationStatus ?? "UNVERIFIED"
        ).toLowerCase(),
    };
}

export async function getById({ targetId, viewer }) {
    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundError("User not found");
    if (viewer.id === user.id || isAdmin(viewer)) return toUserDto(user);
    return toPublicUserDto(user);
}

export async function updateProfile({ targetId, viewer, patch }) {
    if (viewer.id !== targetId && !isAdmin(viewer)) {
        throw new ForbiddenError("Cannot edit another user");
    }
    // Accept both snake_case (legacy) and camelCase keys; never let the client
    // touch role/status/email/passwordHash/verificationStatus from this path.
    const data = {};
    if (patch.full_name !== undefined || patch.fullName !== undefined) {
        data.fullName = patch.fullName ?? patch.full_name;
    }
    if (patch.phone !== undefined) data.phone = patch.phone;
    if (patch.bio !== undefined) data.bio = patch.bio;
    if (patch.location !== undefined) data.location = patch.location;
    if (patch.avatar_url !== undefined || patch.avatarUrl !== undefined) {
        data.avatarUrl = patch.avatarUrl ?? patch.avatar_url;
    }
    const updated = await prisma.user.update({ where: { id: targetId }, data });
    return toUserDto(updated);
}

export async function search({ q, role, page, pageSize }, viewer) {
    // Non-admins get a public listing only and cannot filter by ADMIN role.
    const where = {
        status: { in: ["ACTIVE", "PENDING_APPROVAL"] },
        ...(role ? { role } : {}),
        ...(q
            ? {
                  OR: [
                      { fullName: { contains: q, mode: "insensitive" } },
                      ...(isAdmin(viewer)
                          ? [{ email: { contains: q, mode: "insensitive" } }]
                          : []),
                  ],
              }
            : {}),
    };
    const [rows, total] = await Promise.all([
        prisma.user.findMany({
            where,
            ...paginate({ page, pageSize }),
            orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
    ]);
    const mapper = isAdmin(viewer) ? toUserDto : toPublicUserDto;
    return paginated(rows.map(mapper), total, { page, pageSize });
}

export async function verify({ targetId, viewer }) {
    if (!isAdmin(viewer))
        throw new ForbiddenError("Only admins can verify users");
    const updated = await prisma.user.update({
        where: { id: targetId },
        data: { verificationStatus: "VERIFIED" },
    });
    return toUserDto(updated);
}
