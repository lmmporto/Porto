import type { Metadata } from 'next';
import './globals.css';
// 🚩 IMPORTANTE: Caminho corrigido para 'context' (singular)
import { DashboardProvider } from '@/context/DashboardContext'; 
import { CallProvider } from '@/context/CallContext';
import { ThemeProvider } from '@/components/theme-provider';

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
    <html lang="pt-BR" className="dark" suppressHydrationWarning style={{ colorScheme: 'dark' }}>
      <body className="bg-surface text-on-surface font-body antialiased h-screen overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* 🚩 Ordem de Precedência: Dashboard (Auth) envolve Call (Dados) */}
          <DashboardProvider>
            <CallProvider>
              {children}
            </CallProvider>
          </DashboardProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}