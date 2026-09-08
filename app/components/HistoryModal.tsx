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
  CONTRACT_SENT: 'bg-sky-50 text-sky-700 border-sky-200',
  CONTRACT_SIGNED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  KYC_DOCS_RECEIVED: 'bg-amber-50 text-amber-800 border-amber-200',
  KYC_VERIFIED: 'bg-purple-50 text-purple-700 border-purple-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-[#EE4D2D]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Stage Audit Trail</h2>
              <p className="text-xs text-slate-500">
                Vendor: <span className="font-bold text-slate-800">{vendor.name}</span> • Region: {vendor.region}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Chronological Timeline */}
        <div className="p-6 overflow-y-auto space-y-6 bg-white">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-7 h-7 animate-spin text-[#EE4D2D]" />
              <p className="text-xs font-semibold text-slate-700">Loading audit history from database...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No stage transition history recorded yet.</p>
              <p className="text-xs text-slate-400 mt-1">Changes made via the Stage Selector will automatically appear here.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-orange-200">
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
                      className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        index === 0 ? 'bg-[#EE4D2D] ring-4 ring-orange-100' : 'bg-slate-400'
                      }`}
                    />

                    {/* Timeline Card */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-sm hover:border-orange-300 hover:bg-orange-50/20 transition-all">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        {/* Coordinator Attribution */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                          <User className="w-3.5 h-3.5 text-[#EE4D2D]" />
                          <span>{item.user?.name || 'System / Unassigned'}</span>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {formattedDate} at {formattedTime}
                          </span>
                        </div>
                      </div>

                      {/* Stage Transition */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                            STAGE_BADGES[item.previousStage] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {STAGE_LABELS[item.previousStage] || item.previousStage}
                        </span>

                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                            STAGE_BADGES[item.newStage] || 'bg-slate-100 text-slate-700'
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
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
