// src/modules/crm/components/DealModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Button, Input, Card } from "../../shared";
import Select from "../../shared/components/UI/Select";

import * as dealService from "../services/deal.service";
import * as contactService from "../services/contact.service";
import * as companyService from "../services/company.service";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;

  // contexto vindo da página
  pipelineId: string;
  stageId: string; // estágio inicial sugerido (primeiro estágio do funil selecionado)
};

type ContactLite = { id: string; name: string; email?: string | null };
type CompanyLite = { id: string; name: string };

export function DealModal({ isOpen, onClose, onCreated, pipelineId, stageId }: Props) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState<string>("0");
  const [currency, setCurrency] = useState("BRL");

  // contato
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState<ContactLite[]>([]);
  const [contactId, setContactId] = useState<string>("");

  // empresa (opcional)
  const [companySearch, setCompanySearch] = useState("");
  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [companyId, setCompanyId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSave = useMemo(() => {
    return !!title.trim() && !!contactId && Number(value) >= 0 && !!pipelineId && !!stageId;
  }, [title, contactId, value, pipelineId, stageId]);

  // reset ao abrir
  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setValue("0");
    setCurrency("BRL");
    setContactSearch("");
    setContacts([]);
    setContactId("");
    setCompanySearch("");
    setCompanies([]);
    setCompanyId("");
    setError("");
  }, [isOpen]);

  // buscar contatos (debounce simples)
  useEffect(() => {
    if (!isOpen) return;

    const t = setTimeout(async () => {
      try {
        const res = await contactService.getContacts({
          page: 1,
          limit: 20,
          search: contactSearch || undefined,
        } as any);

        const list = Array.isArray((res as any)?.data) ? (res as any).data : [];
        setContacts(
          list.map((c: any) => ({
            id: String(c.id),
            name: String(c.name ?? ""),
            email: c.email ?? null,
          }))
        );
      } catch {
        setContacts([]);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [isOpen, contactSearch]);

  // buscar empresas (debounce simples)
  useEffect(() => {
    if (!isOpen) return;

    const t = setTimeout(async () => {
      try {
        const res = await companyService.getCompanies({
          page: 1,
          limit: 20,
          search: companySearch || undefined,
        } as any);

        const list = Array.isArray((res as any)?.data) ? (res as any).data : [];
        setCompanies(
          list.map((c: any) => ({
            id: String(c.id),
            name: String(c.name ?? ""),
          }))
        );
      } catch {
        setCompanies([]);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [isOpen, companySearch]);

  async function handleSave() {
    setError("");

    if (!pipelineId) return setError("Selecione um funil antes de criar.");
    if (!stageId) return setError("Selecione um estágio inicial.");
    if (!title.trim()) return setError("Título é obrigatório.");
    if (!contactId) return setError("Contato é obrigatório.");
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return setError("Valor inválido.");

    setLoading(true);
    try {
      await dealService.createDeal({
        title: title.trim(),
        value: n,
        currency,
        contactId,
        companyId: companyId || undefined,

        // ✅ novos campos (seu service atualizado abaixo vai incluir no payload)
        pipelineId,
        stageId,
      });

      await onCreated();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Erro ao criar oportunidade.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-x-0 top-10 mx-auto w-[min(900px,92vw)] bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Nova oportunidade</h3>
            <p className="text-sm text-gray-600">
              Crie uma oportunidade vinculada a um contato e organize no funil.
            </p>
          </div>

          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-4 lg:col-span-2">
              <div className="font-semibold mb-3">Detalhes</div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Título</div>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Proposta para ACME"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Valor</div>
                    <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Moeda</div>
                    <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option value="BRL">BRL</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </Select>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Dica: depois você pode arrastar a oportunidade entre os estágios.
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="font-semibold mb-3">Vínculos</div>

              <div className="space-y-4">
                {/* contato */}
                <div>
                  <div className="text-sm text-gray-600 mb-1">Contato (obrigatório)</div>
                  <Input
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Buscar contato..."
                  />

                  <div className="mt-2">
                    <Select value={contactId} onChange={(e) => setContactId(e.target.value)}>
                      <option value="" disabled>
                        Selecione um contato...
                      </option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.email ? ` — ${c.email}` : ""}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    Se não encontrar, crie em <b>CRM &gt; Contatos</b>.
                  </div>
                </div>

                {/* empresa opcional */}
                <div>
                  <div className="text-sm text-gray-600 mb-1">Empresa (opcional)</div>
                  <Input
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    placeholder="Buscar empresa..."
                  />

                  <div className="mt-2">
                    <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                      <option value="">Nenhuma</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* contexto do funil */}
                <div className="text-xs text-gray-500 border-t pt-3">
                  <div><b>Pipeline:</b> {pipelineId}</div>
                  <div><b>Stage:</b> {stageId}</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={loading || !canSave}>
              {loading ? "Salvando..." : "Criar oportunidade"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
