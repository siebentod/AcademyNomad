import { useState, useMemo } from 'react';
import type { File } from 'src/shared/types';

export const useTableSort = (files: File[], defaultSort: string | null, activeProject: string | null) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  console.log('files', files);

  const sortedFiles = useMemo(() => {
    const sort = defaultSort || sortColumn;

    return [...files].sort((a, b) => {
      // Сначала сортируем по is_pinned (true вверху) только если есть activeProject
      if (activeProject) {
        const aPinned = a.is_pinned || false;
        const bPinned = b.is_pinned || false;

        if (aPinned !== bPinned) {
          return aPinned ? -1 : 1;
        }

        // Затем по pinned_order (от меньшего к большему) только если есть activeProject
        const aOrder = a.pinned_order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.pinned_order ?? Number.MAX_SAFE_INTEGER;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
      }

      // Если сортировка не указана, возвращаем файлы как есть
      if (!sort) {
        return 0;
      }

      // Обычная сортировка по выбранному полю
      let valA = a[sort as keyof File];
      let valB = b[sort as keyof File];

      valA =
        valA === null || valA === undefined
          ? ''
          : Array.isArray(valA)
          ? valA.join(', ').toLowerCase()
          : String(valA).toLowerCase();
      valB =
        valB === null || valB === undefined
          ? ''
          : Array.isArray(valB)
          ? valB.join(', ').toLowerCase()
          : String(valB).toLowerCase();

      if (valA < valB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [files, sortColumn, sortDirection, defaultSort, activeProject]);

  const getSortIcon = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? '▲' : '▼';
    }
    if (!sortColumn && column === 'modified_date') return '▼';
    return '';
  };

  const handleSort = (column: string) => {
    setSortColumn((prevColumn) => {
      if (prevColumn === column) {
        setSortDirection((prevDirection) =>
          prevDirection === 'asc' ? 'desc' : 'asc'
        );
        return prevColumn;
      } else {
        setSortDirection('asc');
        return column;
      }
    });
  };

  return {
    sortColumn,
    sortDirection,
    sortedFiles,
    getSortIcon,
    handleSort,
  };
};
