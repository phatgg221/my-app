'use client';

import React from 'react';
import { useVendorContext } from '@/context/VendorContext';
import { Building2, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

export default function KpiCards() {
  const { metrics } = useVendorContext();

  return (
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
        className={`border rounded-2xl p-5 shadow-sm transition-all ${
          metrics.stuck > 0
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
  );
}
