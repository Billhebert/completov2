/**
 * Activities Page
 * Página para gerenciar atividades (tarefas, ligações, reuniões, emails)
 */

import { useEffect, useState, useMemo } from "react";
import { AppLayout, Card, Button, Breadcrumbs } from "../../shared";
import { handleApiError } from "../../../core/utils/api";
import * as activityService from "../services/activity.service";
import type {
  Activity,
  ActivityType,
  ActivityStatus,
  ActivityPriority,
} from "../services/activity.service";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ActivityModal } from "../components/ActivityModal";

function getActivityTypeLabel(type: ActivityType): string {
  const map: Record<ActivityType, string> = {
    task: "Tarefa",
    call: "Ligação",
    meeting: "Reunião",
    email: "Email",
  };
  return map[type] || type;
}

function getActivityStatusLabel(status: ActivityStatus): string {
  const map: Record<ActivityStatus, string> = {
    todo: "A fazer",
    in_progress: "Em andamento",
    done: "Concluída",
    cancelled: "Cancelada",
  };
  return map[status] || status;
}

function getActivityStatusColor(status: ActivityStatus): string {
  const map: Record<ActivityStatus, string> = {
    todo: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    done: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

function getPriorityLabel(priority: ActivityPriority): string {
  const map: Record<ActivityPriority, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    urgent: "Urgente",
  };
  return map[priority] || priority;
}

function getPriorityColor(priority: ActivityPriority): string {
  const map: Record<ActivityPriority, string> = {
    low: "text-gray-600",
    medium: "text-yellow-600",
    high: "text-orange-600",
    urgent: "text-red-600",
  };
  return map[priority] || "text-gray-600";
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] = useState<ActivityType | "">("");
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<ActivityPriority | "">("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (typeFilter && activity.type !== typeFilter) return false;
      if (statusFilter && activity.status !== statusFilter) return false;
      if (priorityFilter && activity.priority !== priorityFilter) return false;
      return true;
    });
  }, [activities, typeFilter, statusFilter, priorityFilter]);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await activityService.getActivities({
        page: 1,
        limit: 100,
      });

      setActivities(result.data || []);
    } catch (err) {
      setError(handleApiError(err));
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateActivity = () => {
    setEditingActivity(null);
    setIsModalOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingActivity(null);
  };

  const handleSaveActivity = async () => {
    await loadActivities();
    handleCloseModal();
  };

  const handleDeleteActivity = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta atividade?"))
      return;

    try {
      await activityService.deleteActivity(id);
      await loadActivities();
    } catch (err: any) {
      setError(handleApiError(err));
    }
  };

  const handleToggleStatus = async (activity: Activity) => {
    try {
      const newStatus = activity.status === "done" ? "todo" : "done";
      await activityService.updateActivity(activity.id, { status: newStatus });
      await loadActivities();
    } catch (err: any) {
      setError(handleApiError(err));
    }
  };

  return (
    <AppLayout>
      <div className="page-container">
        <Breadcrumbs
          items={[
            { label: "CRM", path: "/crm" },
            { label: "Atividades" },
          ]}
          className="mb-4"
        />

        <div className="page-header">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Atividades</h1>
            <p className="text-gray-600 mt-1">
              Gerencie tarefas, ligações, reuniões e emails
            </p>
          </div>

          <Button variant="primary" onClick={handleCreateActivity}>
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
            Nova atividade
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
              <label className="label">Tipo</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="input"
              >
                <option value="">Todos</option>
                <option value="task">Tarefa</option>
                <option value="call">Ligação</option>
                <option value="meeting">Reunião</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="input"
              >
                <option value="">Todos</option>
                <option value="todo">A fazer</option>
                <option value="in_progress">Em andamento</option>
                <option value="done">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="label">Prioridade</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="input"
              >
                <option value="">Todas</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Activities List */}
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhuma atividade encontrada.
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece criando uma nova atividade.
              </p>
              <div className="mt-6">
                <Button variant="primary" onClick={handleCreateActivity}>
                  Criar primeira atividade
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-10"></th>
                    <th>Assunto</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Prioridade</th>
                    <th>Data</th>
                    <th>Responsável</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={activity.status === "done"}
                          onChange={() => handleToggleStatus(activity)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>

                      <td>
                        <div>
                          <div className="font-medium text-gray-900">
                            {activity.subject}
                          </div>
                          {activity.description && (
                            <div className="text-sm text-gray-500 truncate max-w-md">
                              {activity.description}
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="text-gray-600">
                          {getActivityTypeLabel(activity.type)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityStatusColor(
                            activity.status
                          )}`}
                        >
                          {getActivityStatusLabel(activity.status)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`font-medium ${getPriorityColor(
                            activity.priority
                          )}`}
                        >
                          {getPriorityLabel(activity.priority)}
                        </span>
                      </td>

                      <td className="text-gray-500 text-sm">
                        {activity.dueDate ? (
                          <div>
                            <div>{format(new Date(activity.dueDate), "dd/MM/yyyy")}</div>
                            <div className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(activity.dueDate), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="text-gray-600">
                        {activity.assignedTo?.name || "-"}
                      </td>

                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="p-1 text-gray-400 hover:text-blue-600 transition"
                            title="Editar"
                            onClick={() => handleEditActivity(activity)}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>

                          <button
                            className="p-1 text-gray-400 hover:text-red-600 transition"
                            title="Excluir"
                            onClick={() => handleDeleteActivity(activity.id)}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
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

        <ActivityModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveActivity}
          activity={editingActivity}
        />
      </div>
    </AppLayout>
  );
}
