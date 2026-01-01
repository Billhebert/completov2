import React, { useMemo } from 'react';
import type { TimeSeriesPoint } from '../types/analytics.types';
import { formatNumber } from './format';

/**
 * Sem dependência externa: chart simples com SVG.
 * Você escolhe um "selector" (função) pra extrair o valor numérico do snapshot.
 */
export function TimeSeriesChart({
  title,
  data,
  loading,
  selector,
  rightControls,
}: {
  title: string;
  data: TimeSeriesPoint[];
  loading?: boolean;
  selector: (p: TimeSeriesPoint) => number;
  rightControls?: React.ReactNode;
}) {
  const points = useMemo(() => {
    const sorted = [...(data || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted.map((p) => ({ x: new Date(p.date).getTime(), y: selector(p), raw: p }));
  }, [data, selector]);

  const { pathD, minY, maxY, last } = useMemo(() => {
    if (!points.length) return { pathD: '', minY: 0, maxY: 0, last: 0 };
    const ys = points.map((p) => p.y);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const w = 520;
    const h = 180;
    const pad = 12;

    const minX = points[0].x;
    const maxX = points[points.length - 1].x || minX + 1;

    const sx = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (w - pad * 2);
    const sy = (y: number) => pad + (1 - (y - min) / (max - min || 1)) * (h - pad * 2);

    const d = points
      .map((p, i) => {
        const X = sx(p.x);
        const Y = sy(p.y);
        return `${i === 0 ? 'M' : 'L'} ${X.toFixed(2)} ${Y.toFixed(2)}`;
      })
      .join(' ');

    return { pathD: d, minY: min, maxY: max, last: ys[ys.length - 1] };
  }, [points]);

  return (
    <div style={{ border: '1px solid #e6e6e6', borderRadius: 14, padding: 14, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <div style={{ fontWeight: 700 }}>{title}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {rightControls}
          <div style={{ opacity: 0.7, fontSize: 12 }}>Último: {formatNumber(last)}</div>
        </div>
      </div>

      {loading ? <div style={{ marginTop: 10, opacity: 0.7 }}>Carregando…</div> : null}
      {!loading && !points.length ? <div style={{ marginTop: 10, opacity: 0.7 }}>Sem dados.</div> : null}

      {!loading && points.length ? (
        <div style={{ marginTop: 10 }}>
          <svg width="100%" viewBox="0 0 520 180" style={{ display: 'block' }}>
            <path d={pathD} fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.7 }}>
            <span>Min: {formatNumber(minY)}</span>
            <span>Max: {formatNumber(maxY)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
