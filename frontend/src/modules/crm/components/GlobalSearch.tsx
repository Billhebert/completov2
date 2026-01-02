import { useEffect, useState, useRef, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition, Combobox } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  UserIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import * as dealService from "../services/deal.service";
import * as contactService from "../services/contact.service";
import * as companyService from "../services/company.service";
import { Deal } from "../types/deal.types";
import { Contact } from "../types/contact.types";
import { Company } from "../types/company.types";

type SearchResultType = "deal" | "contact" | "company" | "activity" | "interaction";

interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  data?: any;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch = ({ isOpen, onClose }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 2) {
      searchAll();
    } else {
      setResults([]);
    }
  }, [query]);

  const searchAll = async () => {
    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search deals
      const deals = await dealService.getDeals({ limit: 10 });
      deals.data
        ?.filter((deal: Deal) =>
          deal.title.toLowerCase().includes(query.toLowerCase())
        )
        .forEach((deal: Deal) => {
          searchResults.push({
            id: deal.id,
            type: "deal",
            title: deal.title,
            subtitle: `${deal.stage} - ${formatCurrency(deal.value || 0)}`,
            description: deal.description,
            url: `/crm/deals/${deal.id}`,
            data: deal,
          });
        });

      // Search contacts
      const contacts = await contactService.getContacts({ limit: 10 });
      contacts.data
        ?.filter(
          (contact: Contact) =>
            contact.name.toLowerCase().includes(query.toLowerCase()) ||
            contact.email?.toLowerCase().includes(query.toLowerCase())
        )
        .forEach((contact: Contact) => {
          searchResults.push({
            id: contact.id,
            type: "contact",
            title: contact.name,
            subtitle: contact.email || contact.position || "Sem email",
            description: contact.crmCompany?.name,
            url: `/crm/contacts/${contact.id}`,
            data: contact,
          });
        });

      // Search companies
      const companies = await companyService.getCompanies({ limit: 10 });
      companies.data
        ?.filter((company: Company) =>
          company.name.toLowerCase().includes(query.toLowerCase())
        )
        .forEach((company: Company) => {
          searchResults.push({
            id: company.id,
            type: "company",
            title: company.name,
            subtitle: `${company.status} - ${company.industry || "Sem indústria"}`,
            description: company.email,
            url: `/crm/companies`,
            data: company,
          });
        });

      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getIcon = (type: SearchResultType) => {
    const className = "h-5 w-5";
    switch (type) {
      case "deal":
        return <BriefcaseIcon className={className} />;
      case "contact":
        return <UserIcon className={className} />;
      case "company":
        return <BuildingOfficeIcon className={className} />;
      case "activity":
        return <CalendarIcon className={className} />;
      case "interaction":
        return <ChatBubbleLeftIcon className={className} />;
    }
  };

  const getTypeLabel = (type: SearchResultType) => {
    switch (type) {
      case "deal":
        return "Deal";
      case "contact":
        return "Contato";
      case "company":
        return "Empresa";
      case "activity":
        return "Atividade";
      case "interaction":
        return "Interação";
    }
  };

  const getTypeColor = (type: SearchResultType) => {
    switch (type) {
      case "deal":
        return "text-blue-600 bg-blue-100";
      case "contact":
        return "text-green-600 bg-green-100";
      case "company":
        return "text-purple-600 bg-purple-100";
      case "activity":
        return "text-orange-600 bg-orange-100";
      case "interaction":
        return "text-pink-600 bg-pink-100";
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<SearchResultType, SearchResult[]>);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    onClose();
    setQuery("");
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
              <Combobox onChange={handleSelect}>
                {/* Search Input */}
                <div className="relative">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                  <Combobox.Input
                    ref={inputRef}
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm outline-none"
                    placeholder="Buscar em deals, contatos, empresas..."
                    onChange={(event) => setQuery(event.target.value)}
                    value={query}
                  />
                  <div className="absolute right-4 top-3 flex items-center gap-2">
                    <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-sans text-gray-600">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                    <kbd className="inline-flex sm:hidden items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-sans text-gray-600">
                      Ctrl K
                    </kbd>
                  </div>
                </div>

                {/* Results */}
                {query.length >= 2 && (
                  <Combobox.Options
                    static
                    className="max-h-[32rem] scroll-py-2 overflow-y-auto py-2 text-sm text-gray-800"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : results.length === 0 ? (
                      <div className="px-6 py-14 text-center text-sm">
                        <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 font-semibold text-gray-900">
                          Nenhum resultado encontrado
                        </p>
                        <p className="mt-2 text-gray-500">
                          Tente buscar por deals, contatos ou empresas
                        </p>
                      </div>
                    ) : (
                      <>
                        {Object.entries(groupedResults).map(([type, items]) => (
                          <div key={type}>
                            <div className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50">
                              {getTypeLabel(type as SearchResultType)}s ({items.length})
                            </div>
                            {items.map((result) => (
                              <Combobox.Option
                                key={result.id}
                                value={result}
                                className={({ active }) =>
                                  `cursor-pointer select-none px-4 py-3 ${
                                    active ? "bg-blue-50" : ""
                                  }`
                                }
                              >
                                {({ active }) => (
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`flex-shrink-0 mt-1 p-2 rounded-lg ${getTypeColor(
                                        result.type
                                      )}`}
                                    >
                                      {getIcon(result.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-gray-900 truncate">
                                        {result.title}
                                      </p>
                                      {result.subtitle && (
                                        <p className="text-sm text-gray-600 truncate">
                                          {result.subtitle}
                                        </p>
                                      )}
                                      {result.description && (
                                        <p className="text-xs text-gray-500 truncate mt-1">
                                          {result.description}
                                        </p>
                                      )}
                                    </div>
                                    {active && (
                                      <div className="flex-shrink-0 text-blue-600 text-xs font-medium">
                                        Enter ↵
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Combobox.Option>
                            ))}
                          </div>
                        ))}
                      </>
                    )}
                  </Combobox.Options>
                )}

                {/* Footer */}
                {query.length < 2 && (
                  <div className="px-6 py-8 text-center text-sm text-gray-500">
                    <p>Digite pelo menos 2 caracteres para buscar</p>
                    <div className="mt-4 flex items-center justify-center gap-4">
                      <div className="flex items-center gap-2">
                        <BriefcaseIcon className="h-4 w-4 text-blue-600" />
                        <span>Deals</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-green-600" />
                        <span>Contatos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="h-4 w-4 text-purple-600" />
                        <span>Empresas</span>
                      </div>
                    </div>
                  </div>
                )}
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

// Hook to use global search with keyboard shortcut
export const useGlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
};
