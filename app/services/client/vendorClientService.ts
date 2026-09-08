import apiClient from '@/lib/apiClient';
import { Stage, DocumentType } from '@prisma/client';
import { UpdateVendorStageSchema, VendorIdParamSchema, formatZodError } from '@/lib/validations';

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

/**
 * Frontend Client Service for Vendors:
 * Abstracts all HTTP requests away from React UI components.
 * Performs client-side Zod validation before dispatching requests.
 */

export async function fetchVendors(): Promise<VendorItem[]> {
  const response = await apiClient.get<VendorItem[]>('/api/vendors');
  return response.data;
}

export async function updateVendorStage(
  vendorId: string,
  newStage: Stage,
  userId: string
): Promise<{ success: boolean; message: string }> {
  // Client-side Zod validation
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

export async function fetchVendorHistory(vendorId: string): Promise<StageHistoryItem[]> {
  const paramValidation = VendorIdParamSchema.safeParse({ id: vendorId });
  if (!paramValidation.success) {
    throw new Error(`Validation Error: ${formatZodError(paramValidation.error)}`);
  }

  const response = await apiClient.get<StageHistoryItem[]>(`/api/vendors/${vendorId}/history`);
  return response.data;
}

export async function fetchVendorDocuments(vendorId: string): Promise<VendorDocumentItem[]> {
  const paramValidation = VendorIdParamSchema.safeParse({ id: vendorId });
  if (!paramValidation.success) {
    throw new Error(`Validation Error: ${formatZodError(paramValidation.error)}`);
  }

  const response = await apiClient.get<VendorDocumentItem[]>(`/api/vendors/${vendorId}/documents`);
  return response.data;
}

export async function uploadVendorDocument(
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
