/**
 * Sidebar Component
 * Barra lateral com navegação dos módulos
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useModule } from '../../../../core/providers/ModuleProvider';
import { ModuleConfig } from '../../../../core/types';
import { CATEGORY_COLORS } from '../../../../core/utils/constants';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Componente de Sidebar
 */
export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { getEnabledModules } = useModule();

  // Obter módulos habilitados que aparecem no menu
  const menuModules = getEnabledModules()
    .filter((m) => m.showInMenu)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Agrupar módulos por categoria
  const modulesByCategory = menuModules.reduce((acc, module) => {
    const category = module.category || 'core';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(module);
    return acc;
  }, {} as Record<string, ModuleConfig[]>);

  const categoryNames: Record<string, string> = {
    core: 'Sistema',
    business: 'Negócio',
    operations: 'Operações',
    ai: 'Inteligência Artificial',
    infrastructure: 'Infraestrutura',
    erp: 'ERP & Financeiro',
    hr: 'Recursos Humanos',
    specialized: 'Especializados',
  };

  /**
   * Verificar se a rota está ativa
   */
  const isRouteActive = (path: string): boolean => {
    return location.pathname.startsWith(path);
  };

  /**
   * Obter primeira rota do módulo (simplificado)
   */
  const getModulePath = (moduleId: string): string => {
    // Mapeamento simplificado - será melhorado quando as rotas forem registradas
    return `/${moduleId}`;
  };

  return (
    <aside
      className={clsx(
        // A classe `sidebar` define o estilo visual; a largura é controlada aqui.
        'sidebar transition-all duration-300 overflow-hidden',
        isOpen ? 'w-64' : 'w-0'
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Completov2</h1>
        <p className="text-sm text-gray-400 mt-1">Sistema Completo</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {/* Main Navigation - Always visible */}
        <div className="mb-6">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Principal
          </div>
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className={clsx(
                'nav-link flex items-center',
                isRouteActive('/dashboard') && 'active'
              )}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="flex-1">Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Module Navigation */}
        {Object.entries(modulesByCategory).map(([category, modules]) => (
          <div key={category} className="mb-6">
            {/* Category header */}
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {categoryNames[category] || category}
            </div>

            {/* Module links */}
            <div className="space-y-1">
              {modules.map((module) => {
                const path = getModulePath(module.id);
                const isActive = isRouteActive(path);

                return (
                  <Link
                    key={module.id}
                    to={path}
                    className={clsx(
                      'nav-link flex items-center',
                      isActive && 'active'
                    )}
                    title={module.description}
                  >
                    {/* Icon placeholder */}
                    <div
                      className="w-2 h-2 rounded-full mr-3"
                      style={{
                        backgroundColor:
                          module.color || CATEGORY_COLORS[module.category || 'core'] || '#6b7280',
                      }}
                    />
                    <span className="flex-1">{module.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          v2.0.0 | {menuModules.length} módulos ativos
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
