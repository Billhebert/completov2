/**
 * Interaction Modal
 * Modal para registrar interações (ligações, emails, reuniões e notas)
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input } from "../../shared";
import * as interactionService from "../services/interaction.service";
import { handleApiError } from "../../../core/utils/api";
import type {
  InteractionType,
  InteractionDirection,
  CreateInteractionRequest,
} from "../services/interaction.service";

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  contactId?: string;
  dealId?: string;
}

export function InteractionModal({
  isOpen,
  onClose,
  onSave,
  contactId,
  dealId,
}: InteractionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateInteractionRequest>();

  const selectedType = watch("type");

  useEffect(() => {
    if (isOpen) {
      reset({
        type: "call",
        subject: "",
        content: "",
        direction: "outbound",
        contactId: contactId || "",
        dealId: dealId || "",
        scheduledFor: "",
      });
      setError("");
    }
  }, [isOpen, reset, contactId, dealId]);

  const onSubmit = async (data: CreateInteractionRequest) => {
    setIsSubmitting(true);
    setError("");

    try {
      // Limpar campos vazios
      const payload: CreateInteractionRequest = {
        type: data.type,
        content: data.content,
        subject: data.subject || undefined,
        direction: data.direction || undefined,
        contactId: data.contactId || undefined,
        dealId: data.dealId || undefined,
        scheduledFor: data.scheduledFor || undefined,
      };

      await interactionService.createInteraction(payload);
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
                Registrar Interação
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
                    <option value="call">📞 Ligação</option>
                    <option value="email">📧 Email</option>
                    <option value="meeting">🤝 Reunião</option>
                    <option value="note">📝 Nota</option>
                  </select>
                  {errors.type && (
                    <span className="text-red-500 text-sm">Campo obrigatório</span>
                  )}
                </div>

                {(selectedType === "call" || selectedType === "email") && (
                  <div>
                    <label className="label">Direção</label>
                    <select {...register("direction")} className="input">
                      <option value="outbound">Enviada/Feita</option>
                      <option value="inbound">Recebida</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Assunto</label>
                <Input
                  {...register("subject")}
                  placeholder={
                    selectedType === "call"
                      ? "Ex: Ligação sobre proposta comercial"
                      : selectedType === "email"
                        ? "Ex: Seguimento da reunião"
                        : selectedType === "meeting"
                          ? "Ex: Reunião de apresentação"
                          : "Ex: Observações importantes"
                  }
                />
              </div>

              <div>
                <label className="label">Conteúdo/Notas *</label>
                <textarea
                  {...register("content", { required: true })}
                  rows={6}
                  className="input"
                  placeholder={
                    selectedType === "call"
                      ? "Resuma o que foi discutido na ligação..."
                      : selectedType === "email"
                        ? "Conteúdo do email ou resumo da conversa..."
                        : selectedType === "meeting"
                          ? "Principais pontos discutidos na reunião..."
                          : "Suas anotações..."
                  }
                />
                {errors.content && (
                  <span className="text-red-500 text-sm">Campo obrigatório</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Contato ID (opcional)</label>
                  <Input
                    {...register("contactId")}
                    placeholder="ID do contato relacionado"
                    defaultValue={contactId}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deixe em branco se não estiver relacionado a um contato
                    específico
                  </p>
                </div>

                <div>
                  <label className="label">Negociação ID (opcional)</label>
                  <Input
                    {...register("dealId")}
                    placeholder="ID da negociação relacionada"
                    defaultValue={dealId}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deixe em branco se não estiver relacionado a uma negociação
                  </p>
                </div>
              </div>

              {selectedType === "meeting" && (
                <div>
                  <label className="label">Data/Hora da reunião</label>
                  <input
                    type="datetime-local"
                    {...register("scheduledFor")}
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Opcional: quando a reunião está agendada ou aconteceu
                  </p>
                </div>
              )}
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

export default InteractionModal;
