import React from 'react';
import { cn } from '@/lib/utils';

export function NiboLogo({ className }: { className?: string }) {
  return (
    <span 
      className={cn(
        "font-headline font-bold tracking-tight text-[#00338D] select-none uppercase",
        className
      )}
    >
      Análise de chamadas
    </span>
  );
}
