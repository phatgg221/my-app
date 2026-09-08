'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useVendorContext } from '@/context/VendorContext';
import { Lock } from 'lucide-react';

export default function ReadOnlyBanner() {
  const { isAuthenticated, loginWithRealGoogle } = useAuth();
  const { loading } = useVendorContext();

  if (isAuthenticated || loading) {
    return null;
  }

  return (
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
  );
}
