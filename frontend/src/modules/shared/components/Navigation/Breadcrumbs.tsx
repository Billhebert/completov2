/**
 * Breadcrumbs Component
 * Componente de navegação breadcrumb
 */

import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  href?: string; // Alias para path (para compatibilidade)
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

/**
 * Componente de Breadcrumbs
 * Se nenhum item for fornecido, gera automaticamente baseado na URL
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  const location = useLocation();

  // Mapeamento de paths para labels legíveis
  const pathLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    profile: 'Meu Perfil',
    settings: 'Configurações',
    crm: 'CRM',
    chat: 'Chat',
    knowledge: 'Base de Conhecimento',
    ai: 'Inteligência Artificial',
    automations: 'Automações',
    analytics: 'Analytics',
    // Adicione mais conforme necessário
  };

  // Gerar breadcrumbs automaticamente se não fornecidos
  const breadcrumbs = items || generateBreadcrumbs(location.pathname, pathLabels);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      className={clsx('flex items-center space-x-2 text-sm', className)}
      aria-label="Breadcrumb"
    >
      {/* Home icon */}
      <Link
        to="/dashboard"
        className="text-gray-500 hover:text-gray-700 transition"
        title="Ir para Dashboard"
      >
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      </Link>

      {/* Breadcrumb items */}
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={index} className="flex items-center space-x-2">
            {/* Separator */}
            <svg
              className="w-4 h-4 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>

            {/* Breadcrumb item */}
            {isLast || !item.path ? (
              <span className="text-gray-900 font-medium flex items-center">
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="text-gray-500 hover:text-gray-700 transition flex items-center"
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

/**
 * Gera breadcrumbs automaticamente baseado no pathname
 */
function generateBreadcrumbs(
  pathname: string,
  pathLabels: Record<string, string>
): BreadcrumbItem[] {
  // Remove leading/trailing slashes e split
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [];
  }

  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = pathLabels[segment] || capitalize(segment);

    breadcrumbs.push({
      label,
      path: index === segments.length - 1 ? undefined : currentPath,
    });
  });

  return breadcrumbs;
}

/**
 * Capitaliza a primeira letra
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default Breadcrumbs;
