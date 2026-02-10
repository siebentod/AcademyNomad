import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'src/shared/ui/dialog';
import { Button } from 'src/shared/ui/button';
import { useModal } from './useModal';
import { useStore } from 'src/store';
import toast from 'react-hot-toast';
import type { List } from 'src/shared/types';

export default function RenameListModal() {
  const modal = useModal<List>('rename-list');
  const lists = useStore((state) => state.lists);
  const renameList = useStore((state) => state.renameList);
  const activeProject = useStore((state) => state.view.activeProject);
  const setActiveProject = useStore((state) => state.view.actions.setActiveProject);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newNameInput = form.newName as HTMLInputElement;
    const newListName = newNameInput?.value?.trim();

    if (!modal.value || !newListName) return;

    // Проверяем, что новое имя не пустое и не совпадает с существующим
    if (newListName === modal.value.name) {
      modal.close();
      return;
    }

    const existingList = lists.find((list) => list.name === newListName);
    if (existingList) {
      toast.error('Список с таким именем уже существует');
      return;
    }

    try {
      // Переименовываем список
      await renameList(modal.value.name, newListName);
      
      // Если переименованный список был активным, обновляем активный проект
      if (activeProject === modal.value.name) {
        setActiveProject(newListName);
      }
      
      toast.success(`Список "${modal.value.name}" переименован в "${newListName}"`);
      modal.close();
    } catch (error) {
      console.error('Ошибка переименования списка:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка переименования списка');
    }
  };

  return (
    <Dialog open={modal.isOpen} onOpenChange={(open) => !open && modal.close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Переименовать список</DialogTitle>
        </DialogHeader>
        {modal.value && (
          <>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                className="border border-gray-300 rounded-md w-full p-2 mb-2"
                name="newName"
                placeholder="Новое имя списка"
                defaultValue={modal.value.name}
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Текущее имя: <span className="font-mono">{modal.value.name}</span>
              </p>
              <div className="flex justify-center gap-2 pt-4">
                <Button type="submit">
                  Переименовать
                </Button>
                <Button
                  type="button"
                  onClick={modal.close}
                  variant="outline"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
