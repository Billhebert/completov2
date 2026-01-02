// src/modules/crm/pages/DealsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { AppLayout, Card, Button } from "../../shared";
import Select from "../../shared/components/UI/Select";

import * as pipelineService from "../services/pipeline.service";
import * as dealService from "../services/deal.service";

import type { CrmPipeline, CrmStage } from "../services/pipeline.service";
import { PipelineManagerModal } from "../components/PipelineManagerModal";
import { DealModal } from "../components/DealModal";

type Deal = any; // seu deal.service já tipa via ../types, aqui deixo simples para não quebrar build

export default function DealsPage() {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [pipelineId, setPipelineId] = useState<string>("");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [manageOpen, setManageOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const pipeline = useMemo(
    () => pipelines.find((p) => p.id === pipelineId) ?? null,
    [pipelines, pipelineId]
  );

  const stages = useMemo(() => {
    const list = pipeline?.stages ? [...pipeline.stages] : [];
    list.sort((a, b) => a.order - b.order);
    return list;
  }, [pipeline]);

  const defaultStageId = stages[0]?.id ?? "";

  async function loadPipelines() {
    const list = await pipelineService.listPipelines();
    setPipelines(list);

    const def = list.find((p) => p.isDefault) ?? list[0];
    setPipelineId((prev) => {
      if (prev && list.some((p) => p.id === prev)) return prev;
      return def?.id ?? "";
    });
  }

  async function loadDeals(selectedPipelineId: string) {
    const res = await dealService.getDeals({ pipelineId: selectedPipelineId, page: 1, limit: 200 } as any);
    setDeals(Array.isArray(res?.data) ? res.data : []);
  }

  async function reloadAll() {
    setLoading(true);
    setError("");
    try {
      await loadPipelines();
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar funis");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pipelineId) return;
    setLoading(true);
    setError("");
    loadDeals(pipelineId)
      .catch((e: any) => setError(e?.message ?? "Erro ao carregar negociações"))
      .finally(() => setLoading(false));
  }, [pipelineId]);

  const grouped = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    stages.forEach((s) => (map[s.id] = []));
    deals.forEach((d: any) => {
      const sid = d?.stageId;
      if (sid && map[sid]) map[sid].push(d);
    });
    return map;
  }, [deals, stages]);

  // Drag HTML5 simples
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  function onCardDragStart(dealId: string) {
    setDraggingDealId(dealId);
  }
  function onCardDragEnd() {
    setDraggingDealId(null);
  }

  async function moveDeal(dealId: string, targetStageId: string) {
    // ✅ service atualizado abaixo detecta uuid e envia stageId
    await dealService.updateDealStage(dealId, targetStageId);
    await loadDeals(pipelineId);
  }

  async function onDropStage(stageId: string) {
    if (!draggingDealId) return;
    await moveDeal(draggingDealId, stageId);
    setDraggingDealId(null);
  }

  return (
    <AppLayout>
      <div className="page-container">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Link to="/crm" className="text-gray-600 hover:text-gray-900">
            CRM
          </Link>
          <span className="text-gray-400">/</span>
          <Link to="/crm/deals" className="text-gray-900 font-medium hover:underline">
            Negociações
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Pipeline de Vendas</h1>
            <p className="text-gray-600 mt-1">
              Escolha um funil e arraste as oportunidades entre os estágios.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Funil:</span>
                <Select value={pipelineId} onChange={(e) => setPipelineId(e.target.value)}>
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.isDefault ? " (padrão)" : ""}
                    </option>
                  ))}
                </Select>
              </div>

              <Button variant="secondary" onClick={() => setManageOpen(true)}>
                Gerenciar funis
              </Button>
            </div>
          </div>

          <Button onClick={() => setCreateOpen(true)} disabled={!pipelineId || !defaultStageId}>
            + Nova Oportunidade
          </Button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <Card className="p-8 text-center">Carregando...</Card>
        ) : !pipeline ? (
          <Card className="p-8 text-center">
            <p className="mb-3">Nenhum funil encontrado.</p>
            <Button onClick={() => setManageOpen(true)}>Criar funil</Button>
          </Card>
        ) : stages.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="mb-3">Este funil ainda não tem estágios.</p>
            <Button onClick={() => setManageOpen(true)}>Adicionar estágios</Button>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-[980px] pb-4">
              {stages.map((stage: CrmStage) => (
                <div
                  key={stage.id}
                  className="w-[320px] shrink-0"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDropStage(stage.id)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="font-semibold">{stage.name}</div>
                    <span className="text-xs text-gray-500">
                      {(grouped[stage.id]?.length ?? 0)} itens
                    </span>
                  </div>

                  <div className="rounded-xl border bg-gray-50 p-3 min-h-[420px] space-y-3">
                    {(grouped[stage.id] ?? []).map((d: any) => (
                      <div
                        key={d.id}
                        draggable
                        onDragStart={() => onCardDragStart(d.id)}
                        onDragEnd={onCardDragEnd}
                        className={[
                          "rounded-lg border bg-white p-3 shadow-sm hover:shadow-md transition cursor-grab",
                          draggingDealId === d.id ? "opacity-70" : "",
                        ].join(" ")}
                      >
                        <div className="font-medium text-gray-900">{d.title}</div>
                        <div className="mt-1 text-sm text-gray-600">
                          {d.currency ?? "BRL"}{" "}
                          {typeof d.value === "number" ? d.value.toFixed(2) : d.value}
                        </div>

                        <div className="mt-3 flex gap-2">
                          <Button variant="secondary" onClick={() => alert("Conecte sua edição aqui")}>
                            Editar
                          </Button>
                          <Button variant="danger" onClick={() => alert("Conecte sua exclusão aqui")}>
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}

                    {(grouped[stage.id] ?? []).length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-10">
                        Solte uma oportunidade aqui
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <PipelineManagerModal
          isOpen={manageOpen}
          onClose={() => setManageOpen(false)}
          onChanged={async () => {
            await loadPipelines();
            if (pipelineId) await loadDeals(pipelineId);
          }}
        />

        <DealModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            if (pipelineId) await loadDeals(pipelineId);
          }}
          pipelineId={pipelineId}
          stageId={defaultStageId}
        />
      </div>
    </AppLayout>
  );
}
