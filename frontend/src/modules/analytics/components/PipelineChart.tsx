import React from 'react';
import type { PipelineMetric } from '../types/analytics.types';
import { formatMoneyBRL, formatNumber } from './format';

export function PipelineChart({ data, loading }: { data: PipelineMetric[]; loading?: boolean }) {
  return (
    <div style={{ border: '1px solid #e6e6e6', borderRadius: 14, padding: 14, background: '#fff' }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Pipeline</div>

      {loading ? <div style={{ opacity: 0.7 }}>Carregando…</div> : null}

      {!loading && data?.length === 0 ? <div style={{ opacity: 0.7 }}>Sem dados.</div> : null}

      {!loading && data?.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map((s) => (
            <div key={s.stage} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ minWidth: 120 }}>{s.stage}</div>
              <div style={{ opacity: 0.75 }}>Count: {formatNumber(s.count)}</div>
              <div style={{ fontWeight: 600 }}>{formatMoneyBRL(s.value)}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
