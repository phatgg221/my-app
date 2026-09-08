import prisma from '@/lib/prisma';
import { Stage, DocumentType, Prisma } from '@prisma/client';
import { VendorQueryParams } from '@/lib/validations';

export interface VendorWithMetrics {
  id: string;
  name: string;
  region: string;
  currentStage: Stage;
  updatedAt: Date;
  daysInStage: number;
  isStuck: boolean;
  documentsCount: number;
  historiesCount: number;
}

export interface VendorMetrics {
  total: number;
  stuck: number;
  active: number;
  onboarding: number;
}

export interface GetVendorsResult {
  vendors: VendorWithMetrics[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  metrics: VendorMetrics;
}

/**
 * Server Service: Encapsulates all domain business logic and database transactions.
 * Never called directly by UI components; called exclusively by API route controllers.
 */

/**
 * Fetch vendors with backend search, tab filtering, pagination, and metrics calculation.
 */
export async function getVendors(
  params: Partial<VendorQueryParams> = {}
): Promise<GetVendorsResult> {
  const search = params.search?.trim();
  const filter = params.filter ?? 'ALL';
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, params.pageSize ?? 5);

  const now = Date.now();
  // Vendors in any stage other than ACTIVE that have spent > 7 days (>= 8 full days) are flagged as Stuck
  const stuckCutoff = new Date(now - 8 * 24 * 60 * 60 * 1000);

  // Build filter condition for the requested query
  const where: Prisma.VendorWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { region: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (filter === 'ACTIVE') {
    where.currentStage = Stage.ACTIVE;
  } else if (filter === 'ONBOARDING') {
    where.currentStage = { not: Stage.ACTIVE };
  } else if (filter === 'STUCK') {
    where.currentStage = { not: Stage.ACTIVE };
    where.updatedAt = { lte: stuckCutoff };
  }

  // Concurrently execute:
  // 1. Total matching the current filter & search query (for pagination)
  // 2. Paginated vendor items
  // 3. Overall system metrics for KPI cards and filter badges
  const [filteredCount, vendors, totalCount, activeCount, stuckCount] = await Promise.all([
    prisma.vendor.count({ where }),
    prisma.vendor.findMany({
      where,
      include: {
        documents: true,
        histories: {
          orderBy: { changedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.vendor.count(),
    prisma.vendor.count({ where: { currentStage: Stage.ACTIVE } }),
    prisma.vendor.count({
      where: {
        currentStage: { not: Stage.ACTIVE },
        updatedAt: { lte: stuckCutoff },
      },
    }),
  ]);

  const onboardingCount = totalCount - activeCount;
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

  const mappedVendors: VendorWithMetrics[] = vendors.map((v) => {
    const stageEnteredAt = v.histories[0]?.changedAt
      ? new Date(v.histories[0].changedAt).getTime()
      : new Date(v.updatedAt).getTime();
    const daysInStage = Math.max(0, Math.floor((now - stageEnteredAt) / (1000 * 60 * 60 * 24)));
    const isStuck = daysInStage > 7 && v.currentStage !== Stage.ACTIVE;

    return {
      id: v.id,
      name: v.name,
      region: v.region,
      currentStage: v.currentStage,
      updatedAt: v.updatedAt,
      daysInStage,
      isStuck,
      documentsCount: v.documents.length,
      historiesCount: v.histories.length,
    };
  });

  return {
    vendors: mappedVendors,
    total: filteredCount,
    page,
    pageSize,
    totalPages,
    metrics: {
      total: totalCount,
      stuck: stuckCount,
      active: activeCount,
      onboarding: onboardingCount,
    },
  };
}
export async function getAllVendors(): Promise<VendorWithMetrics[]> {
  const vendors = await prisma.vendor.findMany({
    include: {
      documents: true,
      histories: {
        orderBy: { changedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'asc' },
  });

  const now = Date.now();

  return vendors.map((v) => {
    // Calculate days in stage based on the most recent stage transition or updatedAt
    const stageEnteredAt = v.histories[0]?.changedAt ? new Date(v.histories[0].changedAt).getTime() : new Date(v.updatedAt).getTime();
    const daysInStage = Math.max(0, Math.floor((now - stageEnteredAt) / (1000 * 60 * 60 * 24)));

    // Vendors in any stage other than ACTIVE that have spent > 7 days are flagged as Stuck
    const isStuck = daysInStage > 7 && v.currentStage !== Stage.ACTIVE;

    return {
      id: v.id,
      name: v.name,
      region: v.region,
      currentStage: v.currentStage,
      updatedAt: v.updatedAt,
      daysInStage,
      isStuck,
      documentsCount: v.documents.length,
      historiesCount: v.histories.length,
    };
  });
}

/**
 * Core Business Transaction:
 * Updates vendor stage and records audit history in an atomic Prisma transaction.
 */
export async function updateVendorStageTransaction(vendorId: string, newStage: Stage, userId: string) {
  return await prisma.$transaction(async (tx) => {
    const vendor = await tx.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new Error(`Vendor with ID "${vendorId}" was not found.`);
    }

    const previousStage = vendor.currentStage;

    // 1. Update the Vendor's stage and timestamp
    const updatedVendor = await tx.vendor.update({
      where: { id: vendorId },
      data: {
        currentStage: newStage,
        updatedAt: new Date(),
      },
    });

    // 2. Insert the immutable StageHistory audit record attributed to the active Ops Coordinator
    const historyRecord = await tx.stageHistory.create({
      data: {
        vendorId,
        userId,
        previousStage,
        newStage,
        changedAt: new Date(),
      },
      include: {
        user: true,
      },
    });

    return {
      vendor: updatedVendor,
      history: historyRecord,
    };
  });
}

/**
 * Fetch chronological audit timeline for a vendor
 */
export async function getVendorStageHistory(vendorId: string) {
  return await prisma.stageHistory.findMany({
    where: { vendorId },
    include: {
      user: true,
    },
    orderBy: { changedAt: 'desc' },
  });
}

/**
 * Fetch documents attached to a vendor
 */
export async function getVendorDocuments(vendorId: string) {
  return await prisma.document.findMany({
    where: { vendorId },
    orderBy: { uploadedAt: 'desc' },
  });
}

/**
 * Record a newly uploaded document
 */
export async function attachVendorDocument(
  vendorId: string,
  fileName: string,
  fileKey: string,
  fileUrl: string,
  type: DocumentType
) {
  return await prisma.document.create({
    data: {
      vendorId,
      fileName,
      fileKey,
      fileUrl,
      type,
      uploadedAt: new Date(),
    },
  });
}

/**
 * Fetch all available Ops Coordinators
 */
export async function getAllOpsCoordinators() {
  return await prisma.user.findMany({
    orderBy: { name: 'asc' },
  });
}

export interface UpsertGoogleUserInput {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

/**
 * Upserts a user authenticated via Google OAuth.
 * If user with given email exists, updates profile; otherwise creates a new record.
 */
export async function upsertGoogleUser(input: UpsertGoogleUserInput) {
  const existingUser = await prisma.user.findFirst({
    where: { email: input.email },
  });

  if (existingUser) {
    return await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: input.name,
        avatar: input.avatar ?? existingUser.avatar,
        role: input.role ?? existingUser.role,
      },
    });
  }

  return await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      avatar: input.avatar,
      role: input.role || 'Ops Coordinator',
    },
  });
}

/**
 * Fetch a user by primary key ID
 */
export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
  });
}

