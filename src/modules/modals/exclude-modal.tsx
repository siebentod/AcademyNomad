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

export default function ExcludeModal() {
  const modal = useModal('exclude');
  const excludedList = useStore((state) => state.settings.excludedList);
  const removeFromExcluded = useStore((state) => state.removeFromExcluded);
  const addToExcludedPath = useStore((state) => state.addToExcludedPath);

  const handleClose = () => {
    modal.close();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const pathInput = form.path as HTMLInputElement;
    const path = pathInput?.value;

    if (path) {
      try {
        addToExcludedPath(path);
        handleClose();
      } catch (error) {
        console.error('Ошибка открытия файла:', error);
      }
    }
  };

  return (
    <Dialog open={modal.isOpen} onOpenChange={(open) => !open && modal.close()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Исключить путь</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <p className="text-center text-sm text-muted-foreground mb-4">
            Введите путь
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              name="path"
              placeholder="C:\путь\к\папке"
            />
            <div className="flex justify-center gap-2">
              <Button type="submit">Добавить</Button>
              <Button type="button" onClick={handleClose} variant="outline">
                Закрыть
              </Button>
            </div>
          </form>

          {excludedList.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">
                Исключенные пути ({excludedList.length}):
              </h3>
              <div className="max-h-[300px] overflow-y-auto rounded-md border border-border scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                <div className="space-y-1.5 p-2">
                  {excludedList.map((item: any, index: number) => (
                    <div
                      key={`${item.path || item.file_name}-${index}`}
                      className="flex items-center justify-between gap-2 bg-card rounded-md px-3 py-0.5 border border-border/50 hover:border-border transition-colors"
                    >
                      <span
                        className="text-xs font-mono flex-1 truncate min-w-0"
                        title={item.path || item.file_name}
                      >
                        {item.path || item.file_name}
                      </span>
                      <button
                        onClick={() => {
                          const identifier = item.path || item.file_name;
                          if (identifier) {
                            removeFromExcluded(identifier);
                          }
                        }}
                        className="flex-shrink-0 text-destructive hover:text-destructive/80 text-sm font-bold hover:bg-destructive/10 rounded px-2 py-1 transition-colors"
                        title="Удалить"
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
