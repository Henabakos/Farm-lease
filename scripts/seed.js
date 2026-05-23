// ============================================================================
// Database seed.
//
// Run with: `npm run db:seed` (after `npx prisma migrate dev`).
//
// Creates:
//   • One ADMIN account (idempotent — re-runs are safe).
//   • Three demo users (INVESTOR, CLUSTER_REP, FARMER) so the frontend has
//     something to log in as during development.
//
// Credentials are logged ONCE on first creation. If the row already exists
// the script leaves it alone (does NOT reset the password) so seeded prod
// accounts aren't accidentally overwritten by re-running.
// ============================================================================

import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { seedAndLoadPermissions } from "../server/modules/rbac/seed.js";

const prisma = new PrismaClient();

const ARGON_OPTS = {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
};

async function upsertUser({ email, password, fullName, role }) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log(`  • exists  : ${email} (${existing.role})`);
        return existing;
    }
    const passwordHash = await argon2.hash(password, ARGON_OPTS);
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            fullName,
            role,
            status: "ACTIVE",
            verificationStatus: role === "ADMIN" ? "VERIFIED" : "UNVERIFIED",
            emailVerifiedAt: role === "ADMIN" ? new Date() : null,
        },
    });
    console.log(`  • created : ${email} (${role})  password=${password}`);
    return user;
}

async function upsertCluster({
    ownerId,
    name,
    location,
    region,
    areaHectares,
    description,
    centerLat,
    centerLng,
    imageUrl,
}) {
    const existing = await prisma.cluster.findFirst({ where: { name } });
    if (existing) {
        console.log(`  • exists  : ${name} (${location})`);
        return existing;
    }
    const cluster = await prisma.cluster.create({
        data: {
            ownerId,
            name,
            location,
            region,
            areaHectares,
            description,
            centerLat,
            centerLng,
            imageUrl,
            status: "ACTIVE",
            metadata: {},
        },
    });
    console.log(`  • created : ${name} (${region}) — ${areaHectares} ha`);
    return cluster;
}

async function upsertProposal({
    investorId,
    clusterId,
    title,
    description,
    proposedAmount,
    leaseTermMonths,
    roi,
    location,
    targetUserId,
}) {
    const existing = await prisma.proposal.findFirst({ where: { title } });
    if (existing) {
        console.log(`  • exists  : ${title} (proposal)`);
        return existing;
    }
    const proposal = await prisma.proposal.create({
        data: {
            investorId,
            targetType: targetUserId ? "FARMER" : "CLUSTER",
            clusterId,
            targetUserId,
            title,
            description,
            proposedAmount,
            leaseTermMonths,
            roi,
            location,
            terms: {
                seed: true,
                source: "seed.js",
            },
            status: "PUBLISHED",
        },
    });
    console.log(`  • created : ${title} (proposal)`);
    return proposal;
}

async function upsertAgreement({
    proposalId,
    clusterId,
    title,
    startDate,
    endDate,
    totalAmount,
    installmentAmount,
    currency = "USD",
    status = "ACTIVE",
}) {
    const existing = await prisma.agreement.findUnique({
        where: { proposalId },
    });
    if (existing) {
        console.log(`  • exists  : ${title} (agreement)`);
        return existing;
    }
    const agreement = await prisma.agreement.create({
        data: {
            proposalId,
            clusterId,
            title,
            status,
            startDate,
            endDate,
            totalAmount,
            installmentAmount,
            currency,
            terms: {
                seed: true,
                source: "seed.js",
            },
        },
    });
    console.log(`  • created : ${title} (agreement)`);
    return agreement;
}

async function upsertPayment({
    agreementId,
    payerId,
    receiverId,
    amount,
    type,
    status,
    dueDate,
    paidAt,
    notes,
    currency = "USD",
}) {
    const existing = await prisma.payment.findFirst({
        where: { agreementId, amount, type, notes },
    });
    if (existing) {
        console.log(`  • exists  : ${notes} (payment)`);
        return existing;
    }
    const payment = await prisma.payment.create({
        data: {
            agreementId,
            payerId,
            receiverId,
            amount,
            currency,
            type,
            status,
            dueDate,
            paidAt,
            notes,
            metadata: {
                seed: true,
                source: "seed.js",
            },
        },
    });
    console.log(`  • created : ${notes} (payment)`);
    return payment;
}

