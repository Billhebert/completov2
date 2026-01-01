/**
 * IA Hub Page
 * Página principal do módulo IA: Chat (stream), Tools, Agent, Conversas, Usage, RAG
 */

import React, { useMemo, useState } from 'react';
import { AppLayout, Card, Button, Badge, DataTable, Input, Modal } from '../../shared';
import * as aiService from '../services/ai.service';
import { handleApiError } from '../../../core/utils/api';

type AiHubTab = 'chat' | 'tools' | 'agent' | 'conversations' | 'usage' | 'rag';

export const AiHubPage: React.FC = () => {
  const [tab, setTab] = useState<AiHubTab>('chat');

  // Chat
  const [chatInput, setChatInput] = useState('');
  const [chatOutput, setChatOutput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Tools
  const [toolText, setToolText] = useState('');
  const [toolResult, setToolResult] = useState<string>('');
  const [toolLoading, setToolLoading] = useState(false);

  // Agent
  const [agentId, setAgentId] = useState('');
  const [agentInputJson, setAgentInputJson] = useState('{\n  "message": "Olá"\n}');
  const [agentResult, setAgentResult] = useState<string>('');
  const [agentLoading, setAgentLoading] = useState(false);

  // Conversations
  const [conversations, setConversations] = useState<any[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  // Usage
  const [usage, setUsage] = useState<any>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  // RAG
  const [documents, setDocuments] = useState<any[]>([]);
  const [ragStats, setRagStats] = useState<any>(null);
  const [ragLoading, setRagLoading] = useState(false);

  // Upload modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const tabs = useMemo(
    () => [
      { key: 'chat' as const, label: 'Chat' },
      { key: 'tools' as const, label: 'Ferramentas' },
      { key: 'agent' as const, label: 'Agente' },
      { key: 'conversations' as const, label: 'Conversas' },
      { key: 'usage' as const, label: 'Uso' },
      { key: 'rag' as const, label: 'RAG' },
    ],
    []
  );

  const runChatStream = async () => {
    setChatOutput('');
    setChatLoading(true);
    try {
      await aiService.chatCompletionStream(
        { messages: [{ role: 'user', content: chatInput }] },
        (chunk) => setChatOutput((prev) => prev + chunk)
      );
    } catch (error) {
      console.error(handleApiError(error));
    } finally {
      setChatLoading(false);
    }
  };

  const runTool = async (tool: 'summarize' | 'sentiment' | 'extract') => {
    setToolResult('');
    setToolLoading(true);
    try {
      const payload = { text: toolText };
      const res =
        tool === 'summarize'
          ? await aiService.summarize(payload)
          : tool === 'sentiment'
          ? await aiService.sentiment(payload)
          : await aiService.extract(payload);

      setToolResult(JSON.stringify(res, null, 2));
    } catch (error) {
      console.error(handleApiError(error));
      setToolResult('Erro ao executar ferramenta (veja console).');
    } finally {
      setToolLoading(false);
    }
  };

  const runAgent = async () => {
    setAgentResult('');
    setAgentLoading(true);
    try {
      let inputObj: any = {};
      try {
        inputObj = JSON.parse(agentInputJson);
      } catch {
        inputObj = { raw: agentInputJson };
      }

      const res = await aiService.executeAgent({
        agentId: agentId || 'default',
        input: inputObj,
      });

      setAgentResult(JSON.stringify(res, null, 2));
    } catch (error) {
      console.error(handleApiError(error));
      setAgentResult('Erro ao executar agente (veja console).');
    } finally {
      setAgentLoading(false);
    }
  };

  const loadConversations = async () => {
    setConversationsLoading(true);
    try {
      const res = await aiService.getConversations();
      setConversations(Array.isArray(res) ? res : res?.data || []);
    } catch (error) {
      console.error(handleApiError(error));
    } finally {
      setConversationsLoading(false);
    }
  };

  const loadUsage = async () => {
    setUsageLoading(true);
    try {
      const res = await aiService.getUsageStats();
      setUsage(res);
    } catch (error) {
      console.error(handleApiError(error));
    } finally {
      setUsageLoading(false);
    }
  };

  const loadRag = async () => {
    setRagLoading(true);
    try {
      const docsRes = await aiService.getDocuments();
      setDocuments(Array.isArray(docsRes) ? docsRes : docsRes?.data || []);
      const statsRes = await aiService.getRagStats();
      setRagStats(statsRes);
    } catch (error) {
      console.error(handleApiError(error));
    } finally {
      setRagLoading(false);
    }
  };

  const uploadSingle = async () => {
    if (!uploadFile) return;
    setRagLoading(true);
    try {
      const form = new FormData();
      form.append('file', uploadFile);
      await aiService.uploadDocument(form);
      setIsUploadOpen(false);
      setUploadFile(null);
      await loadRag();
    } catch (error) {
      console.error(handleApiError(error));
    } finally {
      setRagLoading(false);
    }
  };

  const reprocessDocument = async (id: string) => {
    setRagLoading(true);
    try {
      await aiService.reprocessDocument(id);
      await loadRag();
    } catch (error) {
      console.error(handleApiError(error));
    } finally {
      setRagLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    setRagLoading(true);
    try {
      await aiService.deleteDocument(id);
      await loadRag();
    } catch (error) {
      console.error(handleApiError(error));
    } finally {
      setRagLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-container p-6">
        <Card
          title="Inteligência Artificial"
          subtitle="Chat, ferramentas, agentes, conversas, uso e RAG (base de conhecimento)."
          actions={
            <div className="flex gap-2">
              {tab === 'conversations' && (
                <Button variant="secondary" onClick={loadConversations} isLoading={conversationsLoading}>
                  Atualizar
                </Button>
              )}

              {tab === 'usage' && (
                <Button variant="secondary" onClick={loadUsage} isLoading={usageLoading}>
                  Atualizar
                </Button>
              )}

              {tab === 'rag' && (
                <>
                  <Button variant="secondary" onClick={loadRag} isLoading={ragLoading}>
                    Atualizar
                  </Button>
                  <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
                    Upload
                  </Button>
                </>
              )}
            </div>
          }
        >
          <div className="flex flex-wrap gap-2 mb-4">
            {tabs.map((t) => (
              <Button
                key={t.key}
                variant={tab === t.key ? 'primary' : 'secondary'}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          {tab === 'chat' && (
            <Card title="Chat (Streaming)" subtitle="Usa /ai/chat/completions com SSE" className="mt-4">
              <div className="mb-3">
                <label className="label">Mensagem</label>
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  rows={5}
                  className="input w-full"
                  placeholder="Digite sua pergunta..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={runChatStream}
                  isLoading={chatLoading}
                  disabled={!chatInput.trim()}
                >
                  Enviar
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setChatInput('');
                    setChatOutput('');
                  }}
                >
                  Limpar
                </Button>
              </div>

              <div className="mt-4">
                <label className="label">Resposta</label>
                <pre className="whitespace-pre-wrap bg-gray-100 rounded-lg p-3 text-sm text-gray-800 min-h-[140px]">
                  {chatOutput || '—'}
                </pre>
              </div>
            </Card>
          )}

          {tab === 'tools' && (
            <Card title="Ferramentas" subtitle="Resumir, Sentimento, Extrair" className="mt-4">
              <div className="mb-3">
                <label className="label">Texto</label>
                <textarea
                  value={toolText}
                  onChange={(e) => setToolText(e.target.value)}
                  rows={6}
                  className="input w-full"
                  placeholder="Cole aqui um texto para analisar..."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={() => runTool('summarize')}
                  isLoading={toolLoading}
                  disabled={!toolText.trim()}
                >
                  Resumir
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => runTool('sentiment')}
                  isLoading={toolLoading}
                  disabled={!toolText.trim()}
                >
                  Sentimento
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => runTool('extract')}
                  isLoading={toolLoading}
                  disabled={!toolText.trim()}
                >
                  Extrair
                </Button>
              </div>

              <div className="mt-4">
                <label className="label">Resultado</label>
                <pre className="whitespace-pre-wrap bg-gray-100 rounded-lg p-3 text-sm text-gray-800 min-h-[140px]">
                  {toolResult || '—'}
                </pre>
              </div>
            </Card>
          )}

          {tab === 'agent' && (
            <Card title="Agente" subtitle="Executa /ai/agent/execute" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Agent ID"
                    placeholder="default"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                  />

                  <div className="mt-4">
                    <label className="label">Input (JSON)</label>
                    <textarea
                      value={agentInputJson}
                      onChange={(e) => setAgentInputJson(e.target.value)}
                      rows={8}
                      className="input w-full font-mono text-sm"
                    />
                  </div>

                  <div className="mt-4">
                    <Button variant="primary" onClick={runAgent} isLoading={agentLoading}>
                      Executar
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="label">Resultado</label>
                  <pre className="whitespace-pre-wrap bg-gray-100 rounded-lg p-3 text-sm text-gray-800 min-h-[240px]">
                    {agentResult || '—'}
                  </pre>
                </div>
              </div>
            </Card>
          )}

          {tab === 'conversations' && (
            <Card title="Conversas" subtitle="Histórico" className="mt-4" noPadding>
              <DataTable
                columns={[
                  { key: 'id', label: 'ID' },
                  { key: 'title', label: 'Título' },
                  { key: 'createdAt', label: 'Criado em' },
                ]}
                data={conversations}
                keyExtractor={(r, i) => String(r.id ?? i)}
                isLoading={conversationsLoading}
                emptyMessage="Nenhuma conversa encontrada"
              />
            </Card>
          )}

          {tab === 'usage' && (
            <Card title="Uso / Stats" subtitle="Tokens / custo" className="mt-4">
              <pre className="whitespace-pre-wrap bg-gray-100 rounded-lg p-3 text-sm text-gray-800 min-h-[140px]">
                {usage ? JSON.stringify(usage, null, 2) : 'Clique em Atualizar'}
              </pre>
            </Card>
          )}

          {tab === 'rag' && (
            <Card title="RAG / Base de Conhecimento" subtitle="Upload, documentos e stats" className="mt-4">
              <div className="mb-4">
                <label className="label">Stats</label>
                <pre className="whitespace-pre-wrap bg-gray-100 rounded-lg p-3 text-sm text-gray-800 min-h-[120px]">
                  {ragStats ? JSON.stringify(ragStats, null, 2) : 'Clique em Atualizar'}
                </pre>
              </div>

              <Card title="Documentos" subtitle="Lista do /knowledge/rag/documents" noPadding>
                <DataTable
                  columns={[
                    { key: 'title', label: 'Título' },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (value) => {
                        const v = String(value || 'unknown').toLowerCase();
                        const variant =
                          v.includes('ready') || v.includes('completed')
                            ? 'success'
                            : v.includes('fail') || v.includes('error')
                            ? 'danger'
                            : v.includes('processing') || v.includes('running')
                            ? 'warning'
                            : 'gray';
                        return <Badge variant={variant as any}>{String(value || '—')}</Badge>;
                      },
                    },
                    { key: 'createdAt', label: 'Criado em' },
                  ]}
                  data={documents}
                  keyExtractor={(r, i) => String(r.id ?? i)}
                  isLoading={ragLoading}
                  emptyMessage="Nenhum documento encontrado"
                  actions={[
                    {
                      label: 'Reprocessar',
                      variant: 'secondary',
                      onClick: (record: any) => reprocessDocument(record.id),
                    },
                    {
                      label: 'Remover',
                      variant: 'danger',
                      onClick: (record: any) => deleteDocument(record.id),
                    },
                  ]}
                />
              </Card>
            </Card>
          )}
        </Card>
      </div>

      <Modal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setUploadFile(null);
        }}
        title="Upload de Documento (RAG)"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsUploadOpen(false);
                setUploadFile(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={uploadSingle} isLoading={ragLoading} disabled={!uploadFile}>
              Enviar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            Selecione um arquivo para enviar para <code>/knowledge/rag/upload</code>.
          </div>

          <input
            type="file"
            className="input w-full"
            onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
          />

          {uploadFile && (
            <div className="text-sm">
              Selecionado: <strong>{uploadFile.name}</strong>
            </div>
          )}
        </div>
      </Modal>
    </AppLayout>
  );
};

export default AiHubPage;
