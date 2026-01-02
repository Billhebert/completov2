/**
 * EmptyState Component
 * Componente reutilizável para mostrar estados vazios com consistência
 */

import React from 'react';
import { Button } from './Button';
import { Card } from './Card';

interface EmptyStateProps {
  /** Ícone a ser exibido (componente React ou emoji) */
  icon?: React.ReactNode;
  /** Título do estado vazio */
  title: string;
  /** Descrição opcional */
  description?: string;
  /** Texto do botão de ação */
  actionLabel?: string;
  /** Callback quando o botão é clicado */
  onAction?: () => void;
  /** Variante do botão */
  actionVariant?: 'primary' | 'secondary' | 'danger';
  /** Classe CSS adicional */
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  className = '',
}) => {
  return (
    <Card className={`p-12 text-center ${className}`}>
      {icon && (
        <div className="flex justify-center mb-4 text-5xl text-gray-400">
          {icon}
        </div>
      )}

      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button
          variant={actionVariant}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </Card>
  );
};

export default EmptyState;
