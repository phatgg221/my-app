import { Stage, DocumentType } from '@prisma/client';
import prisma from '../lib/prisma';

async function main() {
  console.log('Seeding initial data...');

  // Clean existing data
  await prisma.document.deleteMany({});
  await prisma.stageHistory.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Seed Ops Coordinators
  const sarah = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@shopee.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'Compliance Lead',
    },
  });

  const alex = await prisma.user.create({
    data: {
      name: 'Alex Chen',
      email: 'alex.chen@shopee.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Senior Ops Coordinator',
    },
  });

  const david = await prisma.user.create({
    data: {
      name: 'David Nguyen',
      email: 'david.nguyen@shopee.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Onboarding Specialist',
    },
  });

  console.log(`Created 3 Ops Coordinators: ${sarah.name}, ${alex.name}, ${david.name}`);

  // Helper date generators for "Days in Stage"
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // 2. Seed Vendors
  // Vendor 1: Stuck in KYC_DOCS_RECEIVED (12 days ago) -> Flags as Stuck Vendor!
  const v1 = await prisma.vendor.create({
    data: {
      name: 'EcoLifestyle Global',
      region: 'Southeast Asia',
      currentStage: Stage.KYC_DOCS_RECEIVED,
      updatedAt: daysAgo(12),
      histories: {
        create: [
          {
            userId: alex.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(16),
          },
          {
            userId: sarah.id,
            previousStage: Stage.CONTRACT_SIGNED,
            newStage: Stage.KYC_DOCS_RECEIVED,
            changedAt: daysAgo(12),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'Business_License_2026.pdf',
            fileKey: 'documents/v1-business-license.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v1-business-license.pdf',
            type: DocumentType.BUSINESS_LICENSE,
            uploadedAt: daysAgo(12),
          },
        ],
      },
    },
  });

  // Vendor 2: Normal in CONTRACT_SENT (2 days ago)
  const v2 = await prisma.vendor.create({
    data: {
      name: 'Global Apparel Supply',
      region: 'North America',
      currentStage: Stage.CONTRACT_SENT,
      updatedAt: daysAgo(2),
      histories: {
        create: [
          {
            userId: david.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SENT,
            changedAt: daysAgo(2),
          },
        ],
      },
    },
  });

  // Vendor 3: Stuck in CONTRACT_SIGNED (9 days ago) -> Flags as Stuck Vendor!
  const v3 = await prisma.vendor.create({
    data: {
      name: 'Apex Robotics Co.',
      region: 'East Asia',
      currentStage: Stage.CONTRACT_SIGNED,
      updatedAt: daysAgo(9),
      histories: {
        create: [
          {
            userId: alex.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(9),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'Director_ID_Card.png',
            fileKey: 'documents/v3-id-card.png',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v3-id-card.png',
            type: DocumentType.IDENTITY_DOCUMENT,
            uploadedAt: daysAgo(9),
          },
        ],
      },
    },
  });

  // Vendor 4: Active Vendor (updated 1 day ago)
  const v4 = await prisma.vendor.create({
    data: {
      name: 'Nordic Artisan Crafts',
      region: 'Europe',
      currentStage: Stage.ACTIVE,
      updatedAt: daysAgo(1),
      histories: {
        create: [
          {
            userId: alex.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(15),
          },
          {
            userId: sarah.id,
            previousStage: Stage.CONTRACT_SIGNED,
            newStage: Stage.KYC_DOCS_RECEIVED,
            changedAt: daysAgo(10),
          },
          {
            userId: sarah.id,
            previousStage: Stage.KYC_DOCS_RECEIVED,
            newStage: Stage.KYC_VERIFIED,
            changedAt: daysAgo(4),
          },
          {
            userId: alex.id,
            previousStage: Stage.KYC_VERIFIED,
            newStage: Stage.ACTIVE,
            changedAt: daysAgo(1),
          },
        ],
      },
    },
  });

  console.log(`Seeded 4 vendors: ${v1.name}, ${v2.name}, ${v3.name}, ${v4.name}`);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