async function main() {
    console.log("— seeding RBAC permissions");
    await seedAndLoadPermissions();

    console.log("— seeding users");
    const admin = await upsertUser({
        email: "admin@farmlease.local",
        password: "AdminPass123!",
        fullName: "Platform Admin",
        role: "ADMIN",
    });
    const investor = await upsertUser({
        email: "investor@farmlease.local",
        password: "InvestorPass123!",
        fullName: "Demo Investor",
        role: "INVESTOR",
    });
    const rep = await upsertUser({
        email: "rep@farmlease.local",
        password: "RepPass123!",
        fullName: "Demo Cluster Rep",
        role: "CLUSTER_REP",
    });
    await upsertUser({
        email: "farmer@farmlease.local",
        password: "FarmerPass123!",
        fullName: "Demo Farmer",
        role: "FARMER",
    });

    console.log("— seeding clusters");
    // Kisumu Maize Cooperative (Kenya)
    await upsertCluster({
        ownerId: rep.id,
        name: "Kisumu Maize Cooperative",
        location: "Kisumu County, Kenya",
        region: "East Africa",
        areaHectares: 450,
        description:
            "Large-scale maize and soybean production cooperative in the Lake Victoria region. Modern irrigation systems and seed quality certification.",
        centerLat: -0.1022,
        centerLng: 34.7617,
        imageUrl:
            "https://images.unsplash.com/photo-1625246333195-78d9c38ad576?w=500",
    });

    // Ashanti Cocoa Cluster (Ghana)
    await upsertCluster({
        ownerId: rep.id,
        name: "Ashanti Cocoa Cluster",
        location: "Ashanti Region, Ghana",
        region: "West Africa",
        areaHectares: 320,
        description:
            "Premium cocoa production cluster with shade-grown farming practices. Direct access to export facilities and fair-trade certification.",
        centerLat: 6.5244,
        centerLng: -1.6236,
        imageUrl:
            "https://images.unsplash.com/photo-1599599810694-b5ac4dd33e2b?w=500",
    });

    // Rumphi Rice Collective (Malawi)
    await upsertCluster({
        ownerId: rep.id,
        name: "Rumphi Rice Collective",
        location: "Rumphi District, Malawi",
        region: "Southern Africa",
        areaHectares: 280,
        description:
            "Sustainable rice farming collective with integrated water management and crop rotation systems. Access to modern milling equipment.",
        centerLat: -10.7833,
        centerLng: 33.9667,
        imageUrl:
            "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500",
    });

    // Kasese Cassava Network (Uganda)
    await upsertCluster({
        ownerId: rep.id,
        name: "Kasese Cassava Network",
        location: "Kasese District, Uganda",
        region: "East Africa",
        areaHectares: 380,
        description:
            "Cassava production and processing cluster. Partnership with agro-processors for value addition. Training programs in modern cultivation techniques.",
        centerLat: -0.2333,
        centerLng: 30.0667,
        imageUrl:
            "https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=500",
    });

    // Casamance Mixed Crop (Senegal)
    await upsertCluster({
        ownerId: rep.id,
        name: "Casamance Mixed Crop Cluster",
        location: "Casamance Region, Senegal",
        region: "West Africa",
        areaHectares: 520,
        description:
            "Diverse polyculture cluster producing groundnuts, millet, and sesame. Strong farmer cooperative with 200+ members. Excellent soil quality.",
        centerLat: 13.3054,
        centerLng: -15.0747,
        imageUrl:
            "https://images.unsplash.com/photo-1488459716781-6815ad955ce7?w=500",
    });

    // Rift Valley Horticulture (Kenya)
    await upsertCluster({
        ownerId: rep.id,
        name: "Rift Valley Horticulture",
        location: "Narok County, Kenya",
        region: "East Africa",
        areaHectares: 210,
        description:
            "High-value horticultural production (tomatoes, peppers, French beans). Greenhouse technology and export-quality standards. Cold chain logistics.",
        centerLat: -1.4026,
        centerLng: 35.3948,
        imageUrl:
            "https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=500",
    });

    console.log("— seeding proposal, agreement, and payments");
    const seedCluster = await prisma.cluster.findFirst({
        where: { name: "Kisumu Maize Cooperative" },
    });
    const proposal = await upsertProposal({
        investorId: investor.id,
        clusterId: seedCluster.id,
        title: "Kisumu Harvest Expansion Financing",
        description:
            "Working capital and irrigation upgrade financing for the Kisumu cooperative.",
        proposedAmount: 50000,
        leaseTermMonths: 24,
        roi: 18,
        location: seedCluster.location,
    });
    const agreement = await upsertAgreement({
        proposalId: proposal.id,
        clusterId: seedCluster.id,
        title: "Kisumu Harvest Expansion Agreement",
        startDate: new Date("2026-01-15T00:00:00.000Z"),
        endDate: new Date("2028-01-15T00:00:00.000Z"),
        totalAmount: 50000,
        installmentAmount: 2500,
        status: "ACTIVE",
    });

    await upsertPayment({
        agreementId: agreement.id,
        payerId: investor.id,
        receiverId: rep.id,
        amount: 12500,
        currency: "USD",
        type: "DISBURSEMENT",
        status: "VERIFIED",
        dueDate: new Date("2026-03-16T00:00:00.000Z"),
        paidAt: new Date("2026-03-17T09:30:00.000Z"),
        notes: "seed: verified disbursement for Kisumu agreement",
    });

    await upsertPayment({
        agreementId: agreement.id,
        payerId: rep.id,
        receiverId: investor.id,
        amount: 2500,
        currency: "USD",
        type: "REPAYMENT",
        status: "SUBMITTED",
        dueDate: new Date("2026-03-25T00:00:00.000Z"),
        notes: "seed: submitted repayment for Kisumu agreement",
    });

    console.log("done.");
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
