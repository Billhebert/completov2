import React, { useEffect, useState } from 'react';
import { getChurn } from '../services/analytics.service';
import type { ChurnResult } from '../types/analytics.types';

export function ChurnPage() {
  const [periodDays, setPeriodDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ChurnResult | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const out = await getChurn({ periodDays: String(periodDays) });
      setData(out);
    } catch (e: any) {
      setErr(e?.message || 'Erro ao carregar churn');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodDays]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={load}>Recarregar</button>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Period (days)</span>
        <select value={periodDays} onChange={(e) => setPeriodDays(Number(e.target.value))}>
          {[7, 14, 30, 60, 90].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {err ? <span style={{ color: '#b00020' }}>{err}</span> : null}
      </div>

      <div style={{ border: '1px solid #e6e6e6', borderRadius: 14, padding: 14, background: '#fff' }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Churn</div>

        {loading ? <div style={{ opacity: 0.7 }}>Carregando…</div> : null}
        {!loading && !data ? <div style={{ opacity: 0.7 }}>Sem dados.</div> : null}

        {!loading && data ? (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, padding: 10, minWidth: 220 }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Churn Rate</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{Math.round(data.churnRate * 100)}%</div>
            </div>
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, padding: 10, minWidth: 220 }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Churned</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{data.churned}</div>
            </div>
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, padding: 10, minWidth: 220 }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Active</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{data.active}</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
