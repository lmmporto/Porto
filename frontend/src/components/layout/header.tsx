"use client";

import React from 'react';

export function Header() {
  return (
    <header className="h-16 border-b border-white/5 bg-surface/40 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-bold text-indigo-200 font-headline">Dashboard</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold">Marcus Silva</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">SDR Manager</p>
          </div>
          <div className="w-8 h-8 rounded-full border border-primary/20 overflow-hidden">
            <img src="https://github.com/shadcn.png" alt="Profile" className="object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
}
