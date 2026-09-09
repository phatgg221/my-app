'use client';

import React from 'react';
import { useVendorContext } from '@/context/VendorContext';
import { Search, AlertTriangle, RefreshCw } from 'lucide-react';

export default function FilterToolbar() {
  const {
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    metrics,
    loadVendors,
    loading,
  } = useVendorContext();

  return (
    <section className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search vendor name or region..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] transition-all"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
        <button
          onClick={() => setFilterMode('ONBOARDING')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            filterMode === 'ONBOARDING'
              ? 'bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-sm shadow-orange-500/20'
              : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          In Onboarding ({metrics.onboarding})
        </button>
        <button
          onClick={() => setFilterMode('STUCK')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
            filterMode === 'STUCK'
              ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-500/20'
              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Stuck Only ({metrics.stuck})
        </button>
        <button
          onClick={() => setFilterMode('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            filterMode === 'ALL'
              ? 'bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-sm shadow-orange-500/20'
              : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          All Vendors ({metrics.total})
        </button>
        <button
          onClick={() => setFilterMode('ACTIVE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            filterMode === 'ACTIVE'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
              : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          Active ({metrics.active})
        </button>

        {/* Refresh Button */}
        <button
          onClick={loadVendors}
          disabled={loading}
          title="Refresh vendor list"
          className="p-2 rounded-xl text-slate-600 hover:text-[#EE4D2D] bg-slate-100 hover:bg-orange-50 border border-slate-200 transition-colors ml-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#EE4D2D]' : ''}`} />
        </button>
      </div>
    </section>
  );
}
