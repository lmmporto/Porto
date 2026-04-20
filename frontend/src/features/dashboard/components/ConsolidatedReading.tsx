'use client';
import React from 'react';

interface ReadingData {
  texto_analise: string;
  principal_risco: string;
  maior_forca: string;
  status: string;
}

interface ConsolidatedReadingProps {
  data: ReadingData | null;
}

export function ConsolidatedReading({ data }: ConsolidatedReadingProps) {
  const isLoading = !data || data.status !== 'completed';

  return (
    <section className="mt-5">
      <article
        style={{
          background: `
            radial-gradient(circle at top left, rgba(88,166,255,0.08), transparent 24%),
            radial-gradient(circle at top right, rgba(75,225,183,0.06), transparent 22%),
            linear-gradient(180deg, rgba(19,31,58,0.96), rgba(15,24,45,0.94))
          `,
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '28px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.28)',
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[950px]">
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)' }}>
              Resumo executivo gerado por IA
            </div>
            <h3 style={{ marginTop: 8, fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', color: 'white' }}>
              Leitura consolidada da operação
            </h3>
            <p style={{ marginTop: 16, fontSize: 15, lineHeight: 2, color: 'rgba(255,255,255,0.70)' }}>
              {isLoading ? 'IA processando leitura da semana...' : data.texto_analise}
            </p>
          </div>

          <div style={{ display: 'grid', minWidth: 260, gap: 12 }} className="sm:grid-cols-3 lg:grid-cols-1">
            <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', padding: '16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)' }}>
                Leitura geral
              </div>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 600, color: 'white' }}>
                {isLoading ? '...' : 'Operação estável'}
              </div>
            </div>
            <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', padding: '16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)' }}>
                Principal risco
              </div>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 600, color: '#FFB8C0' }}>
                {isLoading ? '...' : data.principal_risco}
              </div>
            </div>
            <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', padding: '16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)' }}>
                Maior força
              </div>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 600, color: '#A1F3D8' }}>
                {isLoading ? '...' : data.maior_forca}
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
