// Clusters service.
//
// Visibility rules:
//   • ACTIVE clusters are publicly listable to any authenticated user.
//   • Owners + admins see their own clusters regardless of status.
// Mutation rules:
//   • Create: requires CLUSTER_CREATE permission; the creator becomes ownerId.
//   • Update/Delete: owner-or-admin only.
//   • Verify (set boundaries verified): admin only — handled via geospatial
//     module later; here we surface `isVerified` derived from boundary data.
import { prisma } from "../../db/prisma.js";
import { ForbiddenError, NotFoundError } from "../../shared/errors.js";
import { isAdmin } from "../../shared/scope.js";
import { paginate, paginated } from "../../shared/pagination.js";
import { recordOutbox } from "../../events/bus.js";

function toDto(c) {
    if (!c) return null;
    const metadata =
        c.metadata && typeof c.metadata === "object" ? c.metadata : {};
    const metadataVerified = ["true", "1", "t", "yes"].includes(
        String(metadata.is_verified ?? "").toLowerCase(),
    );
    return {
        id: c.id,
        owner_id: c.ownerId,
        name: c.name,
        location: c.location,
        region: c.region ?? null,
        area_hectares: c.areaHectares != null ? Number(c.areaHectares) : null,
        description: c.description ?? null,
        image_url: c.imageUrl ?? null,
        status: c.status,
        center_latitude: c.centerLat != null ? Number(c.centerLat) : null,
        center_longitude: c.centerLng != null ? Number(c.centerLng) : null,
        has_verified_survey: Boolean(c._verified) || metadataVerified,
        members_count: c._membersCount ?? 0,
        metadata,
        created_at: c.createdAt?.toISOString?.() ?? c.createdAt,
        updated_at: c.updatedAt?.toISOString?.() ?? c.updatedAt,
    };
}

function pickCreate(input) {
    return {
        name: input.name,
        location: input.location,
        region: input.region,
        description: input.description,
        imageUrl: input.imageUrl ?? input.image_url,
        areaHectares: input.areaHectares ?? input.area_hectares,
        centerLat: input.centerLatitude ?? input.center_latitude,
        centerLng: input.centerLongitude ?? input.center_longitude,
        metadata: input.metadata ?? {},
    };
}

export async function list(query, viewer) {
    const { page, pageSize, q, region, ownerId, status } = query;
    // Non-admins see ACTIVE clusters plus their own.
    const where = {
        AND: [
            isAdmin(viewer)
                ? {}
                : {
                      OR: [
                          { status: "ACTIVE" },
                          { ownerId: viewer.id },
                          {
                              memberships: {
                                  some: { userId: viewer.id, isActive: true },
                              },
                          },
                      ],
                  },
            status ? { status } : {},
            ownerId ? { ownerId } : {},
            region ? { region: { equals: region, mode: "insensitive" } } : {},
            q
                ? {
                      OR: [
                          { name: { contains: q, mode: "insensitive" } },
                          { location: { contains: q, mode: "insensitive" } },
                          { region: { contains: q, mode: "insensitive" } },
                      ],
                  }
                : {},
        ],
    };
    const [rows, total] = await Promise.all([
        prisma.cluster.findMany({
            where,
            ...paginate({ page, pageSize }),
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { memberships: { where: { isActive: true } } },
                },
                boundaries: {
                    select: { verificationStatus: true },
                    take: 1,
                    orderBy: { createdAt: "desc" },
                },
            },
        }),
        prisma.cluster.count({ where }),
    ]);
    return paginated(
        rows.map((r) =>
            toDto({
                ...r,
                _verified: r.boundaries.some(
                    (b) => b.verificationStatus === "VERIFIED",
                ),
                _membersCount: r._count?.memberships ?? 0,
            }),
        ),
        total,
        { page, pageSize },
    );
}

