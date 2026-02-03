import React from 'react';
import type { TableHeaderProps, TableColumn } from '../types';
import { cn } from 'src/shared/lib/cn';

const TableHeader: React.FC<TableHeaderProps> = ({
  columns,
  onSort,
  getSortIcon,
}) => {
  return (
    <thead className="bg-gray-100">
      <tr className="text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
        {columns.map((col: TableColumn) => (
          <th
            key={col.key}
            className={cn("py-2 px-1 border-b border-gray-200 transition duration-150 whitespace-nowrap", col.sortable && "cursor-pointer hover:bg-gray-200")}
            onClick={() => onSort(col.key)}
          >
            {col.label} {getSortIcon(col.key)}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default TableHeader;
