import type { Metadata } from 'next';
import './globals.css';
// 🚩 IMPORTANTE: Importe seus Providers aqui
import { DashboardProvider } from '@/contexts/DashboardContext'; 
import { CallProvider } from '@/contexts/CallContext';

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
      <body>
        {/* 🚩 Ordem de Precedência: Autenticação envolve Dados de Negócio */}
        <DashboardProvider>
          <CallProvider>
            {children}
          </CallProvider>
        </DashboardProvider>
      </body>
    </html>
  );
}