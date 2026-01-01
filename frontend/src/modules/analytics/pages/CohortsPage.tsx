import React, { useEffect, useState } from 'react';
import { getCohorts } from '../services/analytics.service';
import type { CohortResult } from '../types/analytics.types';

export function CohortsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<CohortResult | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const out = await getCohorts();
      setData(out);
    } catch (e: any) {
      setErr(e?.message || 'Erro ao carregar cohorts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={load}>Recarregar</button>
        {err ? <span style={{ color: '#b00020' }}>{err}</span> : null}
      </div>

      <div style={{ border: '1px solid #e6e6e6', borderRadius: 14, padding: 14, background: '#fff' }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Cohorts</div>
        {loading ? <div style={{ opacity: 0.7 }}>Carregando…</div> : null}
        {!loading && !data ? <div style={{ opacity: 0.7 }}>Sem dados.</div> : null}

        {!loading && data ? (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '8px 6px' }}>Cohort</th>
                  <th style={{ padding: '8px 6px' }}>Size</th>
                  <th style={{ padding: '8px 6px' }}>Retention</th>
                </tr>
              </thead>
              <tbody>
                {data.cohorts.map((c) => (
                  <tr key={c.cohort} style={{ borderBottom: '1px solid #f3f3f3' }}>
                    <td style={{ padding: '8px 6px', fontWeight: 600 }}>{c.cohort}</td>
                    <td style={{ padding: '8px 6px' }}>{c.size}</td>
                    <td style={{ padding: '8px 6px' }}>{c.retention.map((r, i) => `${i}:${Math.round(r * 100)}%`).join(' • ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
