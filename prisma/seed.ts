import { Stage, DocumentType } from '@prisma/client';
import prisma from '../lib/prisma';

async function main() {
  console.log('Seeding initial data with Vietnamese provinces...');

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

  // 2. Seed Vendors matching the spreadsheet specification (Vietnamese provinces)
  // Vendor 1: HCMC | Active
  const v1 = await prisma.vendor.create({
    data: {
      name: 'Saigon Retail Trading Company',
      region: 'HCMC',
      currentStage: Stage.ACTIVE,
      updatedAt: daysAgo(1),
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
            changedAt: daysAgo(11),
          },
          {
            userId: sarah.id,
            previousStage: Stage.KYC_DOCS_RECEIVED,
            newStage: Stage.KYC_VERIFIED,
            changedAt: daysAgo(5),
          },
          {
            userId: alex.id,
            previousStage: Stage.KYC_VERIFIED,
            newStage: Stage.ACTIVE,
            changedAt: daysAgo(1),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'Saigon_Business_License_2026.pdf',
            fileKey: 'documents/v1-saigon-license.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v1-saigon-license.pdf',
            type: DocumentType.BUSINESS_LICENSE,
            uploadedAt: daysAgo(11),
          },
        ],
      },
    },
  });

  // Vendor 2: Can Tho | KYC Docs Received (Stuck: 12 days ago)
  const v2 = await prisma.vendor.create({
    data: {
      name: 'Mekong Delta Agri Products Company',
      region: 'Can Tho',
      currentStage: Stage.KYC_DOCS_RECEIVED,
      updatedAt: daysAgo(12),
      histories: {
        create: [
          {
            userId: david.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(18),
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
            fileName: 'Mekong_Food_Safety_Cert.pdf',
            fileKey: 'documents/v2-mekong-cert.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v2-mekong-cert.pdf',
            type: DocumentType.OTHER,
            uploadedAt: daysAgo(12),
          },
        ],
      },
    },
  });

  // Vendor 3: Hanoi | Contract Signed (Stuck: 9 days ago)
  const v3 = await prisma.vendor.create({
    data: {
      name: 'Thang Long Electronics Company',
      region: 'Hanoi',
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
            fileName: 'Legal_Representative_ID.png',
            fileKey: 'documents/v3-director-id.png',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v3-director-id.png',
            type: DocumentType.IDENTITY_DOCUMENT,
            uploadedAt: daysAgo(9),
          },
        ],
      },
    },
  });

  // Vendor 4: HCMC | KYC Verified (3 days ago - On Track)
  const v4 = await prisma.vendor.create({
    data: {
      name: 'Gia Dinh Logistics & Supply Company',
      region: 'HCMC',
      currentStage: Stage.KYC_VERIFIED,
      updatedAt: daysAgo(3),
      histories: {
        create: [
          {
            userId: david.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(14),
          },
          {
            userId: david.id,
            previousStage: Stage.CONTRACT_SIGNED,
            newStage: Stage.KYC_DOCS_RECEIVED,
            changedAt: daysAgo(8),
          },
          {
            userId: sarah.id,
            previousStage: Stage.KYC_DOCS_RECEIVED,
            newStage: Stage.KYC_VERIFIED,
            changedAt: daysAgo(3),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'HCMC_Investment_Registration.pdf',
            fileKey: 'documents/v4-investment-cert.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v4-investment-cert.pdf',
            type: DocumentType.BUSINESS_LICENSE,
            uploadedAt: daysAgo(8),
          },
        ],
      },
    },
  });

  // Vendor 5: Da Nang | KYC Docs Received (Stuck: 10 days ago)
  const v5 = await prisma.vendor.create({
    data: {
      name: 'Son Tra Handicrafts & Goods Company',
      region: 'Da Nang',
      currentStage: Stage.KYC_DOCS_RECEIVED,
      updatedAt: daysAgo(10),
      histories: {
        create: [
          {
            userId: alex.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(15),
          },
          {
            userId: alex.id,
            previousStage: Stage.CONTRACT_SIGNED,
            newStage: Stage.KYC_DOCS_RECEIVED,
            changedAt: daysAgo(10),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'Da_Nang_Tax_Registration.pdf',
            fileKey: 'documents/v5-tax-cert.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v5-tax-cert.pdf',
            type: DocumentType.BUSINESS_LICENSE,
            uploadedAt: daysAgo(10),
          },
        ],
      },
    },
  });

  // Vendor 6: HCMC | Contract Sent (2 days ago - On Track)
  const v6 = await prisma.vendor.create({
    data: {
      name: 'Ben Thanh Consumer Goods Company',
      region: 'HCMC',
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

  console.log(
    `Successfully seeded 6 vendors across Vietnamese provinces: \n` +
      `- ${v1.name} (${v1.region}) [${v1.currentStage}]\n` +
      `- ${v2.name} (${v2.region}) [${v2.currentStage}]\n` +
      `- ${v3.name} (${v3.region}) [${v3.currentStage}]\n` +
      `- ${v4.name} (${v4.region}) [${v4.currentStage}]\n` +
      `- ${v5.name} (${v5.region}) [${v5.currentStage}]\n` +
      `- ${v6.name} (${v6.region}) [${v6.currentStage}]`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
