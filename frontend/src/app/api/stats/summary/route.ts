import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Validação da URL base
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    console.error("❌ Erro: NEXT_PUBLIC_API_BASE_URL não definida.");
    return NextResponse.json({ error: 'Configuração de API ausente no Frontend' }, { status: 500 });
  }

  // 2. Preparação da URL e Parâmetros (repassando datas e filtros)
  const { searchParams } = new URL(request.url);
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const url = `${cleanBaseUrl}/api/stats/summary?${searchParams.toString()}`;

  try {
    console.log(`📊 [PROXY STATS] Solicitando métricas ao Render: ${url}`);

    const res = await fetch(url, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.WEBHOOK_SECRET || '' 
      },
      next: { revalidate: 0 } // Desativa cache para dados em tempo real
    });

    // 3. Captura segura da resposta para não perder logs de erro em HTML
    const responseText = await res.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      data = { rawResponse: responseText };
    }

    // 4. Tratamento de Erro do Render (ex: O erro 500 antigo)
    if (!res.ok) {
      console.error(`🚨 [BACKEND STATS ERROR] Status ${res.status}:`, data);
      return NextResponse.json(
        { 
          error: 'Erro ao carregar métricas do Backend', 
          status: res.status,
          details: data 
        }, 
        { status: res.status }
      );
    }

    // 5. Sucesso: Retorna as métricas e o ranking
    console.log(`✅ [PROXY STATS] Métricas recebidas com sucesso.`);
    return NextResponse.json(data);

  } catch (err: any) {
    // 6. Falha de rede (Render offline ou reiniciando)
    console.error(`❌ [NETWORK ERROR STATS] Falha ao conectar:`, err.message);
    return NextResponse.json(
      { 
        error: 'Não foi possível conectar ao servidor Render para buscar métricas', 
        details: err.message 
      }, 
      { status: 504 }
    );
  }
}