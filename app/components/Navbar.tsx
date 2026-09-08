'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { GoogleGLogo } from './GoogleLogo';
import { ChevronDown, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { currentUser, isAuthenticated, isLoading, signOut, loginWithRealGoogle } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-gradient-to-r from-[#EE4D2D] via-[#f05330] to-[#FF5722] text-white shadow-md sticky top-0 z-30 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center shadow-md overflow-hidden p-1 shrink-0">
            <Image
              src="/shopee-logo.png"
              alt="Shopee Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
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

        {/* Real Google OAuth Button & Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {isLoading ? (
            <div className="h-9 w-40 bg-white/20 animate-pulse rounded-xl"></div>
          ) : isAuthenticated && currentUser ? (
            <div className="relative" ref={menuRef}>
              {/* Authenticated User Button */}
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 bg-white text-slate-800 rounded-xl pl-1.5 pr-3 py-1 shadow-sm hover:shadow-md border border-orange-100 transition-all cursor-pointer group"
              >
                <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                  {currentUser.avatar ? (
                    <Image
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="28px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#EE4D2D] text-white font-bold text-xs">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="text-left leading-tight hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <span>{currentUser.name}</span>
                    <GoogleGLogo className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {currentUser.role || 'Ops Coordinator'}
                  </span>
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                    isMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-40 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Info Header */}
                  <div className="p-3 bg-slate-50 rounded-xl mb-1 flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-200 shadow-inner">
                      {currentUser.avatar ? (
                        <Image
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#EE4D2D] text-white font-bold text-sm">
                          {currentUser.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {currentUser.email || 'Google Account'}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-[#EE4D2D]">
                          <ShieldCheck className="w-3 h-3" />
                          {currentUser.role || 'Ops Coordinator'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        loginWithRealGoogle();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-left"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Switch Google Account</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Real Google Sign-in Button (Logged out state) */
            <button
              type="button"
              onClick={loginWithRealGoogle}
              className="flex items-center gap-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-xl px-4 py-2 shadow-sm hover:shadow-md border border-slate-200 transition-all cursor-pointer group active:scale-95"
            >
              <GoogleGLogo className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
