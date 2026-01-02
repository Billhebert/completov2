/**
 * Activity Modal
 * Modal para criar e editar atividades
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input } from "../../shared";
import * as activityService from "../services/activity.service";
import * as contactService from "../services/contact.service";
import * as dealService from "../services/deal.service";
import { handleApiError } from "../../../core/utils/api";
import type {
  Activity,
  ActivityType,
  ActivityPriority,
  ActivityStatus,
  CreateActivityRequest,
} from "../services/activity.service";

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  activity?: Activity | null;
}

export function ActivityModal({
  isOpen,
  onClose,
  onSave,
  activity,
}: ActivityModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateActivityRequest>();

  useEffect(() => {
    if (isOpen) {
      if (activity) {
        reset({
          type: activity.type,
          subject: activity.subject,
          description: activity.description || "",
          dueDate: activity.dueDate
            ? new Date(activity.dueDate).toISOString().slice(0, 16)
            : "",
          duration: activity.duration || undefined,
          priority: activity.priority,
          status: activity.status,
          contactId: activity.contactId || "",
          dealId: activity.dealId || "",
          assignedToId: activity.assignedToId,
          location: activity.location || "",
          reminder: activity.reminder || undefined,
        });
      } else {
        reset({
          type: "task",
          subject: "",
          description: "",
          dueDate: "",
          duration: undefined,
          priority: "medium",
          status: "todo",
          contactId: "",
          dealId: "",
          assignedToId: "",
          location: "",
          reminder: undefined,
        });
      }
      setError("");
    }
  }, [isOpen, activity, reset]);

  const onSubmit = async (data: CreateActivityRequest) => {
    setIsSubmitting(true);
    setError("");

    try {
      // Limpar campos vazios
      const payload: any = {
        ...data,
        contactId: data.contactId || undefined,
        dealId: data.dealId || undefined,
        location: data.location || undefined,
        reminder: data.reminder || undefined,
        duration: data.duration || undefined,
        description: data.description || undefined,
        dueDate: data.dueDate || undefined,
      };

      if (activity) {
        await activityService.updateActivity(activity.id, payload);
      } else {
        // Para criar, precisamos do assignedToId - vamos usar um valor padrão se não fornecido
        // Em produção, deveria pegar o ID do usuário logado
        if (!payload.assignedToId) {
          payload.assignedToId = "current-user-id"; // TODO: pegar do contexto de autenticação
        }
        await activityService.createActivity(payload);
      }

      await onSave();
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {activity ? "Editar Atividade" : "Nova Atividade"}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo *</label>
                  <select {...register("type", { required: true })} className="input">
                    <option value="task">Tarefa</option>
                    <option value="call">Ligação</option>
                    <option value="meeting">Reunião</option>
                    <option value="email">Email</option>
                  </select>
                  {errors.type && (
                    <span className="text-red-500 text-sm">Campo obrigatório</span>
                  )}
                </div>

                <div>
                  <label className="label">Prioridade *</label>
                  <select
                    {...register("priority", { required: true })}
                    className="input"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Assunto *</label>
                <Input
                  {...register("subject", { required: true })}
                  placeholder="Ex: Ligar para cliente sobre proposta"
                  error={errors.subject?.message}
                />
              </div>

              <div>
                <label className="label">Descrição</label>
                <textarea
                  {...register("description")}
                  rows={4}
                  className="input"
                  placeholder="Detalhes adicionais sobre a atividade..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Data/Hora</label>
                  <input
                    type="datetime-local"
                    {...register("dueDate")}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Duração (minutos)</label>
                  <Input
                    type="number"
                    {...register("duration", { valueAsNumber: true })}
                    placeholder="60"
                  />
                </div>
              </div>

              <div>
                <label className="label">Status</label>
                <select {...register("status")} className="input">
                  <option value="todo">A fazer</option>
                  <option value="in_progress">Em andamento</option>
                  <option value="done">Concluída</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="label">Local</label>
                <Input
                  {...register("location")}
                  placeholder="Ex: Sala de reuniões, Google Meet, etc."
                />
              </div>

              <div>
                <label className="label">Lembrete (minutos antes)</label>
                <select {...register("reminder", { valueAsNumber: true })} className="input">
                  <option value="">Sem lembrete</option>
                  <option value="5">5 minutos</option>
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="1440">1 dia</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Contato ID (opcional)</label>
                  <Input
                    {...register("contactId")}
                    placeholder="ID do contato relacionado"
                  />
                </div>

                <div>
                  <label className="label">Negociação ID (opcional)</label>
                  <Input
                    {...register("dealId")}
                    placeholder="ID da negociação relacionada"
                  />
                </div>
              </div>

              <div>
                <label className="label">Responsável ID</label>
                <Input
                  {...register("assignedToId")}
                  placeholder="ID do usuário responsável"
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ActivityModal;
