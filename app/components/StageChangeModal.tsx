'use client';

import React, { useState } from 'react';
import { Stage } from '@prisma/client';
import { useAuth } from '@/context/AuthContext';
import { useVendorContext } from '@/context/VendorContext';
import { STAGE_CONFIG } from '@/hooks/useVendors';
import { VendorItem } from '@/app/vendor.service';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface StageChangeModalProps {
  vendor: VendorItem | null;
  onClose: () => void;
}

const STAGES: { value: Stage; label: string; step: number }[] = [
  { value: Stage.CONTRACT_SENT, label: 'Contract Sent', step: 1 },
  { value: Stage.CONTRACT_SIGNED, label: 'Contract Signed', step: 2 },
  { value: Stage.KYC_DOCS_RECEIVED, label: 'KYC Docs Received', step: 3 },
  { value: Stage.KYC_VERIFIED, label: 'KYC Verified', step: 4 },
  { value: Stage.ACTIVE, label: 'Active', step: 5 },
];

const DOCUMENT_REQUIRED_STAGES: Stage[] = [
  Stage.KYC_DOCS_RECEIVED,
  Stage.KYC_VERIFIED,
  Stage.ACTIVE,
];

export default function StageChangeModal({ vendor, onClose }: StageChangeModalProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const { handleStageChange, updatingStageVendorId, setDocumentsVendor } = useVendorContext();

  const [selectedStage, setSelectedStage] = useState<Stage>(
    vendor?.currentStage || Stage.CONTRACT_SENT
  );
  const [submitting, setSubmitting] = useState(false);

  if (!vendor) return null;

  const hasNoDocs = vendor.documentsCount === 0;
  const isSelectedStageBlocked = hasNoDocs && DOCUMENT_REQUIRED_STAGES.includes(selectedStage);

  const currentLabel = STAGE_CONFIG[vendor.currentStage]?.label || vendor.currentStage;
  const isNoChange = selectedStage === vendor.currentStage;
  const isMovingToDone = selectedStage === Stage.ACTIVE;
  const isUpdating = updatingStageVendorId === vendor.id || submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNoChange || isUpdating || isSelectedStageBlocked) {
      onClose();
      return;
    }

    try {
      setSubmitting(true);
      const success = await handleStageChange(vendor.id, selectedStage);
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-stage-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUpdating) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Simple Clean Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 id="modal-stage-title" className="text-sm font-semibold text-gray-900">
              Update Vendor Stage
            </h2>
            <p className="text-xs text-gray-500">
              Update onboarding status for this vendor
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Vendor Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-gray-900 text-sm">{vendor.name}</div>
                <div className="text-gray-500 text-xs mt-0.5">
                  {vendor.region} • ID: {vendor.id.slice(0, 8)}
                </div>
              </div>
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-200 text-gray-700 shrink-0">
                {currentLabel}
              </span>
            </div>

            {vendor.isStuck ? (
              <div className="pt-2 border-t border-gray-200 flex items-center gap-1.5 text-red-600 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Stuck for {vendor.daysInStage} days in current stage (SLA: 7 days)</span>
              </div>
            ) : (
              <div className="pt-2 border-t border-gray-200 text-gray-500">
                {vendor.daysInStage} {vendor.daysInStage === 1 ? 'day' : 'days'} in current stage
              </div>
            )}
          </div>

          {/* Document Prerequisite Alert */}
          {hasNoDocs && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5 text-xs text-amber-900 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>No KYC documents uploaded</span>
                </div>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Steps 3 to 5 (KYC Docs, KYC Verified, Active) require at least one uploaded document.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setDocumentsVendor(vendor);
                }}
                className="shrink-0 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded text-[11px] border border-amber-300 transition-colors cursor-pointer"
              >
                Upload
              </button>
            </div>
          )}

          {/* Stage Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Select Stage
            </label>
            <div className="border border-gray-200 rounded-md divide-y divide-gray-200 bg-white">
              {STAGES.map((s) => {
                const isSelected = selectedStage === s.value;
                const isCurrent = vendor.currentStage === s.value;
                const isDocRequired = DOCUMENT_REQUIRED_STAGES.includes(s.value);
                const isBlocked = hasNoDocs && isDocRequired;

                return (
                  <label
                    key={s.value}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors ${
                      isBlocked
                        ? 'opacity-50 bg-gray-50/70 cursor-not-allowed text-gray-400'
                        : isSelected
                        ? 'bg-orange-50/50 cursor-pointer text-gray-900'
                        : 'hover:bg-gray-50 cursor-pointer text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="stage"
                        value={s.value}
                        checked={isSelected}
                        onChange={() => {
                          if (!isBlocked) {
                            setSelectedStage(s.value);
                          }
                        }}
                        disabled={isUpdating || isBlocked}
                        className="accent-[#EE4D2D] h-4 w-4 disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                      <span className={isSelected ? 'font-semibold' : ''}>
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isBlocked && (
                        <span className="text-[10px] text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                          Requires document
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[11px] text-gray-400 font-normal">
                          Current
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            {isMovingToDone && !isNoChange && !isSelectedStageBlocked && (
              <p className="text-xs text-gray-500 mt-2">
                Setting this vendor to Active will complete their onboarding and remove them from the active queue.
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              Updated by: {currentUser?.name || 'Sarah Jenkins'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isUpdating}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded border border-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isNoChange || isUpdating || !isAuthenticated || isSelectedStageBlocked}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d83f21] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
