'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { VendorProvider, useVendorContext } from '@/context/VendorContext';
import Navbar from '@/app/components/Navbar';
import HistoryModal from '@/app/components/HistoryModal';
import DocumentsModal from '@/app/components/DocumentsModal';
import {
  KpiCards,
  FilterToolbar,
  ReadOnlyBanner,
  VendorTable,
  PaginationBar,
} from './components';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

function DashboardContent() {
  const { authError, clearAuthError } = useAuth();
  const {
    toast,
    historyVendor,
    setHistoryVendor,
    documentsVendor,
    setDocumentsVendor,
    loadVendors,
  } = useVendorContext();

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
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'success'
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
        <KpiCards />

        {/* Filter and Search Toolbar */}
        <FilterToolbar />

        {/* Read-Only / Actions Locked Warning Banner */}
        <ReadOnlyBanner />

        {/* Vendor Table & Pagination Card */}
        <section className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <VendorTable />
          <PaginationBar />
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

export default function DashboardPage() {
  return (
    <VendorProvider defaultPageSize={5}>
      <DashboardContent />
    </VendorProvider>
  );
}
