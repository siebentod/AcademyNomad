import { Menu } from '@tauri-apps/api/menu';
import toast from 'react-hot-toast';
import { useModal } from 'src/sections/modals/useModal';
import type { List } from 'src/shared/types';
import { useStore } from 'src/store';

interface ContextMenuItem {
  id: string;
  text: string;
  showCondition: boolean;
  action: () => Promise<void>;
}

const confirm = async (message: string): Promise<boolean> => {
  return window.confirm(message);
};

export const useListsContextMenu = () => {
  const removeList = useStore((state) => state.removeList);
  const renameModal = useModal<List>('rename-list');
  const activeProject = useStore((state) => state.view.activeProject);
  const setActiveProject = useStore((state) => state.view.actions.setActiveProject);

  const showListContextMenu = async ({ list }: { list: List }) => {
    const menuItems: ContextMenuItem[] = [
      {
        id: 'rename_list',
        text: 'Переименовать',
        showCondition: true,
        action: async () => {
          renameModal.open(list);
        },
      },
      {
        id: 'delete_list',
        text: 'Удалить',
        showCondition: true,
        action: async () => {
          try {
            const confirmed = await confirm(
              `Вы уверены, что хотите удалить список "${list.name}"? Действие необратимо.`
            );
            if (confirmed) {
              removeList(list.name);
              
              // Если удаляемый список был активным, переключаемся на "All"
              if (activeProject === list.name) {
                setActiveProject('');
              }
              
              toast.success(`Список "${list.name}" удален`);
            }
          } catch (error) {
            console.error('Ошибка удаления списка:', error);
            toast.error('Ошибка при удалении списка');
          }
        },
      },
    ];

    try {
      const menu = await Menu.new({
        items: menuItems.filter((item) => item.showCondition !== false),
      });

      await menu.popup();
    } catch (error) {
      console.error('Ошибка создания контекстного меню:', error);
    }
  };

  return { showListContextMenu };
};
