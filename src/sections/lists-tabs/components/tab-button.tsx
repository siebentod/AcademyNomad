import { invoke } from '@tauri-apps/api/core';
import toast from 'react-hot-toast';
import type { File } from 'src/shared/types';
import { useStore } from 'src/store';
import {
  searchFileByQuery,
  buildIncludeQuery,
} from 'src/shared/lib/searchUtils';
import {
  selectTypesQuery,
  selectExcludedQuery,
} from 'src/store/settings/settingsSelectors';

interface TabButtonProps {
  tab: string;
  isActive: boolean;
  onClick: () => void;
  onContextMenu?: () => void;
}

export function TabButton({
  tab,
  isActive,
  onClick,
  onContextMenu,
}: TabButtonProps) {
  const addToList = useStore((state) => state.addToList);
  const typesQuery = useStore(selectTypesQuery);
  const excludedQuery = useStore(selectExcludedQuery);

  const onDropToTab = async (fileData: File, tab: string) => {
    try {
      console.log('fileData', fileData);
      const result = await invoke('set_metadata', {
        filePath: fileData.full_path,
      });
      if (result) {
        addToList({
          listName: tab,
          itemData: { ...fileData, pdf_creator: result as string },
        });
        toast.success(`Файл добавлен в список ${tab}`);
      } else {
        addToList({
          listName: tab,
          itemData: { ...fileData, pdf_creator: `error-${Date.now()}` },
        });

        toast.error(
          'Файл добавлен в проект только по имени из-за невозможности редактирования (скорее всего, файл открыт)',
          {
            duration: 5000,
          }
        );
      }
    } catch (error) {
      console.error('Ошибка добавления файла в список:', error);
      toast.error(`Ошибка добавления файла в список: ${error}`);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    // Убираем подсветку только если курсор действительно покинул элемент
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      e.currentTarget.classList.remove('drag-over');
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const tabName = e.currentTarget.getAttribute('data-project-tab');
    if (tabName) {
      // Сначала пробуем получить данные из внутреннего перетаскивания
      const dragData = e.dataTransfer.getData('text/plain');
      if (dragData) {
        if (isActive) return;
        console.log('Internal drag data found:', dragData);
        const fileData = JSON.parse(dragData) as File;
        console.log('fileData', fileData);
        onDropToTab(fileData, tabName);
        return;
      }

      if (e.dataTransfer.items) {
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          const item = e.dataTransfer.items[i];

          if (item.kind === 'file') {
            const file = item.getAsFile();
            const fileName = file?.name;
            if (fileName) {
              const includeQuery = buildIncludeQuery([fileName]);
              const query =
                `${typesQuery} ${excludedQuery} ${includeQuery}`.trim();

              const result = await searchFileByQuery(query);
              if (result?.items) {
                if (result.items.length === 0) {
                  toast.error('Файл не найден');
                } else {
                  onDropToTab(result.items[0], tabName);
                  if (result.has_more) {
                    toast.error('Найдено несколько файлов с таким названием');
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      data-project-tab={tab}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`py-2 px-4 text-sm font-medium text-center transition-colors duration-150 ease-in-out
        ${
          isActive
            ? 'border-b-2 border-[rgb(236,115,121)] text-[rgb(236,115,121)]'
            : 'text-text-secondary hover:text-gray-400'
        }
      `}
    >
      {tab || 'All'}
    </button>
  );
}
