import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  if (!baseUrl) {
    console.error("❌ [CONFIG ERROR] NEXT_PUBLIC_API_BASE_URL não definida.");
    return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const targetUrl = new URL('/api/stats/summary', baseUrl);
  targetUrl.search = searchParams.toString();

  // 🚩 CONFIGURAÇÃO DE TIMEOUT (30 segundos)
  const controller = new AbortController();
  const TIMEOUT_MS = 30000; 
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    console.log(`📊 [PROXY] Chamando: ${targetUrl.href} (Timeout: ${TIMEOUT_MS/1000}s)`);

    const res = await fetch(targetUrl.href, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.WEBHOOK_SECRET || '' 
      },
      credentials: 'include', // 🚩 Habilita o envio de cookies para persistência da sessão
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    const responseText = await res.text();
    let data;
    
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      data = { rawResponse: responseText.substring(0, 500) };
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Erro no servidor de métricas', details: data }, 
        { status: res.status }
      );
    }

    return NextResponse.json(data);

  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      console.error(`⏱️ [TIMEOUT] O Render demorou mais de ${TIMEOUT_MS/1000}s.`);
      return NextResponse.json(
        { error: 'O servidor demorou demais para responder (Timeout de 30s).' }, 
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Falha de conexão', details: err.message }, 
      { status: 503 }
    );
  }
}