async function loadOrThrow(id, { withRels = false } = {}) {
    const cluster = await prisma.cluster.findUnique({
        where: { id },
        include: withRels
            ? {
                  _count: {
                      select: { memberships: { where: { isActive: true } } },
                  },
                  boundaries: {
                      select: { verificationStatus: true },
                      take: 1,
                      orderBy: { createdAt: "desc" },
                  },
              }
            : undefined,
    });
    if (!cluster) throw new NotFoundError("Cluster not found");
    return cluster;
}

export async function getById(id, _viewer) {
    const c = await loadOrThrow(id, { withRels: true });
    return toDto({
        ...c,
        _verified: c.boundaries?.some(
            (b) => b.verificationStatus === "VERIFIED",
        ),
        _membersCount: c._count?.memberships ?? 0,
    });
}

export async function create(input, viewer) {
    const data = pickCreate(input);
    const cluster = await prisma.$transaction(async (tx) => {
        const created = await tx.cluster.create({
            data: { ...data, ownerId: viewer.id },
        });
        // Creator joins as REPRESENTATIVE so cluster membership queries include them.
        await tx.clusterMembership.create({
            data: {
                userId: viewer.id,
                clusterId: created.id,
                role: "REPRESENTATIVE",
            },
        });
        await recordOutbox(tx, {
            eventType: "cluster.created",
            aggregateType: "Cluster",
            aggregateId: created.id,
            payload: {
                clusterId: created.id,
                ownerId: viewer.id,
                name: created.name,
            },
        });
        return created;
    });
    return toDto(cluster);
}

export async function update(id, patch, viewer) {
    const existing = await loadOrThrow(id);
    if (existing.ownerId !== viewer.id && !isAdmin(viewer)) {
        throw new ForbiddenError("Only the cluster owner or admin can edit");
    }
    const data = pickCreate(patch);
    if (patch.status !== undefined) {
        if (!isAdmin(viewer)) {
            throw new ForbiddenError("Only admins can change cluster status");
        }
        data.status = patch.status;
    }
    // Drop undefined keys so we don't clobber existing values with `undefined`.
    for (const k of Object.keys(data))
        if (data[k] === undefined) delete data[k];
    const updated = await prisma.cluster.update({ where: { id }, data });
    return toDto(updated);
}

export async function remove(id, viewer) {
    const existing = await loadOrThrow(id);
    if (existing.ownerId !== viewer.id && !isAdmin(viewer)) {
        throw new ForbiddenError("Only the cluster owner or admin can delete");
    }
    // Soft delete by status; preserves audit history + agreement references.
    await prisma.cluster.update({
        where: { id },
        data: { status: "ARCHIVED" },
    });
    return { message: "Cluster archived" };
}

export async function join(clusterId, viewer) {
    await loadOrThrow(clusterId);
    const role = viewer.role === "CLUSTER_REP" ? "REPRESENTATIVE" : "FARMER";
    const membership = await prisma.clusterMembership.upsert({
        where: { userId_clusterId: { userId: viewer.id, clusterId } },
        update: { isActive: true, leftAt: null, role },
        create: { userId: viewer.id, clusterId, role },
    });
    return { joined: true, role: membership.role };
}

export async function listMembers(clusterId, viewer) {
    await loadOrThrow(clusterId);
    const rows = await prisma.clusterMembership.findMany({
        where: { clusterId, isActive: true },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                    avatarUrl: true,
                },
            },
        },
        orderBy: { joinedAt: "desc" },
    });
    return rows.map((m) => ({
        id: m.user.id,
        name: m.user.fullName,
        email: m.user.email,
        role: m.user.role,
        cluster_role: m.role,
        avatar: m.user.avatarUrl ?? null,
        joined_at: m.joinedAt?.toISOString?.() ?? m.joinedAt,
    }));
}

export async function removeMember(clusterId, userId, viewer) {
    const cluster = await loadOrThrow(clusterId);
    if (cluster.ownerId !== viewer.id && !isAdmin(viewer)) {
        throw new ForbiddenError(
            "Only the cluster owner or admin can remove members",
        );
    }
    if (userId === cluster.ownerId) {
        throw new ForbiddenError("Cannot remove the cluster owner");
    }
    const existing = await prisma.clusterMembership.findUnique({
        where: { userId_clusterId: { userId, clusterId } },
    });
    if (!existing) throw new NotFoundError("Membership not found");
    await prisma.clusterMembership.update({
        where: { userId_clusterId: { userId, clusterId } },
        data: { isActive: false, leftAt: new Date() },
    });
    return { message: "Member removed" };
}

