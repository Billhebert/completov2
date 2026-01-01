import React from 'react';
import type { ActivityItem } from '../types/analytics.types';

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR');
}

export function ActivityFeed({
  data,
  loading,
  days,
  onDaysChange,
}: {
  data: ActivityItem[];
  loading?: boolean;
  days: number;
  onDaysChange: (n: number) => void;
}) {
  return (
    <div style={{ border: '1px solid #e6e6e6', borderRadius: 14, padding: 14, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <div style={{ fontWeight: 700 }}>Activity</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Dias</span>
          <select value={days} onChange={(e) => onDaysChange(Number(e.target.value))}>
            {[7, 14, 30, 60, 90].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? <div style={{ marginTop: 10, opacity: 0.7 }}>Carregando…</div> : null}
      {!loading && data?.length === 0 ? <div style={{ marginTop: 10, opacity: 0.7 }}>Sem dados.</div> : null}

      {!loading && data?.length ? (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.slice(0, 30).map((a) => (
            <div key={a.id} style={{ border: '1px solid #f0f0f0', borderRadius: 12, padding: 10 }}>
              <div style={{ fontWeight: 600 }}>{a.name}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {a.actor?.name ? `Por ${a.actor.name} • ` : ''}
                {fmtDate(a.createdAt)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
