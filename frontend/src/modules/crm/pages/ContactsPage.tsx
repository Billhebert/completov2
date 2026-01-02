/**
 * Contacts Page (alinhado com o backend)
 */

import { useEffect, useMemo, useState } from "react";
import { AppLayout, Card, Button, Breadcrumbs } from "../../shared";
import { Contact } from "../types";
import * as contactService from "../services/contact.service";
import  ContactModal  from "../components/ContactModal";
import { handleApiError } from "../../../core/utils/api";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function initialsFromName(name?: string) {
  const safe = (name ?? "").trim();
  if (!safe) return "??";
  const parts = safe.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]) ?? "?";
  return `${first}${last}`.toUpperCase();
}

function statusLabel(status?: string | null) {
  const s = (status ?? "").toLowerCase();
  const map: Record<string, string> = {
    lead: "Lead",
    prospect: "Prospect",
    qualified: "Qualificado",
    customer: "Cliente",
    nurturing: "Nutrição",
    lost: "Perdido",
    inactive: "Inativo",
  };
  return map[s] ?? (status || "N/A");
}

function statusBadgeClass(status?: string | null) {
  const s = (status ?? "").toLowerCase();
  const map: Record<string, string> = {
    lead: "bg-blue-100 text-blue-800",
    prospect: "bg-yellow-100 text-yellow-800",
    qualified: "bg-indigo-100 text-indigo-800",
    customer: "bg-green-100 text-green-800",
    nurturing: "bg-purple-100 text-purple-800",
    lost: "bg-red-100 text-red-800",
    inactive: "bg-gray-100 text-gray-800",
  };
  return map[s] ?? "bg-gray-100 text-gray-800";
}

function sourceLabel(source?: string | null) {
  const s = (source ?? "").toLowerCase();
  const map: Record<string, string> = {
    website: "Website",
    referral: "Indicação",
    social: "Redes Sociais",
    email: "Email",
    phone: "Telefone",
    event: "Evento",
    other: "Outro",
  };
  return map[s] ?? (source || "-");
}

export const ContactsPage = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>("");
  const [leadSourceFilter, setLeadSourceFilter] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const filters = useMemo(
    () => ({
      search: searchTerm || undefined,
      leadStatus: leadStatusFilter || undefined,
      leadSource: leadSourceFilter || undefined,
    }),
    [searchTerm, leadStatusFilter, leadSourceFilter]
  );

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.leadStatus, filters.leadSource]);

  const loadContacts = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await contactService.getContacts({
        page: 1,
        limit: 50,
        ...filters,
      });

      setContacts(result?.data ?? []);
    } catch (err) {
      setError(handleApiError(err));
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContact = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const handleSaveContact = async (data: any) => {
    try {
      if (editingContact) {
        await contactService.updateContact(editingContact.id, data);
      } else {
        await contactService.createContact(data);
      }
      await loadContacts();
    } catch (err) {
      // o modal vai exibir isso
      throw new Error(handleApiError(err));
    }
  };

  const handleDeleteContact = async (id: string) => {
    const contact = contacts.find(c => c.id === id);
    const dealCount = contact?.dealsCount || 0;
    const interactionCount = contact?.interactionsCount || 0;

    let confirmMessage = "Tem certeza que deseja excluir este contato?";

    if (dealCount > 0 || interactionCount > 0) {
      confirmMessage = `Tem certeza que deseja excluir este contato?\n\nISSO TAMBÉM IRÁ EXCLUIR:`;
      if (dealCount > 0) {
        confirmMessage += `\n- ${dealCount} negociação(ões)`;
      }
      if (interactionCount > 0) {
        confirmMessage += `\n- ${interactionCount} interação(ões)`;
      }
      confirmMessage += `\n\nEsta ação não pode ser desfeita.`;
    }

    if (!window.confirm(confirmMessage)) return;

    try {
      await contactService.deleteContact(id);
      await loadContacts();
      setError(""); // Limpa erro em caso de sucesso
    } catch (err: any) {
      setError(handleApiError(err));
    }
  };

  return (
    <AppLayout>
      <div className="page-container">
        <Breadcrumbs items={[{ label: "CRM", path: "/crm" }, { label: "Contatos" }]} className="mb-4" />

        <div className="page-header">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contatos</h1>
            <p className="text-gray-600 mt-1">Gerencie seus contatos e leads</p>
          </div>

          <Button variant="primary" onClick={handleCreateContact}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo contato
          </Button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Buscar</label>
              <div className="relative">
                <input
                  type="search"
                  placeholder="Nome, email, telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                value={leadStatusFilter}
                onChange={(e) => setLeadStatusFilter(e.target.value)}
                className="input"
              >
                <option value="">Todos</option>
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="qualified">Qualificado</option>
                <option value="customer">Cliente</option>
                <option value="nurturing">Nutrição</option>
                <option value="lost">Perdido</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            <div>
              <label className="label">Origem</label>
              <select
                value={leadSourceFilter}
                onChange={(e) => setLeadSourceFilter(e.target.value)}
                className="input"
              >
                <option value="">Todas</option>
                <option value="website">Website</option>
                <option value="referral">Indicação</option>
                <option value="social">Redes Sociais</option>
                <option value="email">Email</option>
                <option value="phone">Telefone</option>
                <option value="event">Evento</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum contato encontrado.</h3>
              <p className="mt-1 text-sm text-gray-500">Comece criando um novo contato.</p>
              <div className="mt-6">
                <Button variant="primary" onClick={handleCreateContact}>
                  Criar primeiro contato
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>Empresa</th>
                    <th>Status</th>
                    <th>Origem</th>
                    <th>Último contato</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium mr-3">
                            {initialsFromName(c.name)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{c.name}</div>
                            {c.position && <div className="text-sm text-gray-500">{c.position}</div>}
                          </div>
                        </div>
                      </td>

                      <td>
                        {c.email ? (
                          <a href={`mailto:${c.email}`} className="text-blue-600 hover:text-blue-800">
                            {c.email}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="text-gray-600">{c.phone || "-"}</td>
                      <td>
                        {c.crmCompany ? (
                          <div>
                            <div className="font-medium text-gray-900">{c.crmCompany.name}</div>
                            {c.crmCompany.industry && (
                              <div className="text-xs text-gray-500">{c.crmCompany.industry}</div>
                            )}
                          </div>
                        ) : c.companyName ? (
                          <span className="text-gray-600">{c.companyName}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(c.leadStatus)}`}>
                          {statusLabel(c.leadStatus)}
                        </span>
                      </td>

                      <td className="text-gray-600">{sourceLabel(c.leadSource)}</td>

                      <td className="text-gray-500 text-sm">
                        {c.lastContactedAt
                          ? formatDistanceToNow(new Date(c.lastContactedAt), { addSuffix: true, locale: ptBR })
                          : "Nunca"}
                      </td>

                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="p-1 text-gray-400 hover:text-blue-600 transition"
                            title="Editar"
                            onClick={() => handleEditContact(c)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <button
                            className="p-1 text-gray-400 hover:text-red-600 transition"
                            title="Excluir"
                            onClick={() => handleDeleteContact(c.id)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <ContactModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveContact}
          contact={editingContact}
        />
      </div>
    </AppLayout>
  );
};

export default ContactsPage;
