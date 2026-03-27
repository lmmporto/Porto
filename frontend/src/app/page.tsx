"use client";

import { Button } from '@/components/ui/button';
import { NiboLogo } from '@/components/ui/nibo-logo';
import { ShieldCheck } from 'lucide-react';

export default function Home() {
  const login = () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const loginUrl = `${apiBaseUrl}/auth/google`;

    if (!apiBaseUrl) {
      console.error('API BASE URL não configurada.');
      alert('Erro de configuração: URL da API não encontrada.');
      return;
    }

    // Redireciona para o login do Google no backend
    window.open(loginUrl, '_self');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white p-6 animate-in fade-in duration-1000">
      <div className="w-full max-w-sm space-y-12 text-center">
        
        {/* ÁREA DA LOGO (O NiboLogo já contém o título em azul) */}
        <div className="space-y-4 flex flex-col items-center">
          <div className="flex items-center justify-center">
            {/* Aumentei um pouco o tamanho aqui para ficar imponente */}
            <NiboLogo className="text-4xl" />
          </div>

          {/* Mantemos apenas o subtítulo em cinza aqui embaixo */}
          <p className="text-slate-400 text-sm font-medium px-4">
            Inteligência Artificial para gestão de performance SDR.
          </p>
        </div>

        {/* BOTÃO DE ACESSO ÚNICO */}
        <div className="space-y-6">
          <Button
            onClick={login}
            className="w-full h-14 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 text-base font-bold"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Acessar com Google
          </Button>

          <div className="flex flex-col items-center gap-2 pt-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-200 uppercase tracking-[0.2em]">
              <ShieldCheck className="w-3 h-3" />
              Uso Corporativo Interno
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}