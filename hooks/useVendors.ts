'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stage } from '@prisma/client';
import { useAuth } from '@/context/AuthContext';
import {
  VendorItem,
  fetchVendors,
  updateVendorStage,
} from '@/app/vendor.service';
import { usePagination, UsePaginationReturn } from './usePagination';
import { useToast, ToastState } from './useToast';

export type FilterMode = 'ALL' | 'STUCK' | 'ACTIVE' | 'ONBOARDING';

export interface VendorMetrics {
  total: number;
  stuck: number;
  active: number;
  onboarding: number;
}

export const STAGE_CONFIG: Record<
  Stage,
  { label: string; badgeClass: string; stepNumber: number }
> = {
  CONTRACT_SENT: {
    label: 'Contract Sent',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    stepNumber: 1,
  },
  CONTRACT_SIGNED: {
    label: 'Contract Signed',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    stepNumber: 2,
  },
  KYC_DOCS_RECEIVED: {
    label: 'KYC Docs Received',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    stepNumber: 3,
  },
  KYC_VERIFIED: {
    label: 'KYC Verified',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    stepNumber: 4,
  },
  ACTIVE: {
    label: 'Active Vendor',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    stepNumber: 5,
  },
};

export interface UseVendorsReturn {
  vendors: VendorItem[];
  filteredVendors: VendorItem[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterMode: FilterMode;
  setFilterMode: (m: FilterMode) => void;
  updatingStageVendorId: string | null;
  metrics: VendorMetrics;
  pagination: UsePaginationReturn<VendorItem>;
  historyVendor: VendorItem | null;
  setHistoryVendor: (v: VendorItem | null) => void;
  documentsVendor: VendorItem | null;
  setDocumentsVendor: (v: VendorItem | null) => void;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  loadVendors: () => Promise<void>;
  handleStageChange: (vendorId: string, newStage: Stage) => Promise<boolean>;
}


export function useVendors(pageSize = 5): UseVendorsReturn {
  const { userId, currentUser, loginWithRealGoogle } = useAuth();
  const { toast, showToast } = useToast();

  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQueryState] = useState<string>('');
  const [filterMode, setFilterModeState] = useState<FilterMode>('ALL');
  const [updatingStageVendorId, setUpdatingStageVendorId] = useState<string | null>(null);

  // Active Modals
  const [historyVendor, setHistoryVendor] = useState<VendorItem | null>(null);
  const [documentsVendor, setDocumentsVendor] = useState<VendorItem | null>(null);

  // Load vendors from Client Service
  const loadVendors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchVendors();
      setVendors(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch vendors';
      console.error('Failed to load vendors:', message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Initial fetch on mount
  useEffect(() => {
    let ignore = false;

    fetchVendors()
      .then((data) => {
        if (!ignore) {
          setVendors(data);
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to fetch vendors';
        console.error('Failed to load vendors:', message);
        if (!ignore) {
          showToast(message, 'error');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [showToast]);

  // Filter vendors based on search query and tab mode
  const filteredVendors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return vendors.filter((v) => {
      const matchesSearch =
        !query ||
        v.name.toLowerCase().includes(query) ||
        v.region.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (filterMode === 'STUCK') return v.isStuck;
      if (filterMode === 'ACTIVE') return v.currentStage === Stage.ACTIVE;
      if (filterMode === 'ONBOARDING') return v.currentStage !== Stage.ACTIVE;
      return true;
    });
  }, [vendors, searchQuery, filterMode]);

  // Client-side pagination hook applied to filtered results
  const pagination = usePagination(filteredVendors, {
    initialPageSize: pageSize,
    pageSizeOptions: [5, 10, 20],
  });

  // Reset page to 1 when search or filter tab changes
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    pagination.resetPage();
  }, [pagination]);

  const setFilterMode = useCallback((mode: FilterMode) => {
    setFilterModeState(mode);
    pagination.resetPage();
  }, [pagination]);

  // Calculate high-level KPI metrics
  const metrics = useMemo<VendorMetrics>(() => {
    const total = vendors.length;
    const stuck = vendors.filter((v) => v.isStuck).length;
    const active = vendors.filter((v) => v.currentStage === Stage.ACTIVE).length;
    const onboarding = total - active;
    return { total, stuck, active, onboarding };
  }, [vendors]);

  // Stage update handler delegating to Client Service
  const handleStageChange = useCallback(
    async (vendorId: string, newStage: Stage): Promise<boolean> => {
      if (!userId) {
        showToast('Please sign in with Google to update vendor stages.', 'error');
        loginWithRealGoogle();
        return false;
      }

      try {
        setUpdatingStageVendorId(vendorId);
        await updateVendorStage(vendorId, newStage, userId);
        showToast(
          `Vendor moved to "${STAGE_CONFIG[newStage].label}" by ${currentUser?.name || 'Ops Coordinator'}!`
        );
        await loadVendors();
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update vendor stage';
        console.error('Stage update failed:', message);
        showToast(message, 'error');
        return false;
      } finally {
        setUpdatingStageVendorId(null);
      }
    },
    [userId, currentUser, loginWithRealGoogle, loadVendors, showToast]
  );

  return {
    vendors,
    filteredVendors,
    loading,
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    updatingStageVendorId,
    metrics,
    pagination,
    historyVendor,
    setHistoryVendor,
    documentsVendor,
    setDocumentsVendor,
    toast,
    showToast,
    loadVendors,
    handleStageChange,
  };
}
