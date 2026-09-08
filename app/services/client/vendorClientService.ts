import apiClient from '@/lib/apiClient';
import { Stage, DocumentType } from '@prisma/client';

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
  const response = await apiClient.patch<{ success: boolean; message: string }>(
    '/api/vendors/stage',
    {
      vendorId,
      newStage,
      userId,
    }
  );
  return response.data;
}

export async function fetchVendorHistory(vendorId: string): Promise<StageHistoryItem[]> {
  const response = await apiClient.get<StageHistoryItem[]>(`/api/vendors/${vendorId}/history`);
  return response.data;
}

export async function fetchVendorDocuments(vendorId: string): Promise<VendorDocumentItem[]> {
  const response = await apiClient.get<VendorDocumentItem[]>(`/api/vendors/${vendorId}/documents`);
  return response.data;
}

export async function uploadVendorDocument(
  vendorId: string,
  file: File,
  type: DocumentType
): Promise<VendorDocumentItem> {
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
