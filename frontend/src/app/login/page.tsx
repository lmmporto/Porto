"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { NiboLogo } from '@/components/ui/nibo-logo';

export default function LoginPage() {
  const handleGoogleLogin = () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const loginUrl = `${apiBaseUrl}/auth/google`;

    if (!apiBaseUrl) {
      console.error('[ERROR] NEXT_PUBLIC_API_BASE_URL não definida.');
      alert('Erro de configuração: URL da API não encontrada.');
      return;
    }

    // Redireciona na mesma aba para o fluxo oficial
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-700">
        
        {/* Logo Superior */}
        <div className="text-center flex flex-col items-center mb-4">
          <NiboLogo className="text-3xl" />
        </div>

        <Card className="border-slate-200 shadow-xl bg-white">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold text-slate-900">Análise de Chamadas</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Inteligência de Performance para SDRs
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 pb-8">
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-12 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] shadow-sm"
            >
              {/* SVG Oficial do Google */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-slate-700 font-bold text-xs uppercase tracking-wider">
                Acessar com Google
              </span>
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 justify-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-t border-slate-50 py-4 bg-slate-50/50 rounded-b-xl text-center">
            Uso Corporativo Interno
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}