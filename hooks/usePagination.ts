'use client';

import { useState, useMemo, useCallback } from 'react';

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

export interface PaginationResult<T> {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  paginatedItems: T[];
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UsePaginationReturn<T> extends PaginationResult<T> {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  resetPage: () => void;
  pageSizeOptions: number[];
}

/**
 * Pure pagination calculator (easily testable in any runtime)
 */
export function calculatePagination<T>(
  items: T[],
  page: number,
  pageSize: number
): PaginationResult<T> {
  const totalItems = items.length;
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const start = (safePage - 1) * safePageSize;
  const paginatedItems = items.slice(start, start + safePageSize);
  const startIndex = totalItems === 0 ? 0 : start + 1;
  const endIndex = Math.min(safePage * safePageSize, totalItems);

  const hasNextPage = safePage < totalPages;
  const hasPrevPage = safePage > 1;

  return {
    page: safePage,
    pageSize: safePageSize,
    totalPages,
    totalItems,
    paginatedItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
  };
}

/**
 * Custom React Hook for managing client-side pagination.
 */
export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const {
    initialPage = 1,
    initialPageSize = 5,
    pageSizeOptions = [5, 10, 20],
  } = options;

  const [page, setPageInternal] = useState<number>(initialPage);
  const [pageSize, setPageSizeInternal] = useState<number>(initialPageSize);

  const paginationResult = useMemo(() => {
    return calculatePagination(items, page, pageSize);
  }, [items, page, pageSize]);

  const setPage = useCallback(
    (newPage: number) => {
      const target = Math.min(Math.max(1, newPage), paginationResult.totalPages);
      setPageInternal(target);
    },
    [paginationResult.totalPages]
  );

  const setPageSize = useCallback((newSize: number) => {
    setPageSizeInternal(newSize);
    setPageInternal(1);
  }, []);

  const goToNextPage = useCallback(() => {
    setPageInternal((p) => Math.min(p + 1, paginationResult.totalPages));
  }, [paginationResult.totalPages]);

  const goToPrevPage = useCallback(() => {
    setPageInternal((p) => Math.max(p - 1, 1));
  }, []);

  const resetPage = useCallback(() => {
    setPageInternal(1);
  }, []);

  return {
    ...paginationResult,
    setPage,
    setPageSize,
    goToNextPage,
    goToPrevPage,
    resetPage,
    pageSizeOptions,
  };
}
