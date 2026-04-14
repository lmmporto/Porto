"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  UploadCloud,
  LogOut,
  Users,
  LayoutDashboard,
  History,
  User // 🚩 Novo ícone para o painel pessoal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NiboLogo } from '@/components/ui/nibo-logo';
import { useDashboard } from '@/context/DashboardContext'; // 🚩 Importação do contexto
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
  const { isAdmin, checkUser } = useDashboard(); // 🚩 Extração de permissões

  const handleLogout = async () => {
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
      await fetch(`${baseUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
      await checkUser(); // Reseta o estado do contexto
      router.push('/login');
    } catch (e) {
      router.push('/login');
    }
  };

  // 🚩 ESTRUTURA DINÂMICA DE MENU
  const menuItems = [
    {
      name: "Meu Painel",
      href: "/me",
      icon: User,
    },
    {
      name: "Histórico",
      href: "/dashboard/calls",
      icon: History,
    },
    ...(isAdmin ? [
      {
        name: "Performance",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        name: "SDRs",
        href: "/dashboard/sdrs",
        icon: Users,
      },
      {
        name: "Upload Manual",
        href: "/dashboard/upload",
        icon: UploadCloud,
      },
    ] : []),
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-slate-800 bg-slate-950">
      <SidebarHeader className="p-6">
        <Link href={isAdmin ? "/dashboard" : "/me"} className="flex items-center gap-3 text-slate-200 group">
          <NiboLogo className="text-sm group-data-[collapsible=icon]:hidden" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const isActive = item.href === '/dashboard' || item.href === '/me'
                  ? pathname === item.href
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
                          ? "bg-indigo-500/10 text-indigo-400 font-bold"
                          : "text-slate-500 hover:text-slate-200 hover:bg-slate-800"
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className={cn(
                          "w-4 h-4",
                          isActive ? "text-indigo-400" : "text-slate-600"
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

      <SidebarFooter className="p-6 border-t border-slate-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors h-10 px-3"
              tooltip="Sair"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}