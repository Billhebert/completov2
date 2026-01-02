import { Company } from '../types';
import { CompanyForm, CompanyFormData } from './CompanyForm';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CompanyFormData) => Promise<void>;
  company?: Company | null;
  title?: string;
};

export function CompanyDrawer({ isOpen, onClose, onSave, company, title }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[720px] bg-white shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title || (company ? 'Editar Empresa' : 'Nova Empresa')}
            </h3>
            <p className="text-sm text-gray-600">Preencha os dados e salve.</p>
          </div>

          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <CompanyForm company={company} onCancel={onClose} onSubmit={onSave} submitLabel="Salvar" isEmbedded />
        </div>
      </div>
    </div>
  );
}
