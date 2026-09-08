'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useVendorContext } from '@/context/VendorContext';
import { Lock } from 'lucide-react';

export default function ReadOnlyBanner() {
  const { isAuthenticated, coordinators, selectCoordinator, loginWithRealGoogle } = useAuth();
  const { loading } = useVendorContext();

  if (isAuthenticated || loading) {
    return null;
  }

  return (
    <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-amber-900 shadow-xs animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0 border border-amber-200/80">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <p className="font-bold text-amber-950">Read-Only Mode (Signed Out)</p>
          <p className="text-amber-800 text-[11px] mt-0.5">
            Stage transitions and KYC document uploads are restricted. Select a mock Ops Coordinator or connect via Google.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        {coordinators.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => selectCoordinator(c.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-orange-50 hover:text-[#EE4D2D] hover:border-orange-300 border border-amber-200 font-bold text-slate-800 rounded-xl text-xs transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
            title={`Login as ${c.name} (${c.role})`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{c.name.split(' ')[0]}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={loginWithRealGoogle}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
        >
          <span>Google Sign-In</span>
        </button>
      </div>
    </div>
  );
}

