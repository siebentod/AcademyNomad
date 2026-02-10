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
import { invoke } from '@tauri-apps/api/core';
import toast from 'react-hot-toast';

export default function RenameModal() {
  const modal = useModal('rename');
  const updateFileInAllLists = useStore((state) => state.updateFileInAllLists);
  const replaceFileByField = useStore((state) => state.replaceFileByField);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newNameInput = form.newName as HTMLInputElement;
    const inputFileName = newNameInput?.value;

    if (!modal.value || !inputFileName) return;

    try {
      const newFileName = `${inputFileName}.${modal.value.extension}`;

      const newPath = await invoke('edit_filename', {
        originalFullPath: modal.value.full_path,
        newFilename: newFileName,
      }) as string;

      if (newPath) {
        const updatedFile = {
          ...modal.value,
          file_name: newFileName,
          full_path: newPath,
          title: inputFileName,
        };

        updateFileInAllLists({ file: updatedFile, field: 'id' });
        replaceFileByField({ file: updatedFile, field: 'id' });
        toast.success('Файл успешно переименован');
      } else {
        toast.error('Ошибка переименования файла');
      }

      modal.close();
    } catch (error) {
      console.error('Ошибка переименования файла:', error);
      toast.error('Ошибка переименования файла');
    }
  };

  return (
    <Dialog open={modal.isOpen} onOpenChange={(open) => !open && modal.close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Переименовать файл</DialogTitle>
        </DialogHeader>
        {modal.value && (
          <>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                className="border border-gray-300 rounded-md w-full p-2 mb-2"
                name="newName"
                placeholder="Новое имя файла"
                defaultValue={modal.value.title}
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Текущее имя: <span className="font-mono">{modal.value.title}</span>
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