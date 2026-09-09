'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stage } from '@prisma/client';
import { useAuth } from '@/context/AuthContext';
import {
  VendorItem,
  FilterMode,
  VendorMetrics,
  fetchVendors,
  updateVendorStage,
} from '@/app/vendor.service';
import { UsePaginationReturn } from './usePagination';
import { useToast, ToastState } from './useToast';

export type { FilterMode, VendorMetrics };

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
  stageVendor: VendorItem | null;
  setStageVendor: (v: VendorItem | null) => void;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  loadVendors: () => Promise<void>;
  handleStageChange: (vendorId: string, newStage: Stage) => Promise<boolean>;
}

export function useVendors(initialPageSize = 5): UseVendorsReturn {
  const { userId, currentUser, loginWithRealGoogle } = useAuth();
  const { toast, showToast } = useToast();

  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPageState] = useState<number>(1);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQueryState] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [filterMode, setFilterModeState] = useState<FilterMode>('ONBOARDING');
  const [updatingStageVendorId, setUpdatingStageVendorId] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<VendorMetrics>({
    total: 0,
    stuck: 0,
    active: 0,
    onboarding: 0,
  });

  // Active Modals
  const [historyVendor, setHistoryVendor] = useState<VendorItem | null>(null);
  const [documentsVendor, setDocumentsVendor] = useState<VendorItem | null>(null);
  const [stageVendor, setStageVendor] = useState<VendorItem | null>(null);

  // Debounce search query input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load vendors from backend server service via client service
  const loadVendors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchVendors({
        search: debouncedSearch,
        filter: filterMode,
        page,
        pageSize,
      });
      setVendors(data.vendors);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setMetrics(data.metrics);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch vendors';
      console.error('Failed to load vendors:', message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterMode, page, pageSize, showToast]);

  // Fetch vendors whenever debounced search query, filter tab, page, or pageSize changes
  useEffect(() => {
    let ignore = false;

    fetchVendors({
      search: debouncedSearch,
      filter: filterMode,
      page,
      pageSize,
    })
      .then((data) => {
        if (!ignore) {
          setVendors(data.vendors);
          setTotal(data.total);
          setTotalPages(data.totalPages);
          setMetrics(data.metrics);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const message = err instanceof Error ? err.message : 'Failed to fetch vendors';
          console.error('Failed to load vendors:', message);
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
  }, [debouncedSearch, filterMode, page, pageSize, showToast]);

  // Reset page to 1 when search or filter tab changes
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    setPageState(1);
    setLoading(true);
  }, []);

  const setFilterMode = useCallback((mode: FilterMode) => {
    setFilterModeState(mode);
    setPageState(1);
    setLoading(true);
  }, []);

  // Server-side pagination controls implementation adhering to UsePaginationReturn
  const setPage = useCallback(
    (newPage: number) => {
      setPageState(Math.min(Math.max(1, newPage), Math.max(1, totalPages)));
      setLoading(true);
    },
    [totalPages]
  );

  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize);
    setPageState(1);
    setLoading(true);
  }, []);

  const goToNextPage = useCallback(() => {
    setPageState((p) => Math.min(p + 1, Math.max(1, totalPages)));
    setLoading(true);
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setPageState((p) => Math.max(p - 1, 1));
    setLoading(true);
  }, []);

  const resetPage = useCallback(() => {
    setPageState(1);
  }, []);

  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const pagination: UsePaginationReturn<VendorItem> = useMemo(
    () => ({
      page,
      pageSize,
      totalPages,
      totalItems: total,
      paginatedItems: vendors,
      startIndex,
      endIndex,
      hasNextPage,
      hasPrevPage,
      setPage,
      setPageSize,
      goToNextPage,
      goToPrevPage,
      resetPage,
      pageSizeOptions: [5, 10, 20],
    }),
    [
      page,
      pageSize,
      totalPages,
      total,
      vendors,
      startIndex,
      endIndex,
      hasNextPage,
      hasPrevPage,
      setPage,
      setPageSize,
      goToNextPage,
      goToPrevPage,
      resetPage,
    ]
  );

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
    filteredVendors: vendors,
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
    stageVendor,
    setStageVendor,
    toast,
    showToast,
    loadVendors,
    handleStageChange,
  };
}
