'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Stage } from '@prisma/client';
import { useAuth } from '@/context/AuthContext';
import {
  VendorItem,
  fetchVendors,
  updateVendorStage,
} from './vendor.service';
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
  Loader2,
  Layers,
  Lock,
} from 'lucide-react';

const STAGE_CONFIG: Record<
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

export default function Dashboard() {
  const { userId, currentUser, isAuthenticated, loginWithRealGoogle, authError, clearAuthError } = useAuth();

  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'STUCK' | 'ACTIVE' | 'ONBOARDING'>('ALL');
  const [updatingStageVendorId, setUpdatingStageVendorId] = useState<string | null>(null);

  // Active Modals
  const [historyVendor, setHistoryVendor] = useState<VendorItem | null>(null);
  const [documentsVendor, setDocumentsVendor] = useState<VendorItem | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

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

  // Inline Stage Update Selector Handler
  const handleStageChange = async (vendorId: string, newStage: Stage) => {
    if (!userId) {
      showToast('Please sign in with Google to update vendor stages.', 'error');
      loginWithRealGoogle();
      return;
    }

    try {
      setUpdatingStageVendorId(vendorId);

      // Call Client Service directly (as mandated by AGENTS.md)
      await updateVendorStage(vendorId, newStage, userId);

      showToast(`Vendor moved to "${STAGE_CONFIG[newStage].label}" by ${currentUser?.name}!`);

      // Refresh list to recalculate days in stage & audit history
      await loadVendors();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update vendor stage';
      console.error('Stage update failed:', message);
      showToast(message, 'error');
    } finally {
      setUpdatingStageVendorId(null);
    }
  };

  // Metrics
  const totalVendors = vendors.length;
  const stuckVendorsCount = vendors.filter((v) => v.isStuck).length;
  const activeVendorsCount = vendors.filter((v) => v.currentStage === Stage.ACTIVE).length;
  const onboardingCount = totalVendors - activeVendorsCount;

  // Filtered vendors
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.region.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'STUCK') return v.isStuck;
    if (filterMode === 'ACTIVE') return v.currentStage === Stage.ACTIVE;
    if (filterMode === 'ONBOARDING') return v.currentStage !== Stage.ACTIVE;
    return true;
  });

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
              onClick={clearAuthError}
              className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold border animate-in slide-in-from-bottom-3 duration-200 bg-white ${
            toast.type === 'success'
              ? 'text-emerald-800 border-l-4 border-l-emerald-500 border-slate-200'
              : 'text-red-800 border-l-4 border-l-red-500 border-slate-200'
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
            <p className="text-3xl font-black text-slate-900 mt-2">{totalVendors}</p>
            <p className="text-[11px] text-slate-500 mt-1">Managed across all sales regions</p>
          </div>

          {/* Card 2: Stuck Vendors */}
          <div
            className={`border rounded-2xl p-5 shadow-sm transition-all ${
              stuckVendorsCount > 0
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
            <p className="text-3xl font-black text-rose-700 mt-2">{stuckVendorsCount}</p>
            <p className="text-[11px] text-rose-600/90 font-medium mt-1">Action required by coordinator</p>
          </div>

          {/* Card 3: In Onboarding */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                In Onboarding
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-amber-600 mt-2">{onboardingCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Progressing through KYC pipeline</p>
          </div>

          {/* Card 4: Active Vendors */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Active Vendors
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-600 mt-2">{activeVendorsCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Fully verified and trading</p>
          </div>
        </section>

        {/* Action Controls & Filters */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search vendor name or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 placeholder:text-slate-400 text-xs font-medium rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-sm shadow-orange-500/20'
                  : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              All Vendors ({vendors.length})
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
              Stuck Only ({stuckVendorsCount})
            </button>
            <button
              onClick={() => setFilterMode('ONBOARDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                filterMode === 'ONBOARDING'
                  ? 'bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-sm shadow-orange-500/20'
                  : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              In Onboarding ({onboardingCount})
            </button>
            <button
              onClick={() => setFilterMode('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                filterMode === 'ACTIVE'
                  ? 'bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-sm shadow-orange-500/20'
                  : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              Active ({activeVendorsCount})
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
                ) : filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-500">
                      <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-700">No vendors found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filter selection.</p>
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((v) => {
                    const isUpdating = updatingStageVendorId === v.id;
                    const stageInfo = STAGE_CONFIG[v.currentStage] || {
                      label: v.currentStage,
                      badgeClass: 'bg-slate-100 text-slate-700',
                      stepNumber: 0,
                    };

                    return (
                      <tr
                        key={v.id}
                        className={`transition-colors ${
                          v.isStuck
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
                                className={`text-xs font-bold rounded-lg pl-3 pr-8 py-1.5 border appearance-none transition-all ${
                                  stageInfo.badgeClass
                                } ${
                                  isUpdating || !isAuthenticated
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
                                if (!isAuthenticated) {
                                  showToast('Please sign in with Google to view audit history.', 'error');
                                  return;
                                }
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
                                if (!isAuthenticated) {
                                  showToast('Please sign in with Google to manage documents.', 'error');
                                  return;
                                }
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
                                  className={`px-1.5 py-0.2 text-[10px] font-black rounded-full ${
                                    isAuthenticated ? 'bg-[#EE4D2D] text-white' : 'bg-slate-300 text-slate-600'
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
