'use client';

import React, { useEffect, useState } from 'react';
import { Stage } from '@prisma/client';
import { StageHistoryItem, fetchVendorHistory, VendorItem } from '@/services/client/vendorClientService';
import { X, History, User, Clock, ArrowRight, Loader2 } from 'lucide-react';

interface HistoryModalProps {
  vendor: VendorItem | null;
  onClose: () => void;
}

const STAGE_LABELS: Record<Stage, string> = {
  CONTRACT_SENT: 'Contract Sent',
  CONTRACT_SIGNED: 'Contract Signed',
  KYC_DOCS_RECEIVED: 'KYC Docs Received',
  KYC_VERIFIED: 'KYC Verified',
  ACTIVE: 'Active Vendor',
};

const STAGE_BADGES: Record<Stage, string> = {
  CONTRACT_SENT: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  CONTRACT_SIGNED: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  KYC_DOCS_RECEIVED: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  KYC_VERIFIED: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export default function HistoryModal({ vendor, onClose }: HistoryModalProps) {
  const [history, setHistory] = useState<StageHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!vendor) return;

    let isMounted = true;

    fetchVendorHistory(vendor.id)
      .then((data) => {
        if (isMounted) setHistory(data);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to load history:', message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [vendor]);

  if (!vendor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Stage Audit Trail</h2>
              <p className="text-xs text-slate-400">
                Vendor: <span className="font-semibold text-slate-200">{vendor.name}</span> • Region: {vendor.region}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Chronological Timeline */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
              <p className="text-xs font-medium">Loading audit history from database...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-medium">No stage transition history recorded yet.</p>
              <p className="text-xs text-slate-500 mt-1">Changes made via the Stage Selector will automatically appear here.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {history.map((item, index) => {
                const date = new Date(item.changedAt);
                const formattedDate = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const formattedTime = date.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={item.id} className="relative group">
                    {/* Timeline Node Icon */}
                    <div
                      className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${index === 0 ? 'bg-orange-500 ring-4 ring-orange-500/20' : 'bg-slate-600'
                        }`}
                    />

                    {/* Timeline Card */}
                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 shadow-sm hover:border-slate-600 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        {/* Coordinator Attribution */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                          <User className="w-3.5 h-3.5 text-orange-400" />
                          <span>{item.user?.name || 'System / Unassigned'}</span>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {formattedDate} at {formattedTime}
                          </span>
                        </div>
                      </div>

                      {/* Stage Transition */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${STAGE_BADGES[item.previousStage] || 'bg-slate-800 text-slate-400'
                            }`}
                        >
                          {STAGE_LABELS[item.previousStage] || item.previousStage}
                        </span>

                        <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />

                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${STAGE_BADGES[item.newStage] || 'bg-slate-800 text-slate-400'
                            }`}
                        >
                          {STAGE_LABELS[item.newStage] || item.newStage}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
