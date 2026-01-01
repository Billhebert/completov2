import React, { useEffect, useState } from 'react';
import { getCLV } from '../services/analytics.service';
import type { CLVResult } from '../types/analytics.types';
import { formatMoneyBRL } from '../components/format';

export function CLVPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<CLVResult | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const out = await getCLV();
      setData(out);
    } catch (e: any) {
      setErr(e?.message || 'Erro ao carregar CLV');
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
        <div style={{ fontWeight: 700, marginBottom: 10 }}>CLV</div>

        {loading ? <div style={{ opacity: 0.7 }}>Carregando…</div> : null}
        {!loading && !data ? <div style={{ opacity: 0.7 }}>Sem dados.</div> : null}

        {!loading && data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, padding: 10, minWidth: 220 }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Average CLV</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{formatMoneyBRL(data.averageClv)}</div>
            </div>

            {data.bySegment?.length ? (
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                      <th style={{ padding: '8px 6px' }}>Segment</th>
                      <th style={{ padding: '8px 6px' }}>CLV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bySegment.map((s) => (
                      <tr key={s.segment} style={{ borderBottom: '1px solid #f3f3f3' }}>
                        <td style={{ padding: '8px 6px', fontWeight: 600 }}>{s.segment}</td>
                        <td style={{ padding: '8px 6px' }}>{formatMoneyBRL(s.clv)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ opacity: 0.7 }}>Sem segmentação.</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
