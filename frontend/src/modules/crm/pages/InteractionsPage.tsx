/**
 * Interactions Page
 * Página para gerenciar interações (ligações, emails, reuniões e anotações)
 */

import { useEffect, useState, useMemo } from "react";
import { AppLayout, Card, Button, Breadcrumbs } from "../../shared";
import { handleApiError } from "../../../core/utils/api";
import * as interactionService from "../services/interaction.service";
import type {
  Interaction,
  InteractionType,
} from "../services/interaction.service";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InteractionModal } from "../components/InteractionModal";

function getInteractionTypeLabel(type: InteractionType): string {
  const map: Record<InteractionType, string> = {
    call: "Ligação",
    email: "Email",
    meeting: "Reunião",
    note: "Nota",
  };
  return map[type] || type;
}

function getInteractionIcon(type: InteractionType): string {
  const map: Record<InteractionType, string> = {
    call: "📞",
    email: "📧",
    meeting: "🤝",
    note: "📝",
  };
  return map[type] || "💬";
}

function getInteractionColor(type: InteractionType): string {
  const map: Record<InteractionType, string> = {
    call: "bg-blue-100 text-blue-800",
    email: "bg-green-100 text-green-800",
    meeting: "bg-purple-100 text-purple-800",
    note: "bg-yellow-100 text-yellow-800",
  };
  return map[type] || "bg-gray-100 text-gray-800";
}

export default function InteractionsPage() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] = useState<InteractionType | "">("");
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredInteractions = useMemo(() => {
    return interactions.filter((interaction) => {
      if (typeFilter && interaction.type !== typeFilter) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchSubject = interaction.subject?.toLowerCase().includes(search);
        const matchContent = interaction.content?.toLowerCase().includes(search);
        const matchContact = interaction.contact?.name
          ?.toLowerCase()
          .includes(search);
        if (!matchSubject && !matchContent && !matchContact) return false;
      }
      return true;
    });
  }, [interactions, typeFilter, searchTerm]);

  useEffect(() => {
    loadInteractions();
  }, []);

  const loadInteractions = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await interactionService.getInteractions({ limit: 100 });
      setInteractions(result || []);
    } catch (err) {
      setError(handleApiError(err));
      setInteractions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInteraction = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveInteraction = async () => {
    await loadInteractions();
    handleCloseModal();
  };

  return (
    <AppLayout>
      <div className="page-container">
        <Breadcrumbs
          items={[
            { label: "CRM", path: "/crm" },
            { label: "Interações" },
          ]}
          className="mb-4"
        />

        <div className="page-header">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Interações</h1>
            <p className="text-gray-600 mt-1">
              Histórico de ligações, emails, reuniões e anotações
            </p>
          </div>

          <Button variant="primary" onClick={handleCreateInteraction}>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nova interação
          </Button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Buscar</label>
              <div className="relative">
                <input
                  type="search"
                  placeholder="Buscar por assunto, conteúdo ou contato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <div>
              <label className="label">Tipo</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="input"
              >
                <option value="">Todos</option>
                <option value="call">Ligação</option>
                <option value="email">Email</option>
                <option value="meeting">Reunião</option>
                <option value="note">Nota</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Interactions Timeline */}
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredInteractions.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhuma interação encontrada.
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece registrando uma nova interação.
              </p>
              <div className="mt-6">
                <Button variant="primary" onClick={handleCreateInteraction}>
                  Registrar primeira interação
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInteractions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="flex items-start border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex-shrink-0 mr-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${getInteractionColor(
                        interaction.type
                      )}`}
                    >
                      {getInteractionIcon(interaction.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInteractionColor(
                              interaction.type
                            )}`}
                          >
                            {getInteractionTypeLabel(interaction.type)}
                          </span>

                          {interaction.direction && (
                            <span className="text-xs text-gray-500">
                              {interaction.direction === "inbound"
                                ? "Recebida"
                                : "Enviada"}
                            </span>
                          )}

                          {interaction.contact && (
                            <span className="text-sm text-gray-600">
                              • {interaction.contact.name}
                            </span>
                          )}

                          {interaction.deal && (
                            <span className="text-sm text-gray-600">
                              • Deal: {interaction.deal.title}
                            </span>
                          )}
                        </div>

                        {interaction.subject && (
                          <h3 className="mt-2 text-sm font-medium text-gray-900">
                            {interaction.subject}
                          </h3>
                        )}

                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {interaction.content}
                        </p>

                        {interaction.user && (
                          <p className="mt-2 text-xs text-gray-500">
                            por {interaction.user.name}
                          </p>
                        )}
                      </div>

                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="text-xs text-gray-500">
                          {format(
                            new Date(interaction.timestamp),
                            "dd/MM/yyyy"
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(interaction.timestamp), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <InteractionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveInteraction}
        />
      </div>
    </AppLayout>
  );
}
