/**
 * Auditoria List Page (completo, usando 100% os endpoints do audit.service.ts)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AppLayout, Card, Button, DataTable } from '././shared';
import * as auditService from './services/audit.service';
import type { AuditFilters, AuditLog, AuditStats } from './types';
import { handleApiError } from './././core/utils/api';

function formatDate(iso?: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('pt-BR');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Modal({
  open,
  title,
  onClose,
  children,
  width = 920,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: '96vw',
          background: '#fff',
          borderRadius: 14,
          padding: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
          <button onClick={onClose}>Fechar</button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '2px 8px',
        borderRadius: 999,
        border: '1px solid #e5e5e5',
        fontSize: 12,
        opacity: 0.9,
        gap: 6,
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export const AuditListPage: React.FC = () => {
  // tabela
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // paginação (client-side state, server-side fetch)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState<number>(0);

  // filtros (usando exatamente AuditFilters)
  const [filters, setFilters] = useState<AuditFilters>({
    action: '',
    entityType: '',
    entityId: '',
    userId: '',
    startDate: '',
    endDate: '',
    search: '',
  });

  // stats
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<AuditStats | null>(null);

  // erros
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // detalhe modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AuditLog | null>(null);

  // export
  const [exporting, setExporting] = useState(false);

  const normalizedFilters = useMemo(() => {
    // remove strings vazias pra não poluir query
    const out: AuditFilters = {};
    (Object.keys(filters) as (keyof AuditFilters)[]).forEach((k) => {
      const v = filters[k];
      if (typeof v === 'string' && v.trim() !== '') (out as any)[k] = v.trim();
    });
    return out;
  }, [filters]);

  const loadLogs = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // seguindo seu contrato: PaginationParams & AuditFilters
      // (não sei seu shape de PaginationParams; então envio page/pageSize também, comum em APIs)
      const result = await auditService.getAuditLogs({
        page,
        pageSize,
        ...normalizedFilters,
      } as any);

      // PaginatedResult pode ser {items,total,...} ou {data,total,...}.
      // Tentamos cobrir ambos sem inventar estrutura:
      const items = (result as any)?.items ?? (result as any)?.data ?? [];
      const totalCount = (result as any)?.total ?? (result as any)?.totalCount ?? items.length;

      setRows(items);
      setTotal(Number(totalCount) || 0);
    } catch (error) {
      console.error('Error loading audit logs:', handleApiError(error));
      setErrorMsg((error as any)?.message || 'Falha ao carregar logs de auditoria');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const s = await auditService.getAuditStats(normalizedFilters);
      setStats(s);
    } catch (error) {
      console.error('Error loading audit stats:', handleApiError(error));
      // stats é opcional pra UI: não bloqueia
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const reloadAll = async () => {
    await Promise.all([loadLogs(), loadStats()]);
  };

  useEffect(() => {
    reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, normalizedFilters.action, normalizedFilters.entityType, normalizedFilters.entityId, normalizedFilters.userId, normalizedFilters.startDate, normalizedFilters.endDate, normalizedFilters.search]);

  const openDetail = async (row: AuditLog) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);

    try {
      const full = await auditService.getAuditLogById(row.id);
      setDetail(full);
    } catch (e: any) {
      setDetailError(e?.message || 'Falha ao carregar detalhe do log');
    } finally {
      setDetailLoading(false);
    }
  };

  const doExport = async () => {
    setExporting(true);
    setErrorMsg(null);
    try {
      const blob = await auditService.exportAuditLogs(normalizedFilters);
      const name = `audit_export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
      downloadBlob(blob, name);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Falha ao exportar logs');
    } finally {
      setExporting(false);
    }
  };

  const columns = useMemo(() => {
    return [
      {
        key: 'timestamp',
        label: 'Quando',
        sortable: true,
        render: (r: AuditLog) => formatDate(r.timestamp),
      },
      {
        key: 'action',
        label: 'Ação',
        sortable: true,
        render: (r: AuditLog) => <Pill>{r.action}</Pill>,
      },
      {
        key: 'entityType',
        label: 'Entidade',
        sortable: true,
        render: (r: AuditLog) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontWeight: 700 }}>{r.entityType}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {r.entityName ? `${r.entityName} • ` : ''}
              {r.entityId}
            </div>
          </div>
        ),
      },
      {
        key: 'userName',
        label: 'Usuário',
        sortable: true,
        render: (r: AuditLog) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontWeight: 700 }}>{r.userName}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{r.userEmail}</div>
          </div>
        ),
      },
      {
        key: '_meta',
        label: 'Origem',
        render: (r: AuditLog) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{r.ipAddress || '-'}</div>
            <div style={{ fontSize: 12, opacity: 0.7, maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.userAgent || '-'}
            </div>
          </div>
        ),
      },
      {
        key: '_actions',
        label: 'Ações',
        render: (r: AuditLog) => (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => openDetail(r)}>Detalhes</button>
          </div>
        ),
      },
    ];
  }, []);

  const topActions = useMemo(() => {
    const map = stats?.actionsByType || {};
    const arr = Object.entries(map).map(([k, v]) => ({ k, v }));
    arr.sort((a, b) => b.v - a.v);
    return arr.slice(0, 8);
  }, [stats]);

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ margin: 0 }}>
              Auditoria
            </h1>
            <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
              Logs de ações do sistema (criação/alteração/exclusão/login/etc). Filtros e export usam os mesmos parâmetros do backend.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button variant="secondary" onClick={reloadAll}>
              Recarregar
            </Button>
            <Button variant="primary" onClick={doExport} disabled={exporting}>
              {exporting ? 'Exportando…' : 'Exportar'}
            </Button>
          </div>
        </div>

        {errorMsg ? (
          <div style={{ margin: '10px 0', padding: 10, borderRadius: 10, border: '1px solid #f2b8b5' }}>
            <b>Erro:</b> {errorMsg}
          </div>
        ) : null}

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Card>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Total logs</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>
              {statsLoading ? '…' : String(stats?.totalLogs ?? 0)}
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Top ações</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {statsLoading ? (
                <span style={{ opacity: 0.7 }}>…</span>
              ) : topActions.length ? (
                topActions.map((a) => (
                  <Pill key={a.k}>
                    {a.k}: <b>{a.v}</b>
                  </Pill>
                ))
              ) : (
                <span style={{ opacity: 0.7 }}>-</span>
              )}
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Top usuários</div>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {statsLoading ? (
                <span style={{ opacity: 0.7 }}>…</span>
              ) : stats?.topUsers?.length ? (
                stats.topUsers.slice(0, 5).map((u) => (
                  <div key={u.userId} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontWeight: 700 }}>{u.userName}</span>
                    <span style={{ opacity: 0.8 }}>{u.count}</span>
                  </div>
                ))
              ) : (
                <span style={{ opacity: 0.7 }}>-</span>
              )}
            </div>
          </Card>
        </div>

        {/* FILTERS */}
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Action</div>
              <input
                value={filters.action || ''}
                onChange={(e) => {
                  setPage(1);
                  setFilters((f) => ({ ...f, action: e.target.value }));
                }}
                placeholder="Ex: create, update, delete, login…"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Entity Type</div>
              <input
                value={filters.entityType || ''}
                onChange={(e) => {
                  setPage(1);
                  setFilters((f) => ({ ...f, entityType: e.target.value }));
                }}
                placeholder="Ex: contact, deal, user…"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Entity ID</div>
              <input
                value={filters.entityId || ''}
                onChange={(e) => {
                  setPage(1);
                  setFilters((f) => ({ ...f, entityId: e.target.value }));
                }}
                placeholder="ID da entidade"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>User ID</div>
              <input
                value={filters.userId || ''}
                onChange={(e) => {
                  setPage(1);
                  setFilters((f) => ({ ...f, userId: e.target.value }));
                }}
                placeholder="ID do usuário"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Start Date</div>
              <input
                type="datetime-local"
                value={filters.startDate || ''}
                onChange={(e) => {
                  setPage(1);
                  setFilters((f) => ({ ...f, startDate: e.target.value }));
                }}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>End Date</div>
              <input
                type="datetime-local"
                value={filters.endDate || ''}
                onChange={(e) => {
                  setPage(1);
                  setFilters((f) => ({ ...f, endDate: e.target.value }));
                }}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Search</div>
              <input
                value={filters.search || ''}
                onChange={(e) => {
                  setPage(1);
                  setFilters((f) => ({ ...f, search: e.target.value }));
                }}
                placeholder="Busca textual no conteúdo/metadados (se o backend suportar)"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Page</span>
                <input
                  type="number"
                  value={page}
                  min={1}
                  onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
                  style={{ width: 80 }}
                />

                <span style={{ fontSize: 12, opacity: 0.7 }}>Page Size</span>
                <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}>
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  Total: <b>{total}</b>
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    setPage(1);
                    setFilters({
                      action: '',
                      entityType: '',
                      entityId: '',
                      userId: '',
                      startDate: '',
                      endDate: '',
                      search: '',
                    });
                  }}
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* TABLE */}
        <Card noPadding>
          <DataTable
            columns={columns}
            data={rows}
            keyExtractor={(record: AuditLog) => record.id}
            isLoading={isLoading}
          />
        </Card>
      </div>

      {/* DETAIL MODAL */}
      <Modal
        open={detailOpen}
        title={detail ? `Log ${detail.id}` : 'Detalhes do Log'}
        onClose={() => setDetailOpen(false)}
        width={980}
      >
        {detailLoading ? <div style={{ opacity: 0.7 }}>Carregando…</div> : null}
        {detailError ? (
          <div style={{ padding: 10, borderRadius: 10, border: '1px solid #f2b8b5' }}>
            <b>Erro:</b> {detailError}
          </div>
        ) : null}

        {!detailLoading && !detailError && detail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Pill>{detail.action}</Pill>
              <Pill>{detail.entityType}</Pill>
              <Pill>{formatDate(detail.timestamp)}</Pill>
              {detail.ipAddress ? <Pill>{detail.ipAddress}</Pill> : null}
            </div>

            <Card>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Contexto</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Usuário</div>
                  <div style={{ fontWeight: 700 }}>{detail.userName}</div>
                  <div style={{ opacity: 0.75 }}>{detail.userEmail}</div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>userId: {detail.userId}</div>
                </div>

                <div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Entidade</div>
                  <div style={{ fontWeight: 700 }}>
                    {detail.entityType} — {detail.entityName || '(sem nome)'}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>entityId: {detail.entityId}</div>
                </div>
              </div>

              {detail.userAgent ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>User-Agent</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, opacity: 0.85 }}>{detail.userAgent}</div>
                </div>
              ) : null}
            </Card>

            <Card>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Changes</div>
              {detail.changes ? (
                <pre style={{ margin: 0, background: '#fafafa', padding: 10, borderRadius: 10, overflow: 'auto' }}>
                  {JSON.stringify(detail.changes, null, 2)}
                </pre>
              ) : (
                <div style={{ opacity: 0.7 }}>Sem changes estruturado.</div>
              )}
            </Card>

            <Card>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Metadata</div>
              {detail.metadata ? (
                <pre style={{ margin: 0, background: '#fafafa', padding: 10, borderRadius: 10, overflow: 'auto' }}>
                  {JSON.stringify(detail.metadata, null, 2)}
                </pre>
              ) : (
                <div style={{ opacity: 0.7 }}>Sem metadata.</div>
              )}
            </Card>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setDetailOpen(false)}>Fechar</button>
            </div>
          </div>
        ) : null}
      </Modal>
    </AppLayout>
  );
};

export default AuditListPage;
