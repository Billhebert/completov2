import React from 'react';

export type TabDef = { key: string; label: string };

export function Tabs({
  tabs,
  activeKey,
  onChange,
}: {
  tabs: TabDef[];
  activeKey: string;
  onChange: (k: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: active ? '1px solid #111' : '1px solid #ddd',
              background: active ? '#111' : '#fff',
              color: active ? '#fff' : '#111',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
