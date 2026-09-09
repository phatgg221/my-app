'use client';

import React from 'react';
import { Stage } from '@prisma/client';
import { useAuth } from '@/context/AuthContext';
import { useVendorContext } from '@/context/VendorContext';
import { STAGE_CONFIG } from '@/hooks/useVendors';
import {
  Building2,
  Clock,
  AlertTriangle,
  ChevronDown,
  Loader2,
  History,
  FileText,
  Lock,
} from 'lucide-react';

export default function VendorTable() {
  const { isAuthenticated } = useAuth();
  const {
    loading,
    pagination,
    updatingStageVendorId,
    setHistoryVendor,
    setDocumentsVendor,
    setStageVendor,
  } = useVendorContext();

  const { paginatedItems: paginatedVendors } = pagination;

  return (
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

                  {/* 3. Current Stage & Stage Transition Trigger */}
                  <td className="py-4 px-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) return;
                        setStageVendor(v);
                      }}
                      disabled={!isAuthenticated || isUpdating}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer hover:shadow-xs group ${
                        stageInfo.badgeClass
                      } ${
                        !isAuthenticated
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:brightness-95 active:scale-95'
                      }`}
                      title={
                        !isAuthenticated
                          ? 'Sign in or select a coordinator to change stage'
                          : 'Click to view vendor details and transition stage'
                      }
                    >
                      <span>Step {stageInfo.stepNumber}: {stageInfo.label}</span>
                      {isUpdating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EE4D2D]" />
                      ) : !isAuthenticated ? (
                        <Lock className="w-3 h-3 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-700 transition-transform group-hover:translate-y-0.5" />
                      )}
                    </button>
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
  );
}
