import apiClient from '@/lib/apiClient';
import { Stage, DocumentType } from '@prisma/client';
import { UpdateVendorStageSchema, VendorIdParamSchema, formatZodError } from '@/lib/validations';

export type { Stage, DocumentType };

export interface VendorItem {
  id: string;
  name: string;
  region: string;
  currentStage: Stage;
  updatedAt: string;
  daysInStage: number;
  isStuck: boolean;
  documentsCount: number;
  historiesCount: number;
}

export interface StageHistoryItem {
  id: string;
  vendorId: string;
  userId: string;
  previousStage: Stage;
  newStage: Stage;
  changedAt: string;
  user: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
  };
}

export interface VendorDocumentItem {
  id: string;
  vendorId: string;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  type: DocumentType;
  uploadedAt: string;
}

export type FilterMode = 'ALL' | 'STUCK' | 'ACTIVE' | 'ONBOARDING';

export interface VendorMetrics {
  total: number;
  stuck: number;
  active: number;
  onboarding: number;
}

export interface FetchVendorsParams {
  search?: string;
  filter?: FilterMode;
  page?: number;
  pageSize?: number;
}

export interface FetchVendorsResponse {
  vendors: VendorItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  metrics: VendorMetrics;
}

/**
 * VendorService:
 * Frontend Client Service abstracting all vendor API calls away from React components.
 * Strictly performs client-side Zod validation before dispatching requests to API routes.
 */
export class VendorService {
  async fetchVendors(params?: FetchVendorsParams): Promise<FetchVendorsResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.search?.trim()) queryParams.search = params.search.trim();
    if (params?.filter) queryParams.filter = params.filter;
    if (params?.page !== undefined) queryParams.page = String(params.page);
    if (params?.pageSize !== undefined) queryParams.pageSize = String(params.pageSize);

    const response = await apiClient.get<FetchVendorsResponse>('/api/vendors', {
      params: queryParams,
    });
    return response.data;
  }

  async updateStage(
    vendorId: string,
    newStage: Stage,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    // 1. Client-Side Zod Validation
    const validation = UpdateVendorStageSchema.safeParse({ vendorId, newStage, userId });
    if (!validation.success) {
      throw new Error(`Validation Error: ${formatZodError(validation.error)}`);
    }

    const response = await apiClient.patch<{ success: boolean; message: string }>(
      '/api/vendors/stage',
      validation.data
    );
    return response.data;
  }

  async fetchHistory(vendorId: string): Promise<StageHistoryItem[]> {
    const paramValidation = VendorIdParamSchema.safeParse({ id: vendorId });
    if (!paramValidation.success) {
      throw new Error(`Validation Error: ${formatZodError(paramValidation.error)}`);
    }

    const response = await apiClient.get<StageHistoryItem[]>(`/api/vendors/${vendorId}/history`);
    return response.data;
  }

  async fetchDocuments(vendorId: string): Promise<VendorDocumentItem[]> {
    const paramValidation = VendorIdParamSchema.safeParse({ id: vendorId });
    if (!paramValidation.success) {
      throw new Error(`Validation Error: ${formatZodError(paramValidation.error)}`);
    }

    const response = await apiClient.get<VendorDocumentItem[]>(`/api/vendors/${vendorId}/documents`);
    return response.data;
  }

  async uploadDocument(
    vendorId: string,
    file: File,
    type: DocumentType
  ): Promise<VendorDocumentItem> {
    const paramValidation = VendorIdParamSchema.safeParse({ id: vendorId });
    if (!paramValidation.success) {
      throw new Error(`Validation Error: ${formatZodError(paramValidation.error)}`);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await apiClient.post<VendorDocumentItem>(
      `/api/vendors/${vendorId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
}

export const vendorService = new VendorService();
export const fetchVendors = (params?: FetchVendorsParams) => vendorService.fetchVendors(params);
export const updateVendorStage = (vendorId: string, newStage: Stage, userId: string) =>
  vendorService.updateStage(vendorId, newStage, userId);
export const fetchVendorHistory = (vendorId: string) => vendorService.fetchHistory(vendorId);
export const fetchVendorDocuments = (vendorId: string) => vendorService.fetchDocuments(vendorId);
export const uploadVendorDocument = (vendorId: string, file: File, type: DocumentType) =>
  vendorService.uploadDocument(vendorId, file, type);
