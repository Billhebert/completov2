import React from 'react';
import type { TopContact } from '../types/analytics.types';
import { formatMoneyBRL, formatNumber } from './format';

export function TopContactsTable({
  data,
  loading,
  limit,
  onLimitChange,
}: {
  data: TopContact[];
  loading?: boolean;
  limit: number;
  onLimitChange: (n: number) => void;
}) {
  return (
    <div style={{ border: '1px solid #e6e6e6', borderRadius: 14, padding: 14, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <div style={{ fontWeight: 700 }}>Top Contacts</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Limite</span>
          <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))}>
            {[5, 10, 20, 50].map((n) => (
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
        <div style={{ overflow: 'auto', marginTop: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '8px 6px' }}>Nome</th>
                <th style={{ padding: '8px 6px' }}>Email</th>
                <th style={{ padding: '8px 6px' }}>Interações</th>
                <th style={{ padding: '8px 6px' }}>Deals</th>
                <th style={{ padding: '8px 6px' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <td style={{ padding: '8px 6px', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '8px 6px', opacity: 0.8 }}>{c.email || '-'}</td>
                  <td style={{ padding: '8px 6px' }}>{formatNumber(c.interactionCount)}</td>
                  <td style={{ padding: '8px 6px' }}>{formatNumber(c.dealCount)}</td>
                  <td style={{ padding: '8px 6px' }}>{formatMoneyBRL(c.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
