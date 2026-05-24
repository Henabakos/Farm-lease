
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.error('No admin user found to seed clusters');
    return;
  }

  // 1. Create Demo Clusters
  const clusters = [
    { name: 'Northern Grain Collective', region: 'North', location: 'Zaria Cluster', areaHectares: 250, description: 'Efficient grain production focused on irrigation-assisted maize and soy.' },
    { name: 'Southern Cocoa Belt', region: 'South', location: 'Akure Estates', areaHectares: 180, description: 'Premium organic cocoa and palm kernel production.' },
    { name: 'Eastern Palm Ridge', region: 'East', location: 'Enugu Valley', areaHectares: 150, description: 'High-density palm oil processing and local distribution.' },
    { name: 'Western Fruit Valley', region: 'West', location: 'Ibadan Foothills', areaHectares: 210, description: 'Citrus and cassava specialized farming cluster.' }
  ];

  console.log('— Seeding Regions & Clusters');
  for (const c of clusters) {
    const existing = await prisma.cluster.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.cluster.create({
        data: {
          ...c,
          ownerId: admin.id,
          status: 'ACTIVE',
          centerLat: 9.0820,
          centerLng: 8.6753,
          createdAt: new Date('2024-01-15')
        }
      });
    }
  }

  // 2. Create Analytical Payments (Last 6 months)
  console.log('— Seeding Verified Payments for Analytics');
  
  const now = new Date();
  
  // Find or Create a dummy proposal/agreement to link payments to
  const cluster = await prisma.cluster.findFirst({ where: { name: 'Northern Grain Collective' } });
  
  console.log('— Creating dummy Agreement for mapping');
  const dummyProposal = await prisma.proposal.create({
    data: {
      investorId: admin.id,
      targetType: 'CLUSTER',
      clusterId: cluster.id,
      title: 'Analytics Seed Proposal',
      proposedAmount: 500000,
      status: 'ACCEPTED'
    }
  });

  const dummyAgreement = await prisma.agreement.create({
    data: {
      proposalId: dummyProposal.id,
      clusterId: cluster.id,
      title: 'Analytics Strategy Agreement',
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2027-01-01'),
      totalAmount: 500000
    }
  });

  for (let i = 0; i < 6; i++) {
    const paidAt = new Date(now.getFullYear(), now.getMonth() - i, 15);
    const monthKey = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, '0')}`;
    
    // Disbursements (Costs)
    await prisma.payment.create({
      data: {
        agreementId: dummyAgreement.id,
        amount: 45000 + Math.random() * 5000,
        type: 'DISBURSEMENT',
        status: 'VERIFIED',
        paidAt,
        payerId: admin.id,
        receiverId: admin.id,
        notes: `SEED-COST-${monthKey}`
      }
    });

    // Repayments (Yields)
    await prisma.payment.create({
      data: {
        agreementId: dummyAgreement.id,
        amount: 65000 + Math.random() * 10000,
        type: 'REPAYMENT',
        status: 'VERIFIED',
        paidAt,
        payerId: admin.id,
        receiverId: admin.id,
        notes: `SEED-YIELD-${monthKey}`
      }
    });
  }

  console.log('✨ Data seed for analytics complete.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
