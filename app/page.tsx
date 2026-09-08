'use client';

import React from 'react';
import { Stage } from '@prisma/client';
import { useAuth } from '@/context/AuthContext';
import { useVendors, STAGE_CONFIG } from '@/hooks/useVendors';
import Navbar from './components/Navbar';
import HistoryModal from './components/HistoryModal';
import DocumentsModal from './components/DocumentsModal';
import {
  AlertTriangle,
  FileText,
  History,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
} from 'lucide-react';

export default function Dashboard() {
  const { isAuthenticated, loginWithRealGoogle, authError, clearAuthError } = useAuth();

  // Encapsulated Vendor State, Filtering, Metrics, and Pagination via Custom Hook
  const {
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
    loadVendors,
    handleStageChange,
  } = useVendors(5); // Default 5 vendors per page

  const {
    page,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedVendors,
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

  return (
    <div className="min-h-screen bg-[#F6F6F6] text-slate-800 flex flex-col">
      {/* Global Navbar with Shopee Orange Branding */}
      <Navbar />

      {/* Auth Notification Banner */}
      {authError && (
        <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{authError}</span>
            </div>
            <button
              type="button"
              onClick={clearAuthError}
              className="text-xs text-red-600 hover:text-red-900 font-bold ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-bottom-5 duration-200 ${toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
            }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 flex-1 space-y-6">
        {/* KPI Metrics Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Vendors */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Vendors
              </span>
              <div className="p-2 rounded-xl bg-orange-50 text-[#EE4D2D]">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 mt-2">{metrics.total}</p>
            <p className="text-[11px] text-slate-500 mt-1">Managed across all sales regions</p>
          </div>

          {/* Card 2: Stuck Vendors */}
          <div
            className={`border rounded-2xl p-5 shadow-sm transition-all ${metrics.stuck > 0
                ? 'bg-rose-50/70 border-rose-200 ring-1 ring-rose-200'
                : 'bg-white border-slate-200/80'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Stuck Vendors (&gt; 7 Days)
              </span>
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-rose-700 mt-2">{metrics.stuck}</p>
            <p className="text-[11px] text-rose-600/90 font-medium mt-1">Action required by coordinator</p>
          </div>

          {/* Card 3: In Onboarding */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                In Onboarding
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 mt-2">{metrics.onboarding}</p>
            <p className="text-[11px] text-slate-500 mt-1">Progressing through KYC pipeline</p>
          </div>

          {/* Card 4: Active Vendors */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Vendors
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 mt-2">{metrics.active}</p>
            <p className="text-[11px] text-slate-500 mt-1">Fully verified and trading</p>
          </div>
        </section>

        {/* Filter and Search Toolbar */}
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
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${filterMode === 'ALL'
                  ? 'bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-sm shadow-orange-500/20'
                  : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
                }`}
            >
              All Vendors ({metrics.total})
            </button>
            <button
              onClick={() => setFilterMode('STUCK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${filterMode === 'STUCK'
                  ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-500/20'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Stuck Only ({metrics.stuck})
            </button>
            <button
              onClick={() => setFilterMode('ONBOARDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${filterMode === 'ONBOARDING'
                  ? 'bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-sm shadow-orange-500/20'
                  : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
                }`}
            >
              In Onboarding ({metrics.onboarding})
            </button>
            <button
              onClick={() => setFilterMode('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${filterMode === 'ACTIVE'
                  ? 'bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-sm shadow-orange-500/20'
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

        {/* Read-Only / Actions Locked Warning Banner */}
        {!isAuthenticated && !loading && (
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0 border border-amber-200/80">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-amber-950">Read-Only Mode (Signed Out)</p>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Action buttons (stage updates, audit history, and KYC document management) are locked. Please sign in with Google to perform operations.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={loginWithRealGoogle}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-amber-100/60 border border-amber-300 font-bold text-amber-950 rounded-xl text-xs transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
            >
              <span>Sign in with Google</span>
            </button>
          </div>
        )}

        {/* Vendor Table */}
        <section className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[11px] text-slate-500">
                <tr>
                  <th className="py-3.5 px-5 font-bold">Vendor Name</th>
                  <th className="py-3.5 px-4 font-bold">Region</th>
                  <th className="py-3.5 px-4 font-bold">Current Stage</th>
                  <th className="py-3.5 px-4 font-bold">Days in Stage</th>
                  <th className="py-3.5 px-5 font-bold text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-500">
                      <Loader2 className="w-7 h-7 mx-auto animate-spin text-[#EE4D2D] mb-2" />
                      <p className="font-semibold text-xs text-slate-700">Loading vendor records...</p>
                    </td>
                  </tr>
                ) : paginatedVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-500">
                      <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-700">No vendors found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filter selection.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedVendors.map((v) => {
                    const isUpdating = updatingStageVendorId === v.id;
                    const stageInfo = STAGE_CONFIG[v.currentStage] || {
                      label: v.currentStage,
                      badgeClass: 'bg-slate-100 text-slate-700',
                      stepNumber: 0,
                    };

                    return (
                      <tr
                        key={v.id}
                        className={`transition-colors ${v.isStuck
                            ? 'bg-rose-50/50 border-l-4 border-l-rose-500 hover:bg-rose-50/80'
                            : 'hover:bg-orange-50/20'
                          }`}
                      >
                        {/* 1. Vendor Name */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-orange-100 text-[#EE4D2D] border border-orange-200 flex items-center justify-center font-black text-sm shrink-0">
                              {v.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate text-sm">{v.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">ID: {v.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Region */}
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 text-slate-700 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold">
                            {v.region}
                          </span>
                        </td>

                        {/* 3. Current Stage & Inline Stage Update Selector */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <select
                                aria-label="Change Vendor Stage"
                                disabled={isUpdating || !isAuthenticated}
                                value={v.currentStage}
                                onChange={(e) => handleStageChange(v.id, e.target.value as Stage)}
                                className={`text-xs font-bold rounded-lg pl-3 pr-8 py-1.5 border appearance-none transition-all ${stageInfo.badgeClass
                                  } ${isUpdating || !isAuthenticated
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30'
                                  }`}
                                title={!isAuthenticated ? 'Sign in with Google to change vendor stage' : 'Change Vendor Stage'}
                              >
                                {Object.entries(STAGE_CONFIG).map(([stageKey, config]) => (
                                  <option
                                    key={stageKey}
                                    value={stageKey}
                                    className="bg-white text-slate-800"
                                  >
                                    Step {config.stepNumber}: {config.label}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-2.5 top-2.5 pointer-events-none text-slate-500">
                                {isUpdating ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EE4D2D]" />
                                ) : !isAuthenticated ? (
                                  <Lock className="w-3 h-3 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 4. Days in Stage (with Stuck Indicator) */}
                        <td className="py-4 px-4">
                          {v.isStuck ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 border border-rose-300 font-bold">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>{v.daysInStage} days (Stuck!)</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{v.daysInStage} days</span>
                            </div>
                          )}
                        </td>

                        {/* 5. Row-Level Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            {/* View History Button */}
                            <button
                              onClick={() => {
                                if (!isAuthenticated) return;
                                setHistoryVendor(v);
                              }}
                              disabled={!isAuthenticated}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#EE4D2D] bg-slate-100 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-100 disabled:hover:text-slate-700 disabled:hover:border-slate-200 shadow-none"
                              title={isAuthenticated ? 'View Stage Transition Audit History' : 'Sign in with Google to view audit history'}
                            >
                              {!isAuthenticated ? (
                                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              ) : (
                                <History className="w-3.5 h-3.5 text-[#EE4D2D] shrink-0" />
                              )}
                              <span className="hidden sm:inline">History</span>
                            </button>

                            {/* Manage Documents Button */}
                            <button
                              onClick={() => {
                                if (!isAuthenticated) return;
                                setDocumentsVendor(v);
                              }}
                              disabled={!isAuthenticated}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#EE4D2D] hover:text-white bg-orange-50 hover:bg-[#EE4D2D] border border-orange-200 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-orange-50 disabled:hover:text-[#EE4D2D] disabled:shadow-none"
                              title={isAuthenticated ? 'Manage S3/MinIO KYC Documents' : 'Sign in with Google to access documents'}
                            >
                              {!isAuthenticated ? (
                                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span className="hidden sm:inline">Documents</span>
                              {v.documentsCount > 0 && (
                                <span
                                  className={`px-1.5 py-0.2 text-[10px] font-black rounded-full ${isAuthenticated ? 'bg-[#EE4D2D] text-white' : 'bg-slate-300 text-slate-600'
                                    }`}
                                >
                                  {v.documentsCount}
                                </span>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Bar */}
          {!loading && totalItems > 0 && (
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              {/* Pagination Info & Page Size Selector */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <p className="font-medium text-slate-500">
                  Showing <span className="font-bold text-slate-800">{startIndex}</span> to{' '}
                  <span className="font-bold text-slate-800">{endIndex}</span> of{' '}
                  <span className="font-bold text-slate-800">{totalItems}</span> vendors
                </p>

                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                  <label htmlFor="pageSizeSelect" className="text-slate-400 text-[11px] font-medium hidden md:inline">
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
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${isCurrent
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
          )}
        </section>
      </main>

      {/* History Modal Overlay */}
      {historyVendor && (
        <HistoryModal
          vendor={historyVendor}
          onClose={() => setHistoryVendor(null)}
        />
      )}

      {/* Documents Modal Overlay */}
      {documentsVendor && (
        <DocumentsModal
          vendor={documentsVendor}
          onClose={() => setDocumentsVendor(null)}
          onDocumentsUpdated={loadVendors}
        />
      )}
    </div>
  );
}
