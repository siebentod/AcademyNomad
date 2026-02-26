import { Menu, Submenu } from '@tauri-apps/api/menu';
import { invoke } from '@tauri-apps/api/core';
import toast from 'react-hot-toast';

// import {
//   selectTypesQuery,
//   selectExcludedQuery,
// } from 'src/store/settings/settingsSelectors';
import type { File, List, ListItem } from 'src/shared/types';
import { useStore } from 'src/store';
import { useModal } from 'src/modules/modals/useModal';
import { tryToFindFile } from 'src/shared/lib/everything';
import { FilesDB } from 'src/db/FilesDB';

interface ContextMenuItem {
  id: string;
  text: string;
  showCondition: boolean;
  action: () => Promise<void>;
}

type MenuItem = ContextMenuItem | Submenu;

// async function searchFileByField(file: File, field: string): Promise<any> {
//   const query = `${typesQuery} ${excludedQuery}`;
//   const resultArr = (await invoke('get_everything', {
//     params: { query },
//   })) as any[];
//   const result = resultArr.find((f) => f[field] === file[field]);
//   return result;
// }

const confirm = async (message: string): Promise<boolean> => {
  return window.confirm(message);
};

export const useTableRowsContextMenu = () => {
  const lists = useStore((state) => state.lists);
  const renameModal = useModal<File>('rename');
  // const typesQuery = useStore(selectTypesQuery);
  // const excludedQuery = useStore(selectExcludedQuery);
  const addToExcluded = useStore((state) => state.addToExcluded);
  const addToExcludedPath = useStore((state) => state.addToExcludedPath);
  const updateFileWithHighlights = useStore(
    (state) => state.updateFileWithHighlights
  );
  const removeFile = useStore((state) => state.removeFile);
  const pinItem = useStore((state) => state.pinItem);
  const unpinItem = useStore((state) => state.unpinItem);
  const removeFromList = useStore((state) => state.removeFromList);
  const addToList = useStore((state) => state.addToList);

  const showFileContextMenu = async ({
    file,
    activeListName,
  }: {
    file: File;
    activeListName: string | null;
  }) => {
    const listsKeys: string[] = lists.map((l: List) => l.name);
    const is_pinned = file.is_pinned || false;

    const listsSubmenu: Submenu = await Submenu.new({
      text: 'Добавить в список',
      items: listsKeys.map((list: string) => ({
        id: list,
        text: list,
        action: async () => {
          try {
            const result = await invoke('set_metadata', {
              filePath: file.full_path,
            });
            if (result) {
              addToList({
                listName: list as string,
                itemData: { ...file, pdf_creator: result as string },
              });
              toast.success(`Файл добавлен в список ${list}`);
            } else {
              toast.error('Ошибка добавления файла в список');
            }
          } catch (error) {
            console.error('Ошибка добавления файла в список:', error);
            toast.error(`Ошибка добавления файла в список: ${error}`);
          }
        },
      })),
    });

    const allItems: MenuItem[] = [
      {
        id: 'show_in_explorer',
        text: 'Показать в проводнике',
        showCondition: true,
        action: async () => {
          try {
            await invoke('show_in_explorer', { path: file.full_path });
          } catch (error) {
            console.error('Ошибка показа в проводнике:', error);
          }
        },
      },
      {
        id: 'delete_file',
        text: 'Удалить файл',
        showCondition: true,
        action: async () => {
          try {
            const confirmed = await confirm(
              'Вы уверены, что хотите удалить этот файл?'
            );
            if (confirmed) {
              await invoke('delete_file', { path: file.full_path });
              removeFile(file.full_path);
            }
          } catch (error) {
            console.error('Ошибка удаления файла:', error);
          }
        },
      },
      {
        id: 'open_with',
        text: 'Скрыть',
        showCondition: !activeListName,
        action: async () => {
          try {
            addToExcluded(file);
          } catch (error) {
            console.error('Ошибка открытия файла:', error);
          }
        },
      },
      {
        id: 'hide_folder',
        text: 'Скрыть папку',
        showCondition: !activeListName,
        action: async () => {
          try {
            const folderPath = file.full_path
              .split('\\')
              .slice(0, -1)
              .join('\\');
            addToExcludedPath(folderPath);
            toast.success(`Папка успешно скрыта`);
          } catch (error) {
            console.error('Ошибка открытия файла:', error);
            toast.error(`Ошибка при скрытии папки: ${error}`);
          }
        },
      },
      {
        id: 'meta',
        text: 'Set Metadata',
        showCondition: true,
        action: async () => {
          try {
            const result = await invoke('set_metadata', {
              filePath: file.full_path,
            });
            if (result) {
              toast.success(`Метаданные обновлены`);
            } else {
              toast.error('Ошибка обновления метаданных');
            }
          } catch (error) {
            console.error('Ошибка открытия файла:', error);
            toast.error(`Ошибка открытия файла: ${error}`);
          }
        },
      },
      {
        id: 'Попытаться найти файл',
        text: 'Попытаться найти файл',
        showCondition: true,
        action: async () => {
          try {
            const updatedFile = await tryToFindFile(file);
            if (!updatedFile?.title) {
              toast.error('Файл не найден');
              return;
            }
            const highlights = updatedFile?.highlights || [];
            updateFileWithHighlights(updatedFile, highlights);
            toast.success('Путь успешно обновлен.');
          } catch (error) {
            toast.error('Ошибка поиска.');
            console.error('Ошибка поиска:', error);
          }
        },
      },
      {
        id: 'rename_file',
        text: 'Переименовать',
        showCondition: true,
        action: async () => {
          renameModal.open(file);
        },
      },
      {
        id: 'Удалить из списка',
        text: 'Удалить из списка',
        showCondition: !!activeListName,
        action: async () => {
          try {
            removeFromList({
              listName: activeListName!,
              fileId: file.id!,
            });
          } catch (error) {
            console.error('Ошибка открытия файла:', error);
          }
        },
      },
      {
        id: 'pin_item',
        text: is_pinned ? 'Открепить' : 'Закрепить',
        showCondition: !!activeListName,
        action: async () => {
          try {
            if (is_pinned) {
              unpinItem({
                listName: activeListName!,
                fileId: file.id!,
              });
              toast.success('Файл откреплен');
            } else {
              pinItem({
                listName: activeListName!,
                fileId: file.id!,
              });
            }
          } catch (error) {
            console.error('Ошибка закрепления/открепления файла:', error);
            toast.error('Ошибка при изменении закрепления');
          }
        },
      },
      listsSubmenu,
    ];

    try {
      const menu = await Menu.new({
        items: [
          ...allItems.filter(
            (item): item is ContextMenuItem =>
              'showCondition' in item && item.showCondition !== false
          ),
          listsSubmenu,
        ],
      });

      await menu.popup();
    } catch (error) {
      console.error('Ошибка создания контекстного меню:', error);
    }
  };

  return { showFileContextMenu };
};
