"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  UploadCloud, 
  LogOut,
  Users,
  LayoutDashboard,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NiboLogo } from '@/components/ui/nibo-logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
} from '@/components/ui/sidebar';

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('auth_v1');
    router.push('/login');
  };

  // 🚩 ESTRUTURA REAL (Confirmada pelas suas imagens):
  const menuItems = [
    { 
      name: 'Performance', 
      href: '/dashboard', 
      icon: LayoutDashboard 
    },
    { 
      name: 'SDRs', 
      href: '/dashboard/sdrs', 
      icon: Users 
    },
    { 
      name: 'Histórico', 
      href: '/dashboard/calls', 
      icon: History 
    },
    { 
      name: 'Upload Manual', 
      href: '/dashboard/upload', 
      icon: UploadCloud 
    },
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-slate-100 bg-white">
      <SidebarHeader className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 text-slate-900 group">
          <NiboLogo className="text-sm group-data-[collapsible=icon]:hidden" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                // 🚩 Lógica de Ativo:
                // - Se for a Home, só ativa se o caminho for EXATAMENTE /dashboard
                // - Para os outros, ativa se o caminho começar com a rota (ex: /calls/123 ativa o Histórico)
                const isActive = item.href === '/dashboard' 
                  ? pathname === '/dashboard' 
                  : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.name}
                      className={cn(
                        "transition-all duration-200 rounded-lg h-10 px-3",
                        isActive
                          ? "bg-indigo-50 text-indigo-700 font-bold" 
                          : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className={cn(
                          "w-4 h-4", 
                          isActive ? "text-indigo-600" : "text-slate-300"
                        )} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {item.name}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-slate-50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 transition-colors h-10 px-3"
              tooltip="Sair"
            >
              <LogOut className="w-4 h-4 text-slate-300 group-hover:text-red-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}