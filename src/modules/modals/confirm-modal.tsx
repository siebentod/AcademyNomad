import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'src/shared/ui/dialog';
import { Button } from 'src/shared/ui/button';
import { useModal } from './useModal';

export default function ConfirmModal() {
  const modal = useModal('delete');
  const title = modal.value?.title || "Подтверждение";
  const message = modal.value?.message || "Вы уверены, что хотите удалить этот элемент?";
  const confirmText = modal.value?.confirmText || "Удалить";
  const cancelText = modal.value?.cancelText || "Отмена";

  const handleClose = () => {
    modal.close();
  };

  const handleConfirm = () => {
    // Логика удаления
    // const baseName = modal.value?.name;
    // if (!baseName) return;
    // deleteTranslation(baseName);
    handleClose();
  };

  return (
    <Dialog open={modal.isOpen} onOpenChange={(open) => !open && modal.close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="mx-auto text-center max-w-100">
          {message}
        </p>
        <div className="flex justify-center mt-4 gap-2">
          <Button onClick={handleConfirm}>
            {confirmText}
          </Button>
          <Button onClick={handleClose} variant="outline">
            {cancelText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}