export async function inviteMember(clusterId, email, role, viewer) {
    const cluster = await loadOrThrow(clusterId);
    if (
        cluster.ownerId !== viewer.id &&
        !isAdmin(viewer) &&
        viewer.role !== "CLUSTER_REP"
    ) {
        throw new ForbiddenError(
            "Only cluster owner, admin, or cluster rep can invite members",
        );
    }

    const targetUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });
    if (!targetUser) {
        throw new NotFoundError("User not found with this email");
    }

    const existing = await prisma.clusterMembership.findUnique({
        where: { userId_clusterId: { userId: targetUser.id, clusterId } },
    });
    if (existing && existing.isActive) {
        throw new ForbiddenError("User is already a member of this cluster");
    }

    const membership = await prisma.clusterMembership.upsert({
        where: { userId_clusterId: { userId: targetUser.id, clusterId } },
        update: { isActive: true, leftAt: null, role },
        create: { userId: targetUser.id, clusterId, role },
    });

    // Log audit
    await prisma.auditLog.create({
        data: {
            userId: viewer.id,
            action: "CLUSTER_MEMBER_INVITED",
            entityType: "CLUSTER",
            entityId: clusterId,
            changes: {
                invitedUserId: targetUser.id,
                invitedEmail: targetUser.email,
                role,
            },
        },
    });

    return {
        message: "Member invited successfully",
        member: {
            id: targetUser.id,
            name: targetUser.fullName,
            email: targetUser.email,
            role: targetUser.role,
            cluster_role: membership.role,
            avatar: targetUser.avatarUrl,
            joined_at:
                membership.joinedAt?.toISOString?.() ?? membership.joinedAt,
        },
    };
}

export async function updateMemberRole(clusterId, userId, role, viewer) {
    const cluster = await loadOrThrow(clusterId);
    if (
        cluster.ownerId !== viewer.id &&
        !isAdmin(viewer) &&
        viewer.role !== "CLUSTER_REP"
    ) {
        throw new ForbiddenError(
            "Only cluster owner, admin, or cluster rep can update member roles",
        );
    }
    if (userId === cluster.ownerId) {
        throw new ForbiddenError("Cannot change the cluster owner role");
    }

    const membership = await prisma.clusterMembership.findUnique({
        where: { userId_clusterId: { userId, clusterId } },
    });
    if (!membership) throw new NotFoundError("Membership not found");
    if (!membership.isActive)
        throw new ForbiddenError("Cannot update role for inactive member");

    const updated = await prisma.clusterMembership.update({
        where: { userId_clusterId: { userId, clusterId } },
        data: { role },
    });

    // Log audit
    await prisma.auditLog.create({
        data: {
            userId: viewer.id,
            action: "CLUSTER_MEMBER_ROLE_UPDATED",
            entityType: "CLUSTER",
            entityId: clusterId,
            changes: { targetUserId: userId, newRole: role },
        },
    });

    return {
        message: "Member role updated successfully",
        role: updated.role,
    };
}

/**
 * Assign an existing member as the cluster representative (owner).
 * Demotes any other REPRESENTATIVE memberships to FARMER.
 */
