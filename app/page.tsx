'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Stage } from '@prisma/client';
import { useAuth } from '@/context/AuthContext';
import {
  VendorItem,
  fetchVendors,
  updateVendorStage,
} from '@/services/client/vendorClientService';
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
} from 'lucide-react';

const STAGE_CONFIG: Record<
  Stage,
  { label: string; badgeClass: string; stepNumber: number }
> = {
  CONTRACT_SENT: {
    label: 'Contract Sent',
    badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    stepNumber: 1,
  },
  CONTRACT_SIGNED: {
    label: 'Contract Signed',
    badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    stepNumber: 2,
  },
  KYC_DOCS_RECEIVED: {
    label: 'KYC Docs Received',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    stepNumber: 3,
  },
  KYC_VERIFIED: {
    label: 'KYC Verified',
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    stepNumber: 4,
  },
  ACTIVE: {
    label: 'Active Vendor',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    stepNumber: 5,
  },
};

export default function Dashboard() {
  const { userId, currentUser } = useAuth();

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
      showToast('Please select an active Ops Coordinator first.', 'error');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Global Navbar with Mock Login */}
      <Navbar />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-medium border animate-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30'
              : 'bg-red-950/90 text-red-200 border-red-500/30'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 flex-1 space-y-8">
        {/* KPI Metrics Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Vendors
              </span>
              <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">{totalVendors}</p>
            <p className="text-[11px] text-slate-500 mt-1">Managed across all regions</p>
          </div>

          <div
            className={`border rounded-2xl p-5 shadow-sm transition-all ${
              stuckVendorsCount > 0
                ? 'bg-red-950/20 border-red-500/30 ring-1 ring-red-500/20'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                Stuck Vendors (&gt; 7 Days)
              </span>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-red-400 mt-2">{stuckVendorsCount}</p>
            <p className="text-[11px] text-red-400/80 mt-1">Requires coordinator attention</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                In Onboarding
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-300 mt-2">{onboardingCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Progressing through pipeline</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Active Vendors
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-2">{activeVendorsCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Verified and live on marketplace</p>
          </div>
        </section>

        {/* Action Controls & Filters */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search vendor name or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 placeholder:text-slate-500 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-slate-800 text-white border-slate-700'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              All Vendors ({vendors.length})
            </button>
            <button
              onClick={() => setFilterMode('STUCK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'STUCK'
                  ? 'bg-red-950/80 text-red-300 border-red-500/40'
                  : 'text-red-400/80 border-transparent hover:text-red-300 hover:bg-red-950/30'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Stuck Only ({stuckVendorsCount})
            </button>
            <button
              onClick={() => setFilterMode('ONBOARDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                filterMode === 'ONBOARDING'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              In Onboarding ({onboardingCount})
            </button>
            <button
              onClick={() => setFilterMode('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                filterMode === 'ACTIVE'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Active ({activeVendorsCount})
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadVendors}
              disabled={loading}
              title="Refresh vendor list"
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-colors ml-auto cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-400' : ''}`} />
            </button>
          </div>
        </section>

        {/* Vendor Table */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 uppercase tracking-wider text-[11px] text-slate-400">
                <tr>
                  <th className="py-3.5 px-5 font-semibold">Vendor Name</th>
                  <th className="py-3.5 px-4 font-semibold">Region</th>
                  <th className="py-3.5 px-4 font-semibold">Current Stage</th>
                  <th className="py-3.5 px-4 font-semibold">Days in Stage</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <Loader2 className="w-7 h-7 mx-auto animate-spin text-orange-500 mb-2" />
                      <p className="font-medium text-xs">Loading vendor records from PostgreSQL...</p>
                    </td>
                  </tr>
                ) : filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <Building2 className="w-9 h-9 mx-auto text-slate-700 mb-2" />
                      <p className="text-sm font-semibold text-slate-300">No vendors found</p>
                      <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filter selection.</p>
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((v) => {
                    const isUpdating = updatingStageVendorId === v.id;
                    const stageInfo = STAGE_CONFIG[v.currentStage] || {
                      label: v.currentStage,
                      badgeClass: 'bg-slate-700 text-slate-300',
                      stepNumber: 0,
                    };

                    return (
                      <tr
                        key={v.id}
                        className={`transition-colors ${
                          v.isStuck
                            ? 'bg-rose-950/15 border-l-4 border-l-rose-500 hover:bg-rose-950/25'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* 1. Vendor Name */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-slate-200 shrink-0">
                              {v.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-100 truncate">{v.name}</p>
                              <p className="text-[11px] text-slate-500 font-mono">ID: {v.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Region */}
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 text-slate-300 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs font-medium">
                            {v.region}
                          </span>
                        </td>

                        {/* 3. Current Stage & Inline Stage Update Selector */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <select
                                aria-label="Change Vendor Stage"
                                disabled={isUpdating}
                                value={v.currentStage}
                                onChange={(e) => handleStageChange(v.id, e.target.value as Stage)}
                                className={`text-xs font-semibold rounded-lg pl-3 pr-8 py-1.5 border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all ${
                                  stageInfo.badgeClass
                                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {Object.entries(STAGE_CONFIG).map(([stageKey, config]) => (
                                  <option
                                    key={stageKey}
                                    value={stageKey}
                                    className="bg-slate-900 text-slate-200"
                                  >
                                    Step {config.stepNumber}: {config.label}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-2.5 top-2.5 pointer-events-none text-slate-400">
                                {isUpdating ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span>{v.daysInStage} days (Stuck!)</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{v.daysInStage} days</span>
                            </div>
                          )}
                        </td>

                        {/* 5. Row-Level Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            {/* View History Button */}
                            <button
                              onClick={() => setHistoryVendor(v)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-colors cursor-pointer"
                              title="View Stage Transition Audit History"
                            >
                              <History className="w-3.5 h-3.5 text-orange-400" />
                              <span className="hidden sm:inline">History</span>
                            </button>

                            {/* Manage Documents Button */}
                            <button
                              onClick={() => setDocumentsVendor(v)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-colors cursor-pointer"
                              title="Manage S3/MinIO KYC Documents"
                            >
                              <FileText className="w-3.5 h-3.5 text-sky-400" />
                              <span className="hidden sm:inline">Documents</span>
                              {v.documentsCount > 0 && (
                                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-sky-500/20 text-sky-300 rounded-full border border-sky-500/30">
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
