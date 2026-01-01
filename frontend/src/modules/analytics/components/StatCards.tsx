import React from 'react';
import type { AnalyticsDashboard } from '../types/analytics.types';
import { formatMoneyBRL, formatNumber } from './format';

function Card({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div
      style={{
        border: '1px solid #e6e6e6',
        borderRadius: 14,
        padding: 14,
        background: '#fff',
        minWidth: 220,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{value}</div>
      {subtitle ? <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>{subtitle}</div> : null}
    </div>
  );
}

export function StatCards({ data, loading }: { data?: AnalyticsDashboard; loading?: boolean }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            style={{
              border: '1px solid #e6e6e6',
              borderRadius: 14,
              padding: 14,
              background: '#fff',
              width: 240,
              height: 88,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const winRate = data.crm.deals.winRate ?? (data.crm.deals.total ? data.crm.deals.won / data.crm.deals.total : 0);

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Card title="Users (total)" value={formatNumber(data.users.total)} subtitle={`Active: ${formatNumber(data.users.active)}`} />
      <Card title="Contacts" value={formatNumber(data.crm.contacts)} />
      <Card title="Deals (total)" value={formatNumber(data.crm.deals.total)} subtitle={`Won: ${formatNumber(data.crm.deals.won)} | Lost: ${formatNumber(data.crm.deals.lost)}`} />
      <Card title="Win Rate" value={`${Math.round(winRate * 100)}%`} />
      <Card title="Revenue" value={formatMoneyBRL(data.crm.revenue)} />
      <Card title="Messages" value={formatNumber(data.communication.messages)} />
      <Card title="Knowledge Nodes" value={formatNumber(data.knowledge.nodes)} />
    </div>
  );
}
