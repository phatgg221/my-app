/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getVendors,
  getAllVendors,
  updateVendorStageTransaction,
  getVendorStageHistory,
  getVendorDocuments,
  attachVendorDocument,
  getAllOpsCoordinators,
  upsertGoogleUser,
  getUserById,
} from './vendorServerService';
import prisma from '@/lib/prisma';
import { Stage, DocumentType } from '@prisma/client';

// Mock the Prisma singleton instance
vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    vendor: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    stageHistory: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  return {
    default: mockPrisma,
  };
});

describe('vendorServerService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* =======================================================================
   * 1. getAllVendors() & Metrics Calculation
   * ======================================================================= */
  describe('getAllVendors()', () => {
    it('should calculate daysInStage and flag stuck vendors when daysInStage > 7 and not ACTIVE', async () => {
      const now = Date.now();
      const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000);

      const mockVendors = [
        {
          id: 'v-1',
          name: 'Acme Corp',
          region: 'Southeast Asia',
          currentStage: Stage.KYC_DOCS_RECEIVED,
          updatedAt: tenDaysAgo,
          histories: [{ changedAt: tenDaysAgo }],
          documents: [{ id: 'doc-1' }, { id: 'doc-2' }],
        },
      ];

      vi.mocked(prisma.vendor.findMany).mockResolvedValue(mockVendors as any);

      const result = await getAllVendors();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('v-1');
      expect(result[0].daysInStage).toBe(10);
      expect(result[0].isStuck).toBe(true); // > 7 days and NOT Active -> stuck!
      expect(result[0].documentsCount).toBe(2);
      expect(result[0].historiesCount).toBe(1);
    });

    it('should NOT flag vendor as stuck if currentStage is ACTIVE, even if > 7 days', async () => {
      const now = Date.now();
      const twelveDaysAgo = new Date(now - 12 * 24 * 60 * 60 * 1000);

      const mockVendors = [
        {
          id: 'v-active',
          name: 'Active Seller',
          region: 'North America',
          currentStage: Stage.ACTIVE,
          updatedAt: twelveDaysAgo,
          histories: [{ changedAt: twelveDaysAgo }],
          documents: [],
        },
      ];

      vi.mocked(prisma.vendor.findMany).mockResolvedValue(mockVendors as any);

      const result = await getAllVendors();

      expect(result[0].daysInStage).toBe(12);
      expect(result[0].isStuck).toBe(false); // ACTIVE vendors are never stuck
    });

    it('should NOT flag vendor as stuck if daysInStage <= 7', async () => {
      const now = Date.now();
      const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);

      const mockVendors = [
        {
          id: 'v-recent',
          name: 'Fast Onboarding',
          region: 'Europe',
          currentStage: Stage.CONTRACT_SENT,
          updatedAt: threeDaysAgo,
          histories: [{ changedAt: threeDaysAgo }],
          documents: [],
        },
      ];

      vi.mocked(prisma.vendor.findMany).mockResolvedValue(mockVendors as any);

      const result = await getAllVendors();

      expect(result[0].daysInStage).toBe(3);
      expect(result[0].isStuck).toBe(false);
    });

    it('should fall back to updatedAt when histories array is empty', async () => {
      const now = Date.now();
      const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);

      const mockVendors = [
        {
          id: 'v-no-history',
          name: 'New Vendor',
          region: 'East Asia',
          currentStage: Stage.CONTRACT_SENT,
          updatedAt: fiveDaysAgo,
          histories: [],
          documents: [],
        },
      ];

      vi.mocked(prisma.vendor.findMany).mockResolvedValue(mockVendors as any);

      const result = await getAllVendors();

      expect(result[0].daysInStage).toBe(5);
      expect(result[0].isStuck).toBe(false);
    });
  });

  /* =======================================================================
   * 1b. getVendors() with Backend Search, Filters, Pagination, & Metrics
   * ======================================================================= */
  describe('getVendors()', () => {
    it('should return paginated vendors and metrics with default parameters', async () => {
      const now = Date.now();
      const mockVendors = [
        {
          id: 'v-1',
          name: 'Saigon Retail',
          region: 'HCMC',
          currentStage: Stage.CONTRACT_SENT,
          updatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
          histories: [{ changedAt: new Date(now - 2 * 24 * 60 * 60 * 1000) }],
          documents: [],
        },
      ];

      vi.mocked(prisma.vendor.count)
        .mockResolvedValueOnce(1) // filteredCount
        .mockResolvedValueOnce(6) // totalCount
        .mockResolvedValueOnce(1) // activeCount
        .mockResolvedValueOnce(3); // stuckCount

      vi.mocked(prisma.vendor.findMany).mockResolvedValue(mockVendors as any);

      const result = await getVendors();

      expect(prisma.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 5,
        })
      );

      expect(result.vendors).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(5);
      expect(result.totalPages).toBe(1);
      expect(result.metrics).toEqual({
        total: 6,
        active: 1,
        stuck: 3,
        onboarding: 5,
      });
    });

    it('should apply case-insensitive search filter across name and region', async () => {
      vi.mocked(prisma.vendor.count).mockResolvedValue(0);
      vi.mocked(prisma.vendor.findMany).mockResolvedValue([]);

      await getVendors({ search: 'Hanoi', filter: 'ALL', page: 1, pageSize: 5 });

      expect(prisma.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'Hanoi', mode: 'insensitive' } },
              { region: { contains: 'Hanoi', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should apply ACTIVE filter to Prisma query', async () => {
      vi.mocked(prisma.vendor.count).mockResolvedValue(0);
      vi.mocked(prisma.vendor.findMany).mockResolvedValue([]);

      await getVendors({ filter: 'ACTIVE', page: 1, pageSize: 5 });

      expect(prisma.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            currentStage: Stage.ACTIVE,
          },
        })
      );
    });

    it('should apply ONBOARDING filter to Prisma query', async () => {
      vi.mocked(prisma.vendor.count).mockResolvedValue(0);
      vi.mocked(prisma.vendor.findMany).mockResolvedValue([]);

      await getVendors({ filter: 'ONBOARDING', page: 1, pageSize: 5 });

      expect(prisma.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            currentStage: { not: Stage.ACTIVE },
          },
        })
      );
    });

    it('should apply STUCK filter with updatedAt cutoff to Prisma query', async () => {
      vi.mocked(prisma.vendor.count).mockResolvedValue(0);
      vi.mocked(prisma.vendor.findMany).mockResolvedValue([]);

      await getVendors({ filter: 'STUCK', page: 1, pageSize: 5 });

      expect(prisma.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            currentStage: { not: Stage.ACTIVE },
            updatedAt: { lte: expect.any(Date) },
          },
        })
      );
    });

    it('should calculate correct pagination skip and take when page > 1', async () => {
      vi.mocked(prisma.vendor.count)
        .mockResolvedValueOnce(12) // filteredCount
        .mockResolvedValueOnce(12) // totalCount
        .mockResolvedValueOnce(2) // activeCount
        .mockResolvedValueOnce(4); // stuckCount

      vi.mocked(prisma.vendor.findMany).mockResolvedValue([]);

      const result = await getVendors({ page: 2, pageSize: 5 });

      expect(prisma.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(5);
      expect(result.totalPages).toBe(3); // 12 items / 5 per page = 3 pages
      expect(result.total).toBe(12);
    });

    it('should clamp non-positive page or pageSize to 1 and ignore whitespace-only search', async () => {
      vi.mocked(prisma.vendor.count).mockResolvedValue(0);
      vi.mocked(prisma.vendor.findMany).mockResolvedValue([]);

      const result = await getVendors({ page: -2, pageSize: 0, search: '   ' });

      expect(prisma.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 1,
        })
      );
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(1);

      // Also test explicit undefined values to cover nullish coalescing defaults
      const defaultResult = await getVendors({ page: undefined, pageSize: undefined });
      expect(defaultResult.page).toBe(1);
      expect(defaultResult.pageSize).toBe(5);
    });

    it('should map vendor properties correctly including isStuck and daysInStage', async () => {
      const now = Date.now();
      const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000);
      const mockVendors = [
        {
          id: 'v-stuck',
          name: 'Stuck Vendor',
          region: 'Da Nang',
          currentStage: Stage.KYC_DOCS_RECEIVED,
          updatedAt: tenDaysAgo,
          histories: [{ changedAt: tenDaysAgo }],
          documents: [{ id: 'd-1' }],
        },
        {
          id: 'v-active',
          name: 'Active Vendor',
          region: 'HCMC',
          currentStage: Stage.ACTIVE,
          updatedAt: tenDaysAgo,
          histories: [{ changedAt: tenDaysAgo }],
          documents: [],
        },
        {
          id: 'v-fallback',
          name: 'Fallback Vendor',
          region: 'Hue',
          currentStage: Stage.CONTRACT_SENT,
          updatedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
          histories: [],
          documents: [],
        },
      ];

      vi.mocked(prisma.vendor.count)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      vi.mocked(prisma.vendor.findMany).mockResolvedValue(mockVendors as any);

      const result = await getVendors({ page: 1, pageSize: 10 });

      expect(result.vendors).toHaveLength(3);
      expect(result.vendors[0].isStuck).toBe(true);
      expect(result.vendors[0].daysInStage).toBe(10);
      expect(result.vendors[0].documentsCount).toBe(1);
      expect(result.vendors[1].isStuck).toBe(false); // ACTIVE stage is never stuck
      expect(result.vendors[2].isStuck).toBe(false); // 3 days is not stuck
      expect(result.vendors[2].daysInStage).toBe(3);
    });
  });

  /* =======================================================================
   * 2. updateVendorStageTransaction()
   * ======================================================================= */
  describe('updateVendorStageTransaction()', () => {
    it('should throw an error if the vendor does not exist', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          vendor: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        };
        return await callback(tx);
      });

      await expect(
        updateVendorStageTransaction('invalid-id', Stage.CONTRACT_SIGNED, 'user-1')
      ).rejects.toThrow('Vendor with ID "invalid-id" was not found.');
    });

    it('should update vendor stage and record StageHistory inside a single transaction', async () => {
      const existingVendor = {
        id: 'vendor-123',
        name: 'TechMart',
        region: 'Global',
        currentStage: Stage.CONTRACT_SENT,
      };

      const updatedVendor = {
        ...existingVendor,
        currentStage: Stage.CONTRACT_SIGNED,
        updatedAt: new Date(),
      };

      const createdHistory = {
        id: 'history-1',
        vendorId: 'vendor-123',
        userId: 'user-ops-1',
        previousStage: Stage.CONTRACT_SENT,
        newStage: Stage.CONTRACT_SIGNED,
        changedAt: new Date(),
        user: { id: 'user-ops-1', name: 'Sarah Jenkins' },
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          vendor: {
            findUnique: vi.fn().mockResolvedValue(existingVendor),
            update: vi.fn().mockResolvedValue(updatedVendor),
          },
          stageHistory: {
            create: vi.fn().mockResolvedValue(createdHistory),
          },
        };
        return await callback(tx);
      });

      const result = await updateVendorStageTransaction(
        'vendor-123',
        Stage.CONTRACT_SIGNED,
        'user-ops-1'
      );

      expect(result.vendor.currentStage).toBe(Stage.CONTRACT_SIGNED);
      expect(result.history.previousStage).toBe(Stage.CONTRACT_SENT);
      expect(result.history.newStage).toBe(Stage.CONTRACT_SIGNED);
      expect(result.history.userId).toBe('user-ops-1');
    });

    it('should reject advancing to KYC_DOCS_RECEIVED (Step 3) if vendor has no documents uploaded', async () => {
      const existingVendor = {
        id: 'vendor-no-docs',
        name: 'No Docs Co',
        region: 'Hanoi',
        currentStage: Stage.CONTRACT_SIGNED,
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          vendor: {
            findUnique: vi.fn().mockResolvedValue(existingVendor),
          },
          document: {
            count: vi.fn().mockResolvedValue(0),
          },
        };
        return await callback(tx);
      });

      await expect(
        updateVendorStageTransaction('vendor-no-docs', Stage.KYC_DOCS_RECEIVED, 'user-1')
      ).rejects.toThrow(
        'Cannot advance to KYC Docs Received, KYC Verified, or Active because no documents have been uploaded for this vendor.'
      );
    });

    it('should reject advancing to KYC_VERIFIED (Step 4) or ACTIVE (Step 5) if vendor has no documents uploaded', async () => {
      const existingVendor = {
        id: 'vendor-no-docs',
        name: 'No Docs Co',
        region: 'Hanoi',
        currentStage: Stage.CONTRACT_SIGNED,
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          vendor: {
            findUnique: vi.fn().mockResolvedValue(existingVendor),
          },
          document: {
            count: vi.fn().mockResolvedValue(0),
          },
        };
        return await callback(tx);
      });

      await expect(
        updateVendorStageTransaction('vendor-no-docs', Stage.KYC_VERIFIED, 'user-1')
      ).rejects.toThrow(
        'Cannot advance to KYC Docs Received, KYC Verified, or Active because no documents have been uploaded for this vendor.'
      );

      await expect(
        updateVendorStageTransaction('vendor-no-docs', Stage.ACTIVE, 'user-1')
      ).rejects.toThrow(
        'Cannot advance to KYC Docs Received, KYC Verified, or Active because no documents have been uploaded for this vendor.'
      );
    });

    it('should allow advancing to KYC_DOCS_RECEIVED (Step 3) if vendor has uploaded documents', async () => {
      const existingVendor = {
        id: 'vendor-with-docs',
        name: 'Docs Co',
        region: 'HCMC',
        currentStage: Stage.CONTRACT_SIGNED,
      };

      const updatedVendor = {
        ...existingVendor,
        currentStage: Stage.KYC_DOCS_RECEIVED,
        updatedAt: new Date(),
      };

      const createdHistory = {
        id: 'history-2',
        vendorId: 'vendor-with-docs',
        userId: 'user-ops-1',
        previousStage: Stage.CONTRACT_SIGNED,
        newStage: Stage.KYC_DOCS_RECEIVED,
        changedAt: new Date(),
        user: { id: 'user-ops-1', name: 'Sarah Jenkins' },
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          vendor: {
            findUnique: vi.fn().mockResolvedValue(existingVendor),
            update: vi.fn().mockResolvedValue(updatedVendor),
          },
          document: {
            count: vi.fn().mockResolvedValue(2),
          },
          stageHistory: {
            create: vi.fn().mockResolvedValue(createdHistory),
          },
        };
        return await callback(tx);
      });

      const result = await updateVendorStageTransaction(
        'vendor-with-docs',
        Stage.KYC_DOCS_RECEIVED,
        'user-ops-1'
      );

      expect(result.vendor.currentStage).toBe(Stage.KYC_DOCS_RECEIVED);
      expect(result.history.newStage).toBe(Stage.KYC_DOCS_RECEIVED);
    });
  });

  /* =======================================================================
   * 3. getVendorStageHistory()
   * ======================================================================= */
  describe('getVendorStageHistory()', () => {
    it('should fetch stage histories ordered chronologically descending with user included', async () => {
      const mockHistories = [
        { id: 'h-1', vendorId: 'v-1', newStage: Stage.KYC_DOCS_RECEIVED },
        { id: 'h-2', vendorId: 'v-1', newStage: Stage.CONTRACT_SENT },
      ];

      vi.mocked(prisma.stageHistory.findMany).mockResolvedValue(mockHistories as any);

      const result = await getVendorStageHistory('v-1');

      expect(prisma.stageHistory.findMany).toHaveBeenCalledWith({
        where: { vendorId: 'v-1' },
        include: { user: true },
        orderBy: { changedAt: 'desc' },
      });
      expect(result).toEqual(mockHistories);
    });
  });

  /* =======================================================================
   * 4. getVendorDocuments()
   * ======================================================================= */
  describe('getVendorDocuments()', () => {
    it('should fetch documents ordered by uploadedAt desc', async () => {
      const mockDocs = [{ id: 'doc-1', fileName: 'license.pdf' }];
      vi.mocked(prisma.document.findMany).mockResolvedValue(mockDocs as any);

      const result = await getVendorDocuments('v-1');

      expect(prisma.document.findMany).toHaveBeenCalledWith({
        where: { vendorId: 'v-1' },
        orderBy: { uploadedAt: 'desc' },
      });
      expect(result).toEqual(mockDocs);
    });
  });

  /* =======================================================================
   * 5. attachVendorDocument()
   * ======================================================================= */
  describe('attachVendorDocument()', () => {
    it('should create document record in database', async () => {
      const newDoc = {
        id: 'doc-new',
        vendorId: 'v-1',
        fileName: 'passport.png',
        fileKey: 'docs/passport.png',
        fileUrl: 'http://localhost:9002/shoppee-bucket/docs/passport.png',
        type: DocumentType.IDENTITY_DOCUMENT,
        uploadedAt: new Date(),
      };

      vi.mocked(prisma.document.create).mockResolvedValue(newDoc as any);

      const result = await attachVendorDocument(
        'v-1',
        'passport.png',
        'docs/passport.png',
        'http://localhost:9002/shoppee-bucket/docs/passport.png',
        DocumentType.IDENTITY_DOCUMENT
      );

      expect(prisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            vendorId: 'v-1',
            fileName: 'passport.png',
            fileKey: 'docs/passport.png',
            type: DocumentType.IDENTITY_DOCUMENT,
          }),
        })
      );
      expect(result.id).toBe('doc-new');
    });
  });

  /* =======================================================================
   * 6. getAllOpsCoordinators()
   * ======================================================================= */
  describe('getAllOpsCoordinators()', () => {
    it('should fetch users ordered by name ascending', async () => {
      const mockUsers = [
        { id: 'u-1', name: 'Alex Chen' },
        { id: 'u-2', name: 'Sarah Jenkins' },
      ];
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);

      const result = await getAllOpsCoordinators();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('upsertGoogleUser()', () => {
    it('should update existing user if email is already present', async () => {
      const existingUser = {
        id: 'u-existing',
        name: 'Old Name',
        email: 'sarah@shopee.com',
        avatar: 'old-avatar.jpg',
        role: 'Coordinator',
      };

      const updatedUser = {
        ...existingUser,
        name: 'Sarah Jenkins',
        avatar: 'new-avatar.jpg',
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(existingUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      const result = await upsertGoogleUser({
        name: 'Sarah Jenkins',
        email: 'sarah@shopee.com',
        avatar: 'new-avatar.jpg',
      });

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'sarah@shopee.com' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-existing' },
        data: {
          name: 'Sarah Jenkins',
          avatar: 'new-avatar.jpg',
          role: 'Coordinator',
        },
      });
      expect(result.name).toBe('Sarah Jenkins');
    });

    it('should retain existing avatar and role when updating user if input does not provide them', async () => {
      const existingUser = {
        id: 'u-existing-2',
        name: 'Alex',
        email: 'alex@shopee.com',
        avatar: 'existing-avatar.jpg',
        role: 'Senior Ops Coordinator',
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(existingUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...existingUser,
        name: 'Alex Chen',
      } as any);

      await upsertGoogleUser({
        name: 'Alex Chen',
        email: 'alex@shopee.com',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-existing-2' },
        data: {
          name: 'Alex Chen',
          avatar: 'existing-avatar.jpg',
          role: 'Senior Ops Coordinator',
        },
      });
    });

    it('should create new user with default role if email is not found', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const createdUser = {
        id: 'u-new',
        name: 'New Google User',
        email: 'new@gmail.com',
        avatar: 'google-photo.jpg',
        role: 'Ops Coordinator',
      };

      vi.mocked(prisma.user.create).mockResolvedValue(createdUser as any);

      const result = await upsertGoogleUser({
        name: 'New Google User',
        email: 'new@gmail.com',
        avatar: 'google-photo.jpg',
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'New Google User',
          email: 'new@gmail.com',
          avatar: 'google-photo.jpg',
          role: 'Ops Coordinator',
        },
      });
      expect(result.id).toBe('u-new');
    });

    it('should use custom role when provided for new user', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const createdUser = {
        id: 'u-custom',
        name: 'Compliance Officer',
        email: 'officer@shopee.com',
        avatar: undefined,
        role: 'Compliance Lead',
      };

      vi.mocked(prisma.user.create).mockResolvedValue(createdUser as any);

      const result = await upsertGoogleUser({
        name: 'Compliance Officer',
        email: 'officer@shopee.com',
        role: 'Compliance Lead',
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Compliance Officer',
          email: 'officer@shopee.com',
          avatar: undefined,
          role: 'Compliance Lead',
        },
      });
      expect(result.role).toBe('Compliance Lead');
    });
  });


  describe('getUserById()', () => {
    it('should find user by primary key ID', async () => {
      const mockUser = { id: 'u-123', name: 'Alex' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await getUserById('u-123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u-123' },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
