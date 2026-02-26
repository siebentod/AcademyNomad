import { cn } from 'src/shared/lib/cn';
import { formatDate, parseISODate } from 'src/shared/lib/utils';
import { useDragNDrop } from '../hooks/use-drag-n-drop';
import Spinner from 'src/shared/ui/Spinner';
import type { File } from 'src/shared/types';
import type { Highlight } from '../types';

interface TableRowProps {
  fullTableMode: boolean;
  file: File;
  areFilesLoading: boolean;
  onContextMenu: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onRowClick: (e: React.MouseEvent) => void;
  onSearchFile?: (file: File) => void;
  COLUMNS: { key: string; label: string }[];
  lastElementRef?: React.RefObject<HTMLTableRowElement | null>;
}

const TableRow = ({
  fullTableMode,
  file,
  areFilesLoading,
  onContextMenu,
  onRowClick,
  onSearchFile,
  COLUMNS,
  lastElementRef,
}: TableRowProps) => {
  const { handleDragStart, handleDragEnd } = useDragNDrop();
  return (
    <tr
      ref={lastElementRef}
      draggable
      onDragStart={(e) => handleDragStart(e, file)}
      onDragEnd={handleDragEnd}
      className={cn(
        'transition duration-150 ease-in-out cursor-pointer',
        file.is_in_lists && 'bg-dark-green',
        file.isMissing && 'bg-dark-red'
      )}
      onClick={(e) => onRowClick(e)}
      data-file-title={file.title}
      title={file.full_path}
      onContextMenu={onContextMenu}
    >
      {COLUMNS.map((col) => (
        <td
          key={col.key}
          className={cn(
            'py-1 px-1 text-sm text-text-primary truncate',
            col.key === 'title' && 'max-w-96'
          )}
        >
          {col.key === 'status' ? (
            <>
              {file.is_pinned ? '⭐' : ''}
              {file.is_locked ? '🔒' : ''}
              {file.extension !== 'pdf' && file.extension}
              {areFilesLoading ? <Spinner size="xs" inline /> : ''}
              {!file.new_numbers ? (
                <span className="text-blue-500">{file.highlights_count}</span>
              ) : (
                file.highlights_count
              )}
              <span className="text-red-400">
                {file.annotations_count || ''}
              </span>
              {!fullTableMode &&
                !areFilesLoading && !file.new_numbers &&
                onSearchFile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSearchFile(file);
                    }}
                    className="ml-1 text-blue-400 hover:text-blue-500"
                    title="Поиск файла"
                  >
                    🔍
                  </button>
                )}
            </>
          ) : col.key === 'modified_date' ? (
            formatDate(parseISODate(file.modified_date || ''))
          ) : (
            <span>{String(file[col.key as keyof typeof file] || '')}</span>
          )}
        </td>
      ))}
    </tr>
  );
};

export default TableRow;
