'use client';
import React, { useEffect, useRef } from 'react';

interface SdrPoint {
  id?: string;
  name?: string;
  email?: string;
  rota?: string;
  media_dominio?: number;
  media_dor?: number;
  total_calls?: number;
  real_average?: number;
}

interface HealthRadarProps {
  data: SdrPoint[];
}

const ROUTE_COLORS: Record<string, string> = {
  'ROTA_A': '#58A6FF',
  'Rota A': '#58A6FF',
  'ROTA_B': '#9B7BFF',
  'Rota B': '#9B7BFF',
  'ROTA_C': '#4BE1B7',
  'Rota C': '#4BE1B7',
  default: '#9B7BFF',
};

function getColor(rota?: string): string {
  if (!rota) return ROUTE_COLORS.default;
  return ROUTE_COLORS[rota] || ROUTE_COLORS.default;
}

function getPointClass(rota?: string): string {
  if (!rota) return 'point-b';
  if (rota.includes('A')) return 'point-a';
  if (rota.includes('C')) return 'point-c';
  return 'point-b';
}

export function HealthRadar({ data }: HealthRadarProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = areaRef.current;
    const tooltip = tooltipRef.current;
    if (!area || !tooltip) return;

    // Clear existing dynamic points
    area.querySelectorAll('.scatter-dynamic-point').forEach(el => el.remove());

    const validPoints = data.filter(
      d => typeof d.media_dominio === 'number' && typeof d.media_dor === 'number'
    );

    validPoints.forEach((sdr) => {
      const xPct = Math.min(Math.max((sdr.media_dominio! / 10) * 100, 2), 97);
      const yPct = Math.min(Math.max((sdr.media_dor! / 10) * 100, 2), 97);
      const color = getColor(sdr.rota);
      const firstName = (sdr.name || sdr.email || 'SDR').split(' ')[0];

      const pointEl = document.createElement('button');
      pointEl.type = 'button';
      pointEl.className = `scatter-dynamic-point`;
      pointEl.style.cssText = `
        position: absolute;
        width: 16px;
        height: 16px;
        border-radius: 9999px;
        border: 2px solid rgba(255,255,255,0.88);
        cursor: pointer;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 0 8px rgba(255,255,255,0.02), 0 8px 18px rgba(0,0,0,0.28);
        transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
        background: ${color};
        left: ${xPct}%;
        top: ${100 - yPct}%;
      `;
      pointEl.setAttribute('aria-label', `${sdr.name || sdr.email}, ${sdr.rota || 'SDR'}`);

      const label = document.createElement('span');
      label.style.cssText = `
        position: absolute;
        top: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
        font-size: 11px;
        font-weight: 600;
        color: rgba(255,255,255,0.72);
        letter-spacing: 0.04em;
        pointer-events: none;
      `;
      label.textContent = firstName;
      pointEl.appendChild(label);

      const showTooltip = () => {
        const ttTitle = tooltip.querySelector('#ttTitle');
        const ttRoute = tooltip.querySelector('#ttRoute');
        const ttDomain = tooltip.querySelector('#ttDomain');
        const ttPain = tooltip.querySelector('#ttPain');
        const ttCalls = tooltip.querySelector('#ttCalls');

        if (ttTitle) ttTitle.textContent = sdr.name || sdr.email || 'SDR';
        if (ttRoute) ttRoute.textContent = sdr.rota || '-';
        if (ttDomain) ttDomain.textContent = (sdr.media_dominio ?? 0).toFixed(1);
        if (ttPain) ttPain.textContent = (sdr.media_dor ?? 0).toFixed(1);
        if (ttCalls) ttCalls.textContent = String(sdr.total_calls ?? 0);

        const areaRect = area.getBoundingClientRect();
        const pointRect = pointEl.getBoundingClientRect();
        let left = pointRect.left - areaRect.left + pointRect.width / 2 + 14;
        let top = pointRect.top - areaRect.top - 14;
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateY(0)';
      };

      const hideTooltip = () => {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(6px)';
      };

      pointEl.addEventListener('mouseenter', showTooltip);
      pointEl.addEventListener('focus', showTooltip);
      pointEl.addEventListener('mouseleave', hideTooltip);
      pointEl.addEventListener('blur', hideTooltip);

      area.appendChild(pointEl);
    });
  }, [data]);

  return (
    <div className="mt-6 rounded-[20px] border border-white/6 bg-white/[0.02] p-4 md:p-5">
      <div
        ref={areaRef}
        style={{
          position: 'relative',
          height: '480px',
          borderRadius: '18px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0.01))',
        }}
        className="scatter-grid-react"
      >
        {/* Grid lines via pseudo-elements are handled in global CSS */}
        <style>{`
          .scatter-grid-react::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image:
              linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px);
            background-size: 25% 25%;
          }
          .scatter-grid-react::after {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
              linear-gradient(90deg, transparent 49.8%, rgba(255,255,255,0.12) 50%, transparent 50.2%),
              linear-gradient(180deg, transparent 49.8%, rgba(255,255,255,0.12) 50%, transparent 50.2%);
          }
        `}</style>

        {/* Quadrant labels */}
        <div style={{ position: 'absolute', left: '4%', top: '8%', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', maxWidth: 160, lineHeight: 1.35 }}>
          Boa investigação,<br/>pouca condução
        </div>
        <div style={{ position: 'absolute', right: '4%', top: '8%', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', maxWidth: 160, lineHeight: 1.35, textAlign: 'right' }}>
          Alta performance
        </div>
        <div style={{ position: 'absolute', left: '4%', bottom: '8%', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', maxWidth: 160, lineHeight: 1.35 }}>
          Zona crítica
        </div>
        <div style={{ position: 'absolute', right: '4%', bottom: '8%', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', maxWidth: 160, lineHeight: 1.35, textAlign: 'right' }}>
          Controle sem profundidade
        </div>

        {/* Axis titles */}
        <div style={{ position: 'absolute', left: 3, top: '50%', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)', transform: 'translateY(-50%) rotate(-90deg)' }}>
          Exploração de Dor
        </div>
        <div style={{ position: 'absolute', bottom: 3, left: '50%', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)', transform: 'translateX(-50%)' }}>
          Domínio
        </div>

        {/* Empty state */}
        {data.filter(d => d.media_dominio !== undefined).length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Aguardando dados de performance...</p>
          </div>
        )}

        {/* Tooltip */}
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            minWidth: 220,
            maxWidth: 240,
            padding: '14px 14px 12px',
            borderRadius: 14,
            background: 'linear-gradient(180deg, rgba(14,23,43,0.98), rgba(10,18,35,0.96))',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(12px)',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 160ms ease, transform 160ms ease',
            transform: 'translateY(6px)',
            zIndex: 30,
          }}
        >
          <div id="ttTitle" style={{ fontSize: 14, fontWeight: 600, color: 'white' }}></div>
          <div id="ttRoute" style={{ marginTop: 4, fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12, marginTop: 8, color: 'rgba(255,255,255,0.74)' }}>
            <span>Domínio</span><strong id="ttDomain" style={{ color: 'white' }}></strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.74)' }}>
            <span>Exploração</span><strong id="ttPain" style={{ color: 'white' }}></strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.74)' }}>
            <span>Calls analisadas</span><strong id="ttCalls" style={{ color: 'white' }}></strong>
          </div>
        </div>
      </div>
    </div>
  );
}
