// src/modules/crm/pages/CompaniesPage.tsx
import { useEffect, useState } from "react";
import { AppLayout, Card, Button, Breadcrumbs, Input } from "../../shared";
import { EmptyState, LoadingSkeleton } from "../../shared/components/UI";
import Select from "../../shared/components/UI/Select";
import { CompanyModal } from "../components";
import * as companyService from "../services/company.service";
import { Company, CompanySize, CompanyStatus } from "../types";
import { handleApiError } from "../../../core/utils/api";

const normalizeError = (err: unknown): string => {
  const parsed = handleApiError(err) as any;
  if (typeof parsed === "string") return parsed;
  if (parsed?.message) return String(parsed.message);
  if (err && typeof err === "object" && "message" in err)
    return String((err as any).message);
  return "Erro inesperado";
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | "">("");
  const [sizeFilter, setSizeFilter] = useState<CompanySize | "">("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const loadCompanies = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await companyService.getCompanies({
        page: 1,
        limit: 50,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        size: sizeFilter || undefined,
      });

      setCompanies(result.data ?? []);
    } catch (err) {
      setError(normalizeError(err));
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, sizeFilter]);

  const handleCreate = () => {
    setEditingCompany(null);
    setModalOpen(true);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setModalOpen(true);
  };

  const handleSave = async (payload: any) => {
    try {
      if (editingCompany) {
        await companyService.updateCompany(editingCompany.id, payload);
      } else {
        await companyService.createCompany(payload);
      }
      setModalOpen(false);
      await loadCompanies();
    } catch (err) {
      console.error('Error saving company:', err);
      setError(normalizeError(err));
      throw err; // Re-throw para que o formulário também saiba que falhou
    }
  };

  const handleDelete = async (company: Company) => {
    if (!confirm(`Excluir empresa "${company.name}"?`)) return;
    await companyService.deleteCompany(company.id);
    await loadCompanies();
  };

  return (
    <AppLayout>
      <div className="page-container">
        {/* ✅ Breadcrumb como navegação (CRM clicável, Empresas atual) */}
        <Breadcrumbs
          items={[
            { label: "CRM", href: "/crm" },
            { label: "Empresas", href: "/crm/companies" },
          ]}
          className="mb-4"
        />

        <div className="page-header">
          <h1 className="text-3xl font-bold">Empresas</h1>
          <Button onClick={handleCreate}>Nova empresa</Button>
        </div>

        <Card className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="">Todos os status</option>
              {Object.values(CompanyStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>

            <Select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value as any)}
            >
              <option value="">Todos os portes</option>
              {Object.values(CompanySize).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isLoading ? (
          <LoadingSkeleton type="card" count={6} />
        ) : companies.length === 0 ? (
          <EmptyState
            icon="🏢"
            title="Nenhuma empresa encontrada"
            description={
              searchTerm || statusFilter || sizeFilter
                ? "Tente ajustar os filtros para encontrar empresas."
                : "Comece criando sua primeira empresa para gerenciar seus clientes."
            }
            actionLabel="Criar primeira empresa"
            onAction={handleCreate}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {companies.map((company) => (
              <Card
                key={company.id}
                className="cursor-pointer hover:shadow-lg"
                onClick={() => handleEdit(company)}
              >
                <h3 className="font-semibold text-lg">{company.name}</h3>
                <p className="text-sm text-gray-600">
                  {company.industry || "—"}
                </p>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(company);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(company);
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <CompanyModal
          isOpen={modalOpen}
          company={editingCompany}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      </div>
    </AppLayout>
  );
}
