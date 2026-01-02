import { Company } from './types';
import { CompanyForm, CompanyFormData } from './CompanyForm';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CompanyFormData) => Promise<void>;
  company?: Company | null;
  title?: string;
}

export const CompanyModal = ({ isOpen, onClose, onSave, company, title }: CompanyModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {title || (company ? 'Editar Empresa' : 'Nova Empresa')}
            </h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <CompanyForm
            company={company}
            title={title}
            onCancel={onClose}
            onSubmit={onSave}
            submitLabel="Salvar"
            isEmbedded
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyModal;
