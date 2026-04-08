import type { Metadata } from 'next';
import './globals.css';
// 🚩 IMPORTANTE: Caminho corrigido para 'context' (singular)
import { DashboardProvider } from '@/context/DashboardContext'; 
import { CallProvider } from '@/context/CallContext';

export const metadata: Metadata = {
  title: 'Análise de chamadas | Inteligência SDR',
  description: 'Plataforma de inteligência para análise e avaliação de chamadas.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="font-body antialiased bg-background text-foreground min-h-screen">
        {/* 🚩 Ordem de Precedência: Dashboard (Auth) envolve Call (Dados) */}
        <DashboardProvider>
          <CallProvider>
            {children}
          </CallProvider>
        </DashboardProvider>
      </body>
    </html>
  );
}