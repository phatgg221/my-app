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

  // 2. Seed 20 Vendors matching Vietnamese provinces specification
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

  // Vendor 7: Hai Phong | Active (4 days ago)
  const v7 = await prisma.vendor.create({
    data: {
      name: 'Hai Phong Maritime Logistics JSC',
      region: 'Hai Phong',
      currentStage: Stage.ACTIVE,
      updatedAt: daysAgo(4),
      histories: {
        create: [
          {
            userId: sarah.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(22),
          },
          {
            userId: sarah.id,
            previousStage: Stage.CONTRACT_SIGNED,
            newStage: Stage.KYC_DOCS_RECEIVED,
            changedAt: daysAgo(16),
          },
          {
            userId: alex.id,
            previousStage: Stage.KYC_DOCS_RECEIVED,
            newStage: Stage.KYC_VERIFIED,
            changedAt: daysAgo(10),
          },
          {
            userId: david.id,
            previousStage: Stage.KYC_VERIFIED,
            newStage: Stage.ACTIVE,
            changedAt: daysAgo(4),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'Hai_Phong_Port_Operation_Permit.pdf',
            fileKey: 'documents/v7-port-permit.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v7-port-permit.pdf',
            type: DocumentType.BUSINESS_LICENSE,
            uploadedAt: daysAgo(16),
          },
        ],
      },
    },
  });

  // Vendor 8: Binh Duong | Contract Signed (Stuck: 14 days ago)
  const v8 = await prisma.vendor.create({
    data: {
      name: 'Binh Duong Wood & Furniture Corp',
      region: 'Binh Duong',
      currentStage: Stage.CONTRACT_SIGNED,
      updatedAt: daysAgo(14),
      histories: {
        create: [
          {
            userId: david.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(14),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'Binh_Duong_Wood_FSC_Cert.pdf',
            fileKey: 'documents/v8-wood-cert.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v8-wood-cert.pdf',
            type: DocumentType.OTHER,
            uploadedAt: daysAgo(14),
          },
        ],
      },
    },
  });

  // Vendor 9: Dong Nai | KYC Verified (2 days ago - On Track)
  const v9 = await prisma.vendor.create({
    data: {
      name: 'Dong Nai Precision Engineering Ltd',
      region: 'Dong Nai',
      currentStage: Stage.KYC_VERIFIED,
      updatedAt: daysAgo(2),
      histories: {
        create: [
          {
            userId: alex.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(12),
          },
          {
            userId: alex.id,
            previousStage: Stage.CONTRACT_SIGNED,
            newStage: Stage.KYC_DOCS_RECEIVED,
            changedAt: daysAgo(7),
          },
          {
            userId: sarah.id,
            previousStage: Stage.KYC_DOCS_RECEIVED,
            newStage: Stage.KYC_VERIFIED,
            changedAt: daysAgo(2),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'Dong_Nai_Factory_License.pdf',
            fileKey: 'documents/v9-factory-license.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v9-factory-license.pdf',
            type: DocumentType.BUSINESS_LICENSE,
            uploadedAt: daysAgo(7),
          },
          {
            fileName: 'CEO_Passport_Scan.pdf',
            fileKey: 'documents/v9-ceo-passport.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v9-ceo-passport.pdf',
            type: DocumentType.IDENTITY_DOCUMENT,
            uploadedAt: daysAgo(7),
          },
        ],
      },
    },
  });

  // Vendor 10: Quang Ninh | KYC Docs Received (Stuck: 11 days ago)
  const v10 = await prisma.vendor.create({
    data: {
      name: 'Quang Ninh Pearl & Marine Products',
      region: 'Quang Ninh',
      currentStage: Stage.KYC_DOCS_RECEIVED,
      updatedAt: daysAgo(11),
      histories: {
        create: [
          {
            userId: david.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(17),
          },
          {
            userId: david.id,
            previousStage: Stage.CONTRACT_SIGNED,
            newStage: Stage.KYC_DOCS_RECEIVED,
            changedAt: daysAgo(11),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'Quang_Ninh_Aquaculture_Certificate.pdf',
            fileKey: 'documents/v10-aquaculture-cert.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v10-aquaculture-cert.pdf',
            type: DocumentType.BUSINESS_LICENSE,
            uploadedAt: daysAgo(11),
          },
        ],
      },
    },
  });

  // Vendor 11: An Giang | Active (5 days ago)
  const v11 = await prisma.vendor.create({
    data: {
      name: 'An Giang Rice Export Corporation',
      region: 'An Giang',
      currentStage: Stage.ACTIVE,
      updatedAt: daysAgo(5),
      histories: {
        create: [
          {
            userId: alex.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(25),
          },
          {
            userId: alex.id,
            previousStage: Stage.CONTRACT_SIGNED,
            newStage: Stage.KYC_DOCS_RECEIVED,
            changedAt: daysAgo(18),
          },
          {
            userId: sarah.id,
            previousStage: Stage.KYC_DOCS_RECEIVED,
            newStage: Stage.KYC_VERIFIED,
            changedAt: daysAgo(12),
          },
          {
            userId: alex.id,
            previousStage: Stage.KYC_VERIFIED,
            newStage: Stage.ACTIVE,
            changedAt: daysAgo(5),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'An_Giang_Rice_Export_License.pdf',
            fileKey: 'documents/v11-rice-export.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v11-rice-export.pdf',
            type: DocumentType.BUSINESS_LICENSE,
            uploadedAt: daysAgo(18),
          },
        ],
      },
    },
  });

  // Vendor 12: Hue | Contract Sent (1 day ago - On Track)
  const v12 = await prisma.vendor.create({
    data: {
      name: 'Hue Imperial Ceramic & Tea Co',
      region: 'Hue',
      currentStage: Stage.CONTRACT_SENT,
      updatedAt: daysAgo(1),
      histories: {
        create: [
          {
            userId: david.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SENT,
            changedAt: daysAgo(1),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'Hue_Heritage_Trademark_Doc.pdf',
            fileKey: 'documents/v12-trademark.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v12-trademark.pdf',
            type: DocumentType.OTHER,
            uploadedAt: daysAgo(1),
          },
        ],
      },
    },
  });

  // Vendor 13: Nha Trang | KYC Docs Received (4 days ago - On Track)
  const v13 = await prisma.vendor.create({
    data: {
      name: 'Nha Trang Seafood Processing Co',
      region: 'Nha Trang',
      currentStage: Stage.KYC_DOCS_RECEIVED,
      updatedAt: daysAgo(4),
      histories: {
        create: [
          {
            userId: sarah.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(10),
          },
          {
            userId: david.id,
            previousStage: Stage.CONTRACT_SIGNED,
            newStage: Stage.KYC_DOCS_RECEIVED,
            changedAt: daysAgo(4),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'HACCP_Seafood_Safety_Cert.pdf',
            fileKey: 'documents/v13-haccp-cert.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v13-haccp-cert.pdf',
            type: DocumentType.OTHER,
            uploadedAt: daysAgo(4),
          },
        ],
      },
    },
  });

  // Vendor 14: Vung Tau | Active (2 days ago)
  const v14 = await prisma.vendor.create({
    data: {
      name: 'Vung Tau Petroleum Equipment Services',
      region: 'Vung Tau',
      currentStage: Stage.ACTIVE,
      updatedAt: daysAgo(2),
      histories: {
        create: [
          {
            userId: alex.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(20),
          },
          {
            userId: alex.id,
            previousStage: Stage.CONTRACT_SIGNED,
            newStage: Stage.KYC_DOCS_RECEIVED,
            changedAt: daysAgo(14),
          },
          {
            userId: sarah.id,
            previousStage: Stage.KYC_DOCS_RECEIVED,
            newStage: Stage.KYC_VERIFIED,
            changedAt: daysAgo(7),
          },
          {
            userId: sarah.id,
            previousStage: Stage.KYC_VERIFIED,
            newStage: Stage.ACTIVE,
            changedAt: daysAgo(2),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'Offshore_Safety_Standard_2026.pdf',
            fileKey: 'documents/v14-safety-std.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v14-safety-std.pdf',
            type: DocumentType.OTHER,
            uploadedAt: daysAgo(14),
          },
          {
            fileName: 'Business_Registration_Vung_Tau.pdf',
            fileKey: 'documents/v14-biz-reg.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v14-biz-reg.pdf',
            type: DocumentType.BUSINESS_LICENSE,
            uploadedAt: daysAgo(14),
          },
        ],
      },
    },
  });

  // Vendor 15: Lam Dong | Contract Signed (3 days ago - On Track)
  const v15 = await prisma.vendor.create({
    data: {
      name: 'Da Lat Organic Farm & Flowers',
      region: 'Lam Dong',
      currentStage: Stage.CONTRACT_SIGNED,
      updatedAt: daysAgo(3),
      histories: {
        create: [
          {
            userId: david.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(3),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'Da_Lat_Organic_GAP_Cert.pdf',
            fileKey: 'documents/v15-organic-gap.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v15-organic-gap.pdf',
            type: DocumentType.OTHER,
            uploadedAt: daysAgo(3),
          },
        ],
      },
    },
  });

  // Vendor 16: Bac Ninh | Active (6 days ago)
  const v16 = await prisma.vendor.create({
    data: {
      name: 'Bac Ninh Smart Component Manufacturing',
      region: 'Bac Ninh',
      currentStage: Stage.ACTIVE,
      updatedAt: daysAgo(6),
      histories: {
        create: [
          {
            userId: alex.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(28),
          },
          {
            userId: sarah.id,
            previousStage: Stage.CONTRACT_SIGNED,
            newStage: Stage.KYC_DOCS_RECEIVED,
            changedAt: daysAgo(21),
          },
          {
            userId: sarah.id,
            previousStage: Stage.KYC_DOCS_RECEIVED,
            newStage: Stage.KYC_VERIFIED,
            changedAt: daysAgo(12),
          },
          {
            userId: david.id,
            previousStage: Stage.KYC_VERIFIED,
            newStage: Stage.ACTIVE,
            changedAt: daysAgo(6),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'Bac_Ninh_HighTech_Park_Permit.pdf',
            fileKey: 'documents/v16-hightech-permit.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v16-hightech-permit.pdf',
            type: DocumentType.BUSINESS_LICENSE,
            uploadedAt: daysAgo(21),
          },
        ],
      },
    },
  });

  // Vendor 17: Long An | Contract Sent (Stuck: 15 days ago)
  const v17 = await prisma.vendor.create({
    data: {
      name: 'Long An Plastic & Packaging Co',
      region: 'Long An',
      currentStage: Stage.CONTRACT_SENT,
      updatedAt: daysAgo(15),
      histories: {
        create: [
          {
            userId: david.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SENT,
            changedAt: daysAgo(15),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'Long_An_Environmental_Impact_Assesment.pdf',
            fileKey: 'documents/v17-enviro-assessment.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v17-enviro-assessment.pdf',
            type: DocumentType.OTHER,
            uploadedAt: daysAgo(15),
          },
        ],
      },
    },
  });

  // Vendor 18: Tien Giang | KYC Verified (Stuck: 9 days ago)
  const v18 = await prisma.vendor.create({
    data: {
      name: 'Tien Giang Tropical Fruit Export',
      region: 'Tien Giang',
      currentStage: Stage.KYC_VERIFIED,
      updatedAt: daysAgo(9),
      histories: {
        create: [
          {
            userId: sarah.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(24),
          },
          {
            userId: alex.id,
            previousStage: Stage.CONTRACT_SIGNED,
            newStage: Stage.KYC_DOCS_RECEIVED,
            changedAt: daysAgo(16),
          },
          {
            userId: alex.id,
            previousStage: Stage.KYC_DOCS_RECEIVED,
            newStage: Stage.KYC_VERIFIED,
            changedAt: daysAgo(9),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'GlobalGAP_Fruit_Certification.pdf',
            fileKey: 'documents/v18-globalgap-cert.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v18-globalgap-cert.pdf',
            type: DocumentType.OTHER,
            uploadedAt: daysAgo(16),
          },
          {
            fileName: 'Legal_Rep_National_ID.pdf',
            fileKey: 'documents/v18-national-id.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v18-national-id.pdf',
            type: DocumentType.IDENTITY_DOCUMENT,
            uploadedAt: daysAgo(16),
          },
        ],
      },
    },
  });

  // Vendor 19: Nghe An | KYC Docs Received (2 days ago - On Track)
  const v19 = await prisma.vendor.create({
    data: {
      name: 'Nghe An Solar Energy & Equipment',
      region: 'Nghe An',
      currentStage: Stage.KYC_DOCS_RECEIVED,
      updatedAt: daysAgo(2),
      histories: {
        create: [
          {
            userId: alex.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(8),
          },
          {
            userId: david.id,
            previousStage: Stage.CONTRACT_SIGNED,
            newStage: Stage.KYC_DOCS_RECEIVED,
            changedAt: daysAgo(2),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'Solar_Tech_Compliance_Dossier.pdf',
            fileKey: 'documents/v19-solar-compliance.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v19-solar-compliance.pdf',
            type: DocumentType.OTHER,
            uploadedAt: daysAgo(2),
          },
        ],
      },
    },
  });

  // Vendor 20: Tay Ninh | Contract Signed (1 day ago - On Track)
  const v20 = await prisma.vendor.create({
    data: {
      name: 'Tay Ninh Cashew & Spice Processing',
      region: 'Tay Ninh',
      currentStage: Stage.CONTRACT_SIGNED,
      updatedAt: daysAgo(1),
      histories: {
        create: [
          {
            userId: sarah.id,
            previousStage: Stage.CONTRACT_SENT,
            newStage: Stage.CONTRACT_SIGNED,
            changedAt: daysAgo(1),
          },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'Tay_Ninh_Enterprise_License.pdf',
            fileKey: 'documents/v20-enterprise-license.pdf',
            fileUrl: 'http://localhost:9002/shoppee-bucket/documents/v20-enterprise-license.pdf',
            type: DocumentType.BUSINESS_LICENSE,
            uploadedAt: daysAgo(1),
          },
        ],
      },
    },
  });

  const vendors = [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20];

  console.log(
    `Successfully seeded ${vendors.length} vendors across Vietnamese provinces:\n` +
      vendors.map((v) => ` - ${v.name} (${v.region}) [${v.currentStage}]`).join('\n')
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
