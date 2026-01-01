import React, { useEffect, useMemo, useState } from 'react';
import type { CustomReport, ReportExecutionResult } from '../types/analytics.types';
import {
  createReport,
  executeReport,
  exportReportExcelUrl,
  exportReportPdfUrl,
  listReports,
  scheduleReport,
} from '../services/analytics.service';

function Modal({ open, children, onClose }: { open: boolean; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.25)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: 860, maxWidth: '95vw', background: '#fff', borderRadius: 14, padding: 14 }}>
        {children}
      </div>
    </div>
  );
}

export function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [reports, setReports] = useState<CustomReport[]>([]);
  const [selected, setSelected] = useState<CustomReport | null>(null);
  const [execution, setExecution] = useState<ReportExecutionResult | null>(null);

  const [builderOpen, setBuilderOpen] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await listReports();
      setReports(r || []);
    } catch (e: any) {
      setErr(e?.message || 'Erro ao listar reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function runReport(rep: CustomReport) {
    setSelected(rep);
    setExecution(null);
    try {
      const out = await executeReport(rep.id);
      setExecution(out);
    } catch (e: any) {
      setErr(e?.message || 'Erro ao executar report');
    }
  }

  async function createQuickReport() {
    setBuilderOpen(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={load}>Recarregar</button>
          {err ? <span style={{ color: '#b00020' }}>{err}</span> : null}
        </div>
        <button onClick={createQuickReport}>+ New Report</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 12 }}>
        <div style={{ border: '1px solid #e6e6e6', borderRadius: 14, padding: 14, background: '#fff' }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Reports</div>

          {loading ? <div style={{ opacity: 0.7 }}>Carregando…</div> : null}
          {!loading && reports.length === 0 ? <div style={{ opacity: 0.7 }}>Sem reports.</div> : null}

          {!loading && reports.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reports.map((r) => (
                <div key={r.id} style={{ border: '1px solid #f0f0f0', borderRadius: 12, padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{r.name}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{r.dataSource}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button onClick={() => runReport(r)}>Run</button>
                      <button onClick={() => window.open(exportReportPdfUrl(r.id), '_blank', 'noopener,noreferrer')}>PDF</button>
                      <button onClick={() => window.open(exportReportExcelUrl(r.id), '_blank', 'noopener,noreferrer')}>Excel</button>
                      <button
                        onClick={async () => {
                          try {
                            await scheduleReport(r.id, { cron: '0 8 * * 1', timezone: 'America/Sao_Paulo' });
                            alert('Agendado (exemplo semanal 08:00). Ajuste payload conforme seu backend.');
                          } catch (e: any) {
                            setErr(e?.message || 'Erro ao agendar');
                          }
                        }}
                      >
                        Schedule
                      </button>
                    </div>
                  </div>

                  {r.description ? <div style={{ marginTop: 6, opacity: 0.75 }}>{r.description}</div> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ border: '1px solid #e6e6e6', borderRadius: 14, padding: 14, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
            <div style={{ fontWeight: 700 }}>Result</div>
            {selected ? <div style={{ fontSize: 12, opacity: 0.7 }}>{selected.name}</div> : null}
          </div>

          {!selected ? <div style={{ marginTop: 10, opacity: 0.7 }}>Selecione um report e clique em “Run”.</div> : null}

          {selected && !execution ? <div style={{ marginTop: 10, opacity: 0.7 }}>Executando / aguardando…</div> : null}

          {execution ? (
            <div style={{ marginTop: 10 }}>
              {execution.summary ? (
                <pre style={{ background: '#fafafa', padding: 10, borderRadius: 10, overflow: 'auto' }}>
                  {JSON.stringify(execution.summary, null, 2)}
                </pre>
              ) : null}

              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                      {execution.columns.map((c) => (
                        <th key={c.key} style={{ padding: '8px 6px' }}>
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {execution.rows.slice(0, 200).map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f3f3' }}>
                        {execution.columns.map((c) => (
                          <td key={c.key} style={{ padding: '8px 6px' }}>
                            {String(row[c.key] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {execution.rows.length > 200 ? (
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>Mostrando 200 linhas (limite de UI).</div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ReportBuilderModal open={builderOpen} onClose={() => setBuilderOpen(false)} onCreated={load} />
    </div>
  );
}

function ReportBuilderModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('New Report');
  const [description, setDescription] = useState('');
  const [dataSource, setDataSource] = useState<CustomReport['dataSource']>('deals');

  const [metricField, setMetricField] = useState('amount');
  const [metricAgg, setMetricAgg] = useState('sum');
  const [dimension, setDimension] = useState('stage');

  const payload = useMemo(() => {
    return {
      name,
      description: description || undefined,
      dataSource,
      metrics: [{ field: metricField, aggregation: metricAgg, label: `${metricAgg}(${metricField})` }],
      dimensions: dimension ? [dimension] : [],
    };
  }, [name, description, dataSource, metricField, metricAgg, dimension]);

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Create Custom Report</div>
        <button onClick={onClose}>Fechar</button>
      </div>

      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Name</div>
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Data Source</div>
          <select value={dataSource} onChange={(e) => setDataSource(e.target.value as any)} style={{ width: '100%' }}>
            <option value="deals">deals</option>
            <option value="contacts">contacts</option>
            <option value="interactions">interactions</option>
            <option value="invoices">invoices</option>
            <option value="users">users</option>
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Description</div>
          <input value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Metric Field</div>
          <input value={metricField} onChange={(e) => setMetricField(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Aggregation</div>
          <select value={metricAgg} onChange={(e) => setMetricAgg(e.target.value)} style={{ width: '100%' }}>
            <option value="sum">sum</option>
            <option value="avg">avg</option>
            <option value="count">count</option>
            <option value="min">min</option>
            <option value="max">max</option>
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Dimension (group by)</div>
          <input value={dimension} onChange={(e) => setDimension(e.target.value)} style={{ width: '100%' }} />
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <pre style={{ margin: 0, background: '#fafafa', padding: 10, borderRadius: 10, maxHeight: 160, overflow: 'auto' }}>
          {JSON.stringify(payload, null, 2)}
        </pre>

        <button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await createReport(payload as any);
              onClose();
              onCreated();
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? 'Salvando…' : 'Criar'}
        </button>
      </div>
    </Modal>
  );
}
