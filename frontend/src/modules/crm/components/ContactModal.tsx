import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Contact } from "../types";
import { Button, Input } from "../../shared";
import Select from "../../shared/components/UI/Select";
import * as companyService from "../services/company.service";

/* ================= SCHEMA ================= */

const contactSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  crmCompanyId: z.string().optional().or(z.literal("")), // FK para CrmCompany
  position: z.string().optional().or(z.literal("")),
  leadStatus: z.enum([
    "lead",
    "prospect",
    "qualified",
    "customer",
    "nurturing",
    "lost",
    "inactive",
  ]),
  leadSource: z.enum([
    "website",
    "referral",
    "social",
    "email",
    "phone",
    "event",
    "other",
  ]),
  tags: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof contactSchema>;

/* ================= COMPONENT ================= */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  contact?: Contact | null;
}

const ContactModal = ({ isOpen, onClose, onSave, contact }: Props) => {
  const [submitError, setSubmitError] = useState("");
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);

  const defaultValues = useMemo<FormData>(
    () => ({
      name: "",
      email: "",
      phone: "",
      companyName: "",
      crmCompanyId: "",
      position: "",
      leadStatus: "lead",
      leadSource: "website",
      tags: "",
    }),
    []
  );

  // Buscar empresas do CRM ao abrir o modal
  useEffect(() => {
    if (!isOpen) return;

    const loadCompanies = async () => {
      try {
        const result = await companyService.getCompanies({ page: 1, limit: 100 });
        const companyList = Array.isArray(result.data) ? result.data : [];
        setCompanies(companyList.map((c: any) => ({ id: c.id, name: c.name })));
      } catch (error) {
        console.error("Erro ao carregar empresas:", error);
        setCompanies([]);
      }
    };

    loadCompanies();
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  });

  useEffect(() => {
    setSubmitError("");

    if (contact) {
      reset({
        name: contact.name ?? "",
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        companyName: contact.companyName ?? "",
        crmCompanyId: contact.crmCompanyId ?? "",
        position: contact.position ?? "",
        leadStatus: (contact.leadStatus as any) ?? "lead",
        leadSource: (contact.leadSource as any) ?? "website",
        tags: Array.isArray(contact.tags) ? contact.tags.join(", ") : "",
      });
    } else {
      reset(defaultValues);
    }
  }, [contact, reset, defaultValues]);

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    setSubmitError("");

    try {
      await onSave({
        name: data.name.trim(),
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        companyName: data.companyName?.trim() || undefined,
        crmCompanyId: data.crmCompanyId?.trim() || undefined,
        position: data.position?.trim() || undefined,
        leadStatus: data.leadStatus,
        leadSource: data.leadSource,
        tags: data.tags
          ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : undefined,
      });

      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || "Erro ao salvar contato");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {contact ? "Editar contato" : "Novo contato"}
        </h2>

        {submitError && (
          <div className="mb-4 bg-red-50 text-red-700 px-4 py-2 rounded">
            {submitError}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Nome" {...register("name")} error={errors.name?.message} />
          <Input label="Email" {...register("email")} error={errors.email?.message} />
          <Input label="Telefone" {...register("phone")} />
          <Input label="Empresa (texto livre)" {...register("companyName")} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa do CRM
            </label>
            <Select {...register("crmCompanyId")}>
              <option value="">Nenhuma</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-sm text-gray-500">
              Vincule este contato a uma empresa cadastrada no CRM
            </p>
          </div>

          <Input label="Cargo" {...register("position")} />

          <div className="grid grid-cols-2 gap-4">
            <select {...register("leadStatus")} className="input">
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="qualified">Qualificado</option>
              <option value="customer">Cliente</option>
              <option value="nurturing">Nutrição</option>
              <option value="lost">Perdido</option>
              <option value="inactive">Inativo</option>
            </select>

            <select {...register("leadSource")} className="input">
              <option value="website">Website</option>
              <option value="referral">Indicação</option>
              <option value="social">Social</option>
              <option value="email">Email</option>
              <option value="phone">Telefone</option>
              <option value="event">Evento</option>
              <option value="other">Outro</option>
            </select>
          </div>

          <Input label="Tags (vírgula)" {...register("tags")} />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;
