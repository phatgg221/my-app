'use client';

import React from 'react';
import { useVendorContext } from '@/context/VendorContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginationBar() {
  const { loading, pagination } = useVendorContext();

  const {
    page,
    pageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    setPage,
    setPageSize,
    goToNextPage,
    goToPrevPage,
    pageSizeOptions,
  } = pagination;

  if (loading || totalItems === 0) {
    return null;
  }

  return (
    <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
      {/* Pagination Info & Page Size Selector */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <p className="font-medium text-slate-500">
          Showing <span className="font-bold text-slate-800">{startIndex}</span> to{' '}
          <span className="font-bold text-slate-800">{endIndex}</span> of{' '}
          <span className="font-bold text-slate-800">{totalItems}</span> vendors
        </p>

        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
          <label
            htmlFor="pageSizeSelect"
            className="text-slate-400 text-[11px] font-medium hidden md:inline"
          >
            Per page:
          </label>
          <select
            id="pageSizeSelect"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
        {/* Previous Page Button */}
        <button
          type="button"
          onClick={goToPrevPage}
          disabled={!hasPrevPage}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors shadow-2xs cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isCurrent = p === page;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#EE4D2D] text-white shadow-xs shadow-orange-500/20'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <button
          type="button"
          onClick={goToNextPage}
          disabled={!hasNextPage}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors shadow-2xs cursor-pointer"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
