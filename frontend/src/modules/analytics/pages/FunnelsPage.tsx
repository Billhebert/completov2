import React, { useState } from 'react';
import { analyzeFunnel, createFunnel } from '../services/analytics.service';
import type { FunnelAnalysis } from '../types/analytics.types';

export function FunnelsPage() {
  const [name, setName] = useState('New Funnel');
  const [timeWindow, setTimeWindow] = useState(30);

  // builder simples: 3 estágios
  const [s1, setS1] = useState('Lead');
  const [s2, setS2] = useState('Qualified');
  const [s3, setS3] = useState('Won');

  const [createdId, setCreatedId] = useState<string | null>(null);
  const [result, setResult] = useState<FunnelAnalysis | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    setErr(null);
    try {
      const payload = {
        name,
        timeWindow,
        stages: [
          { name: s1, filter: { stage: s1 } },
          { name: s2, filter: { stage: s2 } },
          { name: s3, filter: { stage: s3 } },
        ],
      };
      const funnel = await createFunnel(payload);
      setCreatedId(funnel.id);
      setResult(null);
    } catch (e: any) {
      setErr(e?.message || 'Erro ao criar funnel');
    }
  }

  async function analyze() {
    if (!createdId) return;
    setErr(null);
    try {
      const out = await analyzeFunnel(createdId);
      setResult(out);
    } catch (e: any) {
      setErr(e?.message || 'Erro ao analisar funnel');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={create}>Create Funnel</button>
        <button onClick={analyze} disabled={!createdId}>
          Analyze
        </button>
        {createdId ? <span style={{ fontSize: 12, opacity: 0.7 }}>ID: {createdId}</span> : null}
        {err ? <span style={{ color: '#b00020' }}>{err}</span> : null}
      </div>

      <div style={{ border: '1px solid #e6e6e6', borderRadius: 14, padding: 14, background: '#fff' }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Builder</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Name</div>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Time Window (days)</div>
            <input type="number" value={timeWindow} onChange={(e) => setTimeWindow(Number(e.target.value))} style={{ width: '100%' }} />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Stage 1</div>
            <input value={s1} onChange={(e) => setS1(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Stage 2</div>
            <input value={s2} onChange={(e) => setS2(e.target.value)} style={{ width: '100%' }} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Stage 3</div>
            <input value={s3} onChange={(e) => setS3(e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div style={{ border: '1px solid #e6e6e6', borderRadius: 14, padding: 14, background: '#fff' }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Analysis</div>

        {!result ? <div style={{ opacity: 0.7 }}>Crie o funil e clique em Analyze.</div> : null}

        {result ? (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '8px 6px' }}>Stage</th>
                  <th style={{ padding: '8px 6px' }}>Entered</th>
                  <th style={{ padding: '8px 6px' }}>Converted</th>
                  <th style={{ padding: '8px 6px' }}>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {result.stages.map((s) => (
                  <tr key={s.stage} style={{ borderBottom: '1px solid #f3f3f3' }}>
                    <td style={{ padding: '8px 6px', fontWeight: 600 }}>{s.stage}</td>
                    <td style={{ padding: '8px 6px' }}>{s.entered}</td>
                    <td style={{ padding: '8px 6px' }}>{s.converted}</td>
                    <td style={{ padding: '8px 6px' }}>{Math.round(s.conversionRate * 100)}%</td>
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
