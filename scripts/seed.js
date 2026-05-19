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

import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { seedAndLoadPermissions } from '../server/modules/rbac/seed.js';

const prisma = new PrismaClient();

const ARGON_OPTS = { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 };

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
      status: 'ACTIVE',
      verificationStatus: role === 'ADMIN' ? 'VERIFIED' : 'UNVERIFIED',
      emailVerifiedAt: role === 'ADMIN' ? new Date() : null,
    },
  });
  console.log(`  • created : ${email} (${role})  password=${password}`);
  return user;
}

async function main() {
  console.log('— seeding RBAC permissions');
  await seedAndLoadPermissions();

  console.log('— seeding users');
  await upsertUser({
    email: 'admin@farmlease.local',
    password: 'AdminPass123!',
    fullName: 'Platform Admin',
    role: 'ADMIN',
  });
  await upsertUser({
    email: 'investor@farmlease.local',
    password: 'InvestorPass123!',
    fullName: 'Demo Investor',
    role: 'INVESTOR',
  });
  await upsertUser({
    email: 'rep@farmlease.local',
    password: 'RepPass123!',
    fullName: 'Demo Cluster Rep',
    role: 'CLUSTER_REP',
  });
  await upsertUser({
    email: 'farmer@farmlease.local',
    password: 'FarmerPass123!',
    fullName: 'Demo Farmer',
    role: 'FARMER',
  });

  console.log('done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
