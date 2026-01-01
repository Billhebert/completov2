/**
 * API Keys List Page (completo)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AppLayout, Card, Button, DataTable } from '././shared';
import * as apikeysService from './services/apikeys.service';
import type { ApiKey, ApiKeyUsage, CreateApiKeyPayload, CreateApiKeyResponse } from './types';
import { handleApiError } from './././core/utils/api';

function formatDate(iso?: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('pt-BR');
}

function copy(text: string) {
  if (!text) return;
  navigator.clipboard?.writeText(text).catch(() => {});
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
      }}
    >
      {children}
    </span>
  );
}

function Modal({
  open,
  title,
  onClose,
  children,
  width = 720,
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
          maxWidth: '95vw',
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

export const ApikeysListPage: React.FC = () => {
  const [data, setData] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createPayload, setCreatePayload] = useState<CreateApiKeyPayload>({
    name: '',
    scopes: [],
    expiresAt: undefined,
  });

  // Secret modal state (exibido uma vez)
  const [created, setCreated] = useState<CreateApiKeyResponse | null>(null);

  // Usage modal state
  const [usageOpen, setUsageOpen] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [usageKey, setUsageKey] = useState<ApiKey | null>(null);
  const [usageData, setUsageData] = useState<ApiKeyUsage[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await apikeysService.getApiKeys();
      setData(result);
    } catch (error) {
      console.error('Error loading data:', handleApiError(error));
      setErrorMsg((error as any)?.message || 'Falha ao carregar API Keys');
    } finally {
      setIsLoading(false);
    }
  };

  const openUsage = async (key: ApiKey) => {
    setUsageOpen(true);
    setUsageKey(key);
    setUsageLoading(true);
    setUsageError(null);
    setUsageData([]);
    try {
      const rows = await apikeysService.getKeyUsage(key.id);
      setUsageData(rows || []);
    } catch (e: any) {
      setUsageError(e?.message || 'Falha ao carregar usage');
    } finally {
      setUsageLoading(false);
    }
  };

  const revoke = async (key: ApiKey) => {
    const ok = window.confirm(`Revogar a chave "${key.name}"?\n\nEssa ação normalmente invalida a chave para sempre.`);
    if (!ok) return;

    try {
      await apikeysService.revokeApiKey(key.id);
      await loadData();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Falha ao revogar chave');
    }
  };

  const columns = useMemo(() => {
    return [
      { key: 'name', label: 'Nome', sortable: true },
      {
        key: 'isActive',
        label: 'Status',
        render: (row: ApiKey) => (row.isActive ? <Pill>Ativa</Pill> : <Pill>Revogada/Inativa</Pill>),
      },
      {
        key: 'scopes',
        label: 'Scopes',
        render: (row: ApiKey) =>
          row.scopes?.length ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {row.scopes.slice(0, 6).map((s) => (
                <Pill key={s}>{s}</Pill>
              ))}
              {row.scopes.length > 6 ? <Pill>+{row.scopes.length - 6}</Pill> : null}
            </div>
          ) : (
            '-'
          ),
      },
      {
        key: 'expiresAt',
        label: 'Expira em',
        render: (row: ApiKey) => formatDate(row.expiresAt),
      },
      {
        key: 'lastUsedAt',
        label: 'Último uso',
        render: (row: ApiKey) => formatDate(row.lastUsedAt),
      },
      {
        key: 'createdAt',
        label: 'Criado em',
        render: (row: ApiKey) => formatDate(row.createdAt),
      },
      {
        key: '_actions',
        label: 'Ações',
        render: (row: ApiKey) => (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => openUsage(row)}>Usage</button>
            <button onClick={() => revoke(row)} disabled={!row.isActive}>
              Revogar
            </button>
          </div>
        ),
      },
    ];
  }, []);

  const addScope = (scope: string) => {
    const s = scope.trim();
    if (!s) return;
    setCreatePayload((p) => ({
      ...p,
      scopes: Array.from(new Set([...(p.scopes || []), s])),
    }));
  };

  const removeScope = (scope: string) => {
    setCreatePayload((p) => ({
      ...p,
      scopes: (p.scopes || []).filter((x) => x !== scope),
    }));
  };

  const create = async () => {
    setErrorMsg(null);

    // validação do front alinhada ao validation.ts (min 1 scope)
    if (!createPayload.name.trim()) {
      setErrorMsg('Informe um nome para a API Key.');
      return;
    }
    if (!createPayload.scopes?.length) {
      setErrorMsg('Informe pelo menos 1 scope.');
      return;
    }

    try {
      const result = await apikeysService.createApiKey({
        name: createPayload.name.trim(),
        scopes: createPayload.scopes,
        expiresAt: createPayload.expiresAt || undefined,
      });

      setCreateOpen(false);
      setCreatePayload({ name: '', scopes: [], expiresAt: undefined });
      setCreated(result);

      await loadData();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Falha ao criar API Key');
    }
  };

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ margin: 0 }}>
              API Keys
            </h1>
            <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
              Gerencie chaves para integração. Revogar invalida a chave; o secret é exibido somente na criação.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button variant="secondary" onClick={loadData}>
              Recarregar
            </Button>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              Criar Novo
            </Button>
          </div>
        </div>

        {errorMsg ? (
          <div style={{ margin: '10px 0', padding: 10, borderRadius: 10, border: '1px solid #f2b8b5' }}>
            <b>Erro:</b> {errorMsg}
          </div>
        ) : null}

        <Card noPadding>
          <DataTable
            columns={columns}
            data={data}
            keyExtractor={(record: ApiKey) => record.id}
            isLoading={isLoading}
          />
        </Card>
      </div>

      {/* CREATE MODAL */}
      <Modal open={createOpen} title="Criar API Key" onClose={() => setCreateOpen(false)} width={760}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Nome</div>
            <input
              value={createPayload.name}
              onChange={(e) => setCreatePayload((p) => ({ ...p, name: e.target.value }))}
              style={{ width: '100%' }}
              placeholder="Ex: Integração ERP / Zapier / Bot Suporte"
            />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Expira em (opcional)</div>
            <input
              type="datetime-local"
              value={createPayload.expiresAt ? createPayload.expiresAt.replace('Z', '') : ''}
              onChange={(e) => setCreatePayload((p) => ({ ...p, expiresAt: e.target.value || undefined }))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
              Obs: precisa bater com o backend (datetime). Se seu backend espera ISO completo, ajuste aqui.
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Scopes</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="scope-input"
                placeholder="Ex: analytics.read"
                style={{ width: '100%' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const el = e.currentTarget as HTMLInputElement;
                    addScope(el.value);
                    el.value = '';
                  }
                }}
              />
              <button
                onClick={() => {
                  const el = document.getElementById('scope-input') as HTMLInputElement | null;
                  if (!el) return;
                  addScope(el.value);
                  el.value = '';
                }}
              >
                Add
              </button>
            </div>

            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {createPayload.scopes?.length ? (
                createPayload.scopes.map((s) => (
                  <span
                    key={s}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '1px solid #e6e6e6',
                      fontSize: 12,
                    }}
                  >
                    {s}
                    <button onClick={() => removeScope(s)} style={{ fontSize: 12 }}>
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span style={{ opacity: 0.7, fontSize: 12 }}>Adicione pelo menos 1 scope.</span>
              )}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Atenção: o <b>secret</b> será exibido <b>somente uma vez</b> após criar.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setCreateOpen(false)}>Cancelar</button>
              <button onClick={create}>Criar</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* SECRET MODAL (ONE-TIME) */}
      <Modal
        open={!!created}
        title="API Key criada — copie o secret agora"
        onClose={() => setCreated(null)}
        width={760}
      >
        {created ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 10, borderRadius: 10, border: '1px solid #e6e6e6', background: '#fafafa' }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Nome</div>
              <div style={{ fontWeight: 800 }}>{created.apiKey.name}</div>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                Este secret não será mostrado novamente. Guarde em local seguro.
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Secret</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={created.key} readOnly style={{ width: '100%', fontFamily: 'monospace' }} />
                <button onClick={() => copy(created.key)}>Copiar</button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setCreated(null)}>Fechar</button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* USAGE MODAL */}
      <Modal
        open={usageOpen}
        title={`Usage ${usageKey ? `— ${usageKey.name}` : ''}`}
        onClose={() => setUsageOpen(false)}
        width={860}
      >
        {usageLoading ? <div style={{ opacity: 0.7 }}>Carregando…</div> : null}
        {usageError ? (
          <div style={{ padding: 10, borderRadius: 10, border: '1px solid #f2b8b5' }}>
            <b>Erro:</b> {usageError}
          </div>
        ) : null}

        {!usageLoading && !usageError ? (
          usageData.length ? (
            <div style={{ overflow: 'auto', marginTop: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '8px 6px' }}>Quando</th>
                    <th style={{ padding: '8px 6px' }}>Método</th>
                    <th style={{ padding: '8px 6px' }}>Endpoint</th>
                    <th style={{ padding: '8px 6px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usageData.slice(0, 200).map((u, i) => (
                    <tr key={`${u.keyId}-${u.timestamp}-${i}`} style={{ borderBottom: '1px solid #f3f3f3' }}>
                      <td style={{ padding: '8px 6px' }}>{formatDate(u.timestamp)}</td>
                      <td style={{ padding: '8px 6px', fontFamily: 'monospace' }}>{u.method}</td>
                      <td style={{ padding: '8px 6px', fontFamily: 'monospace' }}>{u.endpoint}</td>
                      <td style={{ padding: '8px 6px' }}>{u.statusCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {usageData.length > 200 ? (
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                  Mostrando 200 linhas (limite de UI).
                </div>
              ) : null}
            </div>
          ) : (
            <div style={{ marginTop: 10, opacity: 0.7 }}>Sem registros de uso.</div>
          )
        ) : null}
      </Modal>
    </AppLayout>
  );
};

export default ApikeysListPage;
