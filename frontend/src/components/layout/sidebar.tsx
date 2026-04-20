'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar, isAdmin } = useDashboard();

  const navItems = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard Geral', adminOnly: true },
    { href: '/dashboard/me', icon: '👤', label: 'Meu Painel' },
    { href: '/dashboard/calls', icon: '📞', label: 'Chamadas', adminOnly: true }, // Restrito a admin
    { href: '/dashboard/ranking', icon: '🏆', label: 'Ranking', adminOnly: true }, // Restrito a admin
  ];

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-full bg-[#0A1630] transition-all duration-300 ease-in-out border-r border-white/5
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="flex items-center justify-between p-4 h-16 border-b border-white/5">
        {!isSidebarCollapsed && <span className="text-xl font-bold text-white">Anty CRM</span>}
        <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-white/10 text-white">
          {isSidebarCollapsed ? '▶' : '◀'}
        </button>
      </div>
      <nav className="mt-4">
        {navItems.map(item => {
          if (item.adminOnly && !isAdmin) return null; // Bloqueia itens de admin para não-admins
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-4 py-3 px-4 text-white/70 hover:bg-white/10 transition-colors duration-200
              ${pathname === item.href ? 'bg-white/15 text-white' : ''}`}>
              <span className="text-xl">{item.icon}</span>
              {!isSidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
