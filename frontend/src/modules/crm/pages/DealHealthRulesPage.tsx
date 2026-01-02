// src/modules/crm/pages/DealHealthRulesPage.tsx
import { useEffect, useMemo, useState } from "react";
import * as pipelineService from "../services/pipeline.service";
import * as rulesService from "../services/deal-health-rules.service";

type Pipeline = { id: string; name: string; isDefault?: boolean };

const TYPE_LABEL: Record<rulesService.DealHealthType, string> = {
  NO_ACTIVITY: "Sem interação",
  OVERDUE: "Atraso (expected close)",
};

export default function DealHealthRulesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [pipelineId, setPipelineId] = useState<string>(""); // "" => global
  const [rules, setRules] = useState<rulesService.DealHealthRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentScopeLabel = useMemo(() => {
    if (!pipelineId) return "Global (vale para todos os funis)";
    const p = pipelines.find((x) => x.id === pipelineId);
    return `Funil: ${p?.name ?? pipelineId}`;
  }, [pipelineId, pipelines]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const p = await pipelineService.listPipelines();
      const list = Array.isArray((p as any)?.data) ? (p as any).data : (Array.isArray(p) ? p : []);
      setPipelines(list);

      const r = await rulesService.listRules(pipelineId || undefined);
      setRules(r);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineId]);

  async function handleCreate() {
    const name = prompt("Nome do status (ex: Esfriando, Crítica):");
    if (!name) return;

    const type = (prompt("Tipo: NO_ACTIVITY (sem interação) ou OVERDUE (atraso)?", "NO_ACTIVITY") as any) as rulesService.DealHealthType;
    if (type !== "NO_ACTIVITY" && type !== "OVERDUE") {
      alert("Tipo inválido");
      return;
    }

    const days = Number(prompt("Dias (inteiro):", "8"));
    if (!Number.isFinite(days) || days < 0) {
      alert("Dias inválido");
      return;
    }

    const color = prompt("Cor (hex ou token):", "#f59e0b") || "#f59e0b";
    const priority = Number(prompt("Prioridade (maior vence):", "1"));
    const isActive = (prompt("Ativo? (s/n)", "s") || "s").toLowerCase().startsWith("s");

    await rulesService.createRule({
      pipelineId: pipelineId ? pipelineId : null,
      type,
      name,
      days,
      color,
      priority: Number.isFinite(priority) ? priority : 0,
      isActive,
    });

    await loadAll();
  }

  async function handleEdit(rule: rulesService.DealHealthRule) {
    const name = prompt("Nome:", rule.name) ?? rule.name;
    const days = Number(prompt("Dias:", String(rule.days)) ?? rule.days);
    const color = prompt("Cor:", rule.color) ?? rule.color;
    const priority = Number(prompt("Prioridade:", String(rule.priority)) ?? rule.priority);
    const isActive = (prompt("Ativo? (s/n):", rule.isActive ? "s" : "n") || (rule.isActive ? "s" : "n"))
      .toLowerCase()
      .startsWith("s");

    await rulesService.updateRule(rule.id, {
      name,
      days: Number.isFinite(days) ? days : rule.days,
      color,
      priority: Number.isFinite(priority) ? priority : rule.priority,
      isActive,
    });

    await loadAll();
  }

  async function handleDelete(rule: rulesService.DealHealthRule) {
    if (!confirm(`Excluir "${rule.name}"?`)) return;
    await rulesService.deleteRule(rule.id);
    await loadAll();
  }

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Saúde das Negociações</h1>
          <div style={{ opacity: 0.8, marginTop: 4 }}>
            Configure status por dias sem interação e/ou dias de atraso.
          </div>
          <div style={{ marginTop: 8, fontSize: 14, opacity: 0.9 }}>
            Escopo atual: <b>{currentScopeLabel}</b>
          </div>
        </div>

        <button
          onClick={handleCreate}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          + Nova Regra
        </button>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <label style={{ fontWeight: 600 }}>Aplicar regras para:</label>
        <select
          value={pipelineId}
          onChange={(e) => setPipelineId(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", minWidth: 320 }}
        >
          <option value="">Global (todos os funis)</option>
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.isDefault ? "(padrão)" : ""}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#fee2e2", border: "1px solid #fecaca" }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ padding: 16, opacity: 0.7 }}>Carregando…</div>
        ) : (
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 14,
              overflow: "hidden",
              background: "white",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr 120px 120px 120px 110px",
                padding: 12,
                fontWeight: 700,
                borderBottom: "1px solid #eee",
                background: "#fafafa",
              }}
            >
              <div>Tipo</div>
              <div>Status</div>
              <div>Dias</div>
              <div>Prioridade</div>
              <div>Ativo</div>
              <div>Ações</div>
            </div>

            {rules.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr 120px 120px 120px 110px",
                  padding: 12,
                  borderBottom: "1px solid #f2f2f2",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 13, opacity: 0.9 }}>{TYPE_LABEL[r.type]}</div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: r.color,
                      display: "inline-block",
                      border: "1px solid rgba(0,0,0,0.15)",
                    }}
                  />
                  <div style={{ fontWeight: 700 }}>{r.name}</div>
                </div>

                <div>{r.days}</div>
                <div>{r.priority}</div>
                <div>{r.isActive ? "Sim" : "Não"}</div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleEdit(r)}
                    style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd", background: "white", cursor: "pointer" }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
                    style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ef4444", background: "#fee2e2", cursor: "pointer" }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}

            {!rules.length && (
              <div style={{ padding: 16, opacity: 0.7 }}>
                Nenhuma regra encontrada (o backend deve criar defaults automaticamente).
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, opacity: 0.75, fontSize: 13 }}>
        Dica: regras por funil <b>sobrescrevem</b> as globais. Prioridade maior vence.
      </div>
    </div>
  );
}
