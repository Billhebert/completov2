/**
 * DataTable Component
 * Componente de tabela de dados reutilizável
 */

import { TableColumn, TableAction } from '../../../../core/types';
import clsx from 'clsx';

export interface DataTableProps<T = unknown> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (record: T, index: number) => string;
  actions?: TableAction<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (record: T) => void;
}

/**
 * Componente de DataTable
 */
export function DataTable<T = unknown>({
  columns,
  data,
  keyExtractor,
  actions,
  isLoading = false,
  emptyMessage = 'Nenhum registro encontrado',
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">{emptyMessage}</div>
    );
  }

  return (
    <div className="data-table">
      <table className="w-full">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width }}
                className={clsx(
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right'
                )}
              >
                {column.label}
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="text-right">Ações</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((record, index) => (
            <tr
              key={keyExtractor(record, index)}
              onClick={() => onRowClick?.(record)}
              className={clsx(onRowClick && 'cursor-pointer')}
            >
              {columns.map((column) => {
                const value = (record as Record<string, unknown>)[column.key];
                return (
                  <td
                    key={column.key}
                    className={clsx(
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                  >
                    {column.render ? column.render(value, record) : String(value || '-')}
                  </td>
                );
              })}
              {actions && actions.length > 0 && (
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {actions.map((action, actionIndex) => {
                      // Verificar se a ação deve ser exibida
                      if (action.show && !action.show(record)) {
                        return null;
                      }

                      return (
                        <button
                          key={actionIndex}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(record);
                          }}
                          className={clsx(
                            'px-3 py-1 text-sm rounded-lg transition',
                            action.variant === 'primary' &&
                              'bg-blue-600 text-white hover:bg-blue-700',
                            action.variant === 'secondary' &&
                              'bg-gray-200 text-gray-700 hover:bg-gray-300',
                            action.variant === 'danger' &&
                              'bg-red-600 text-white hover:bg-red-700',
                            !action.variant &&
                              'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          )}
                          title={action.label}
                        >
                          {action.icon ? (
                            <span className="flex items-center gap-1">
                              {action.icon}
                              {action.label}
                            </span>
                          ) : (
                            action.label
                          )}
                        </button>
                      );
                    })}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
