'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, ChevronDown, ShoppingBag } from 'lucide-react';

export default function Navbar() {
  const { users, currentUser, setCurrentUser, isLoading } = useAuth();

  return (
    <header className="bg-gradient-to-r from-[#EE4D2D] via-[#f05330] to-[#FF5722] text-white shadow-md sticky top-0 z-30 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-md text-[#EE4D2D] font-black text-2xl tracking-tighter">
            <ShoppingBag className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                Shopee
                <span className="text-orange-200 font-medium text-base">Ops Centre</span>
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                Vendor Onboarding
              </span>
            </div>
            <p className="text-xs text-orange-100 font-medium">
              Stage Management • KYC Compliance • S3 Document Storage
            </p>
          </div>
        </div>

        {/* Mock Login Dropdown */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs bg-black/10 border border-white/20 rounded-xl px-3 py-1.5 text-white backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-orange-200 shrink-0" />
            <span className="hidden md:inline font-semibold text-orange-100">Coordinator:</span>

            {isLoading ? (
              <div className="h-6 w-32 bg-white/20 animate-pulse rounded"></div>
            ) : (
              <div className="relative inline-block">
                <select
                  aria-label="Select Mock Ops Coordinator"
                  value={currentUser?.id || ''}
                  onChange={(e) => {
                    const selected = users.find((u) => u.id === e.target.value);
                    if (selected) setCurrentUser(selected);
                  }}
                  className="bg-white text-slate-800 font-bold text-xs rounded-lg pl-2.5 pr-8 py-1.5 shadow-sm border border-orange-100 focus:outline-none focus:ring-2 focus:ring-white appearance-none cursor-pointer"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="text-slate-800 font-medium">
                      {u.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
