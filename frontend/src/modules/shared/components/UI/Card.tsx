/**
 * Card Component
 * Componente de card reutilizável
 */

import React from 'react';
import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  noPadding?: boolean;
}

/**
 * Componente de Card
 */
export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  noPadding = false,
  children,
  className,
  ...props
}) => {
  return (
    <div className={clsx('card', noPadding && 'p-0', className)} {...props}>
      {/* Header */}
      {(title || subtitle || actions) && (
        <div
          className={clsx(
            'flex items-center justify-between mb-4',
            noPadding && 'px-6 pt-6'
          )}
        >
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Content */}
      <div className={clsx(noPadding && !title && !subtitle && 'p-0')}>
        {children}
      </div>
    </div>
  );
};

export default Card;