export async function assignRepresentative(clusterId, userId, viewer) {
    const cluster = await loadOrThrow(clusterId);
    if (cluster.ownerId !== viewer.id && !isAdmin(viewer)) {
        throw new ForbiddenError(
            "Only the cluster owner or admin can assign a representative",
        );
    }

    const membership = await prisma.clusterMembership.findUnique({
        where: { userId_clusterId: { userId, clusterId } },
    });
    if (!membership || !membership.isActive) {
        throw new NotFoundError("User is not an active member of this cluster");
    }
    if (userId === cluster.ownerId) {
        return {
            message: "User is already the cluster representative",
            ownerId: userId,
        };
    }

    await prisma.$transaction(async (tx) => {
        await tx.cluster.update({
            where: { id: clusterId },
            data: { ownerId: userId },
        });
        await tx.clusterMembership.updateMany({
            where: {
                clusterId,
                isActive: true,
                role: "REPRESENTATIVE",
                userId: { not: userId },
            },
            data: { role: "FARMER" },
        });
        await tx.clusterMembership.update({
            where: { userId_clusterId: { userId, clusterId } },
            data: { role: "REPRESENTATIVE" },
        });
        await tx.auditLog.create({
            data: {
                userId: viewer.id,
                action: "CLUSTER_REPRESENTATIVE_ASSIGNED",
                entityType: "CLUSTER",
                entityId: clusterId,
                changes: {
                    representativeUserId: userId,
                    previousOwnerId: cluster.ownerId,
                },
            },
        });
    });

    return getById(clusterId, viewer);
}

/**
 * Admin-only shortcut to mark a cluster as verified by VERIFYing its most
 * recent boundary (or creating a synthetic verification flag in metadata if
 * no boundary exists yet). Cluster classification is surfaced via the
 * derived `has_verified_survey` flag in the DTO.
 */
export async function adminVerify(clusterId, viewer) {
    if (!isAdmin(viewer))
        throw new ForbiddenError("Only admins can verify clusters");
    const cluster = await loadOrThrow(clusterId);
    const latestBoundary = await prisma.landBoundary.findFirst({
        where: { clusterId },
        orderBy: { createdAt: "desc" },
    });
    if (latestBoundary) {
        await prisma.landBoundary.update({
            where: { id: latestBoundary.id },
            data: {
                verificationStatus: "VERIFIED",
                verifiedById: viewer.id,
                verifiedAt: new Date(),
            },
        });
    } else {
        // No survey on file yet — record the verification intent in metadata
        // so the cluster shows as verified in admin UIs even before mapping.
        const md = {
            ...(cluster.metadata || {}),
            is_verified: true,
            verified_by: viewer.id,
            verified_at: new Date().toISOString(),
        };
        await prisma.cluster.update({
            where: { id: clusterId },
            data: { metadata: md },
        });
    }
    await prisma.auditLog.create({
        data: {
            userId: viewer.id,
            action: "CLUSTER_VERIFIED",
            entityType: "Cluster",
            entityId: clusterId,
        },
    });
    return getById(clusterId, viewer);
}

export async function adminUnverify(clusterId, viewer) {
    if (!isAdmin(viewer))
        throw new ForbiddenError("Only admins can unverify clusters");
    const cluster = await loadOrThrow(clusterId);
    const latestBoundary = await prisma.landBoundary.findFirst({
        where: { clusterId },
        orderBy: { createdAt: "desc" },
    });
    if (latestBoundary) {
        await prisma.landBoundary.update({
            where: { id: latestBoundary.id },
            data: {
                verificationStatus: "UNVERIFIED",
                verifiedById: null,
                verifiedAt: null,
            },
        });
    }
    const md = { ...(cluster.metadata || {}) };
    delete md.is_verified;
    delete md.verified_by;
    delete md.verified_at;
    await prisma.cluster.update({
        where: { id: clusterId },
        data: { metadata: md },
    });
    await prisma.auditLog.create({
        data: {
            userId: viewer.id,
            action: "CLUSTER_UNVERIFIED",
            entityType: "Cluster",
            entityId: clusterId,
        },
    });
    return getById(clusterId, viewer);
}

export async function leave(clusterId, viewer) {
    const existing = await prisma.clusterMembership.findUnique({
        where: { userId_clusterId: { userId: viewer.id, clusterId } },
    });
    if (!existing || !existing.isActive) {
        return { message: "Not a member" };
    }
    await prisma.clusterMembership.update({
        where: { userId_clusterId: { userId: viewer.id, clusterId } },
        data: { isActive: false, leftAt: new Date() },
    });
    return { message: "Left cluster" };
}
