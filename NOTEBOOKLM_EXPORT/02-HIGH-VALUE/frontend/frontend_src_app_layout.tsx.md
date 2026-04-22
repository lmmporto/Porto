# layout.tsx

## Visão geral
- Caminho original: `frontend/src/app/layout.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **layout**
- Criticidade: **important**
- Score de importância: **78**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **37**
- Imports detectados: **5**
- Exports detectados: **3**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como layout no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: RootLayout, function, metadata. Funções/classes detectadas: RootLayout. Dependências locais detectadas: ./globals.css, @/components/theme-provider, @/context/CallContext, @/context/DashboardContext. Dependências externas detectadas: next. Temas relevantes detectados: auth, dashboard, sdr. Indícios de framework/arquitetura: react/tsx, next-app-router.

## Dependências locais
- `./globals.css`
- `@/components/theme-provider`
- `@/context/CallContext`
- `@/context/DashboardContext`

## Dependências externas
- `next`

## Todos os imports detectados
- `./globals.css`
- `@/components/theme-provider`
- `@/context/CallContext`
- `@/context/DashboardContext`
- `next`

## Exports detectados
- `RootLayout`
- `function`
- `metadata`

## Funções e classes detectadas
- `RootLayout`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `auth`
- `dashboard`
- `sdr`

## Indícios de framework/arquitetura
- `react/tsx`
- `next-app-router`

## Código
```tsx
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
```
