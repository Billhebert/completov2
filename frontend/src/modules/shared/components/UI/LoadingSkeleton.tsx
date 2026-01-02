/**
 * LoadingSkeleton Component
 * Componente para exibir esqueletos de loading com melhor UX
 */

import React from 'react';
import { Card } from './Card';

interface LoadingSkeletonProps {
  /** Tipo de skeleton a ser exibido */
  type?: 'text' | 'card' | 'table' | 'list' | 'custom';
  /** Número de linhas/itens a serem exibidos */
  count?: number;
  /** Altura do skeleton (apenas para type="custom") */
  height?: string;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Skeleton básico animado
 */
const SkeletonItem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
  />
);

/**
 * Skeleton para texto
 */
const TextSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonItem
        key={i}
        className={`h-4 ${i % 3 === 0 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

/**
 * Skeleton para cards
 */
const CardSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="p-6">
        <SkeletonItem className="h-6 w-3/4 mb-3" />
        <SkeletonItem className="h-4 w-full mb-2" />
        <SkeletonItem className="h-4 w-5/6" />
      </Card>
    ))}
  </div>
);

/**
 * Skeleton para tabela
 */
const TableSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <Card className="overflow-hidden">
    {/* Header */}
    <div className="border-b border-gray-200 bg-gray-50 p-4">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonItem key={i} className="h-4" />
        ))}
      </div>
    </div>
    {/* Rows */}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <SkeletonItem key={j} className="h-4" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </Card>
);

/**
 * Skeleton para lista
 */
const ListSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="p-4 flex items-center gap-4">
        <SkeletonItem className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonItem className="h-4 w-1/3" />
          <SkeletonItem className="h-3 w-2/3" />
        </div>
      </Card>
    ))}
  </div>
);

/**
 * Componente principal LoadingSkeleton
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'text',
  count = 3,
  height = '200px',
  className = '',
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return <TextSkeleton count={count} />;
      case 'card':
        return <CardSkeleton count={count} />;
      case 'table':
        return <TableSkeleton count={count} />;
      case 'list':
        return <ListSkeleton count={count} />;
      case 'custom':
        return <SkeletonItem className={className} style={{ height }} />;
      default:
        return <TextSkeleton count={count} />;
    }
  };

  return <div className={type !== 'custom' ? className : ''}>{renderSkeleton()}</div>;
};

export default LoadingSkeleton;
