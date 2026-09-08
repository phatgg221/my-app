'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { users, currentUser, setCurrentUser, isLoading } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black text-xl tracking-tight">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Shoppee Vendor Ops</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Onboarding
              </span>
            </div>
            <p className="text-xs text-slate-400">KYC Verification, Stage Transitions & S3 Compliance</p>
          </div>
        </div>

        {/* Mock Login Dropdown */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2">
            <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="hidden md:inline font-medium">Active Coordinator:</span>
            
            {isLoading ? (
              <div className="h-5 w-32 bg-slate-700 animate-pulse rounded"></div>
            ) : (
              <div className="relative inline-block">
                <select
                  aria-label="Select Mock Ops Coordinator"
                  value={currentUser?.id || ''}
                  onChange={(e) => {
                    const selected = users.find((u) => u.id === e.target.value);
                    if (selected) setCurrentUser(selected);
                  }}
                  className="bg-slate-900 text-slate-200 font-semibold text-xs rounded-lg pl-2.5 pr-8 py-1 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
