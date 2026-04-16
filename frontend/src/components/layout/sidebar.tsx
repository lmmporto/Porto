"use client";

import { LayoutDashboard, Mic, Trophy, TrendingUp, Brain } from "lucide-react"; // Corrigido Psychology para Brain
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const Sidebar = () => {
  const pathname = usePathname();
  const items = [
    { label: "Gestão", href: "/dashboard", icon: LayoutDashboard },
    { label: "Ligações", href: "/dashboard/calls", icon: Mic },
    { label: "Ranking", href: "/dashboard/ranking", icon: Trophy },
    { label: "Insights", href: "/dashboard/insights", icon: TrendingUp },
    { label: "Coaching", href: "/dashboard/coaching", icon: Brain }, // Corrigido Psychology para Brain
  ];

  return (
    <aside className="fixed w-64 h-screen bg-slate-950 border-r border-white/5 p-6 flex flex-col">
      <header className="mb-10">
        <h1 className="text-primary font-black italic text-xl">Obsidian Lens</h1>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-headline">Command Center</p>
      </header>
      <nav className="space-y-2">
        {items.map(item => (
          <Link 
            key={item.href} 
            href={item.href} 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
              pathname === item.href 
                ? 'bg-primary/10 text-primary border-r-2 border-primary font-bold' 
                : 'text-slate-500 hover:bg-surface-container-highest/50'
            )}
          >
            <item.icon size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};
