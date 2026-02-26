import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'src/shared/ui/dialog';
import { Button } from 'src/shared/ui/button';
import type { Settings as SettingsType } from 'src/shared/types';
import { useModal } from './useModal';
import { useStore } from 'src/store';

export default function SettingsModal() {
  const modal = useModal('settings');
  const saveSettings = useStore((state) => state.saveSettings);
  const settings = useStore((state) => state.settings);
  const [tempSettings, setTempSettings] = useState<SettingsType>(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  const handleInputChange = (key: string, value: any) => {
    setTempSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveSettings(tempSettings);
    modal.close();
  };

  const handleClose = () => {
    modal.close();
  };

  return (
    <Dialog open={modal.isOpen} onOpenChange={(open) => !open && modal.close()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-medium">Типы</h4>
                </div>
                <input
                  type="text"
                  className="px-3 py-2 rounded-md border border-input bg-background text-foreground min-w-[200px] outline-none cursor-default select-none"
                  value={tempSettings.types?.join(',')}
                  readOnly
                  tabIndex={-1}
                  onFocus={(e) => e.target.blur()}
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-medium">
                    Путь к читалке PDF
                  </h4>
                </div>
                <input
                  type="text"
                  className="px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-w-[300px] flex-1 max-w-md"
                  value={tempSettings.pdfReaderPath || ''}
                  onChange={(e) => handleInputChange('pdfReaderPath', e.target.value)}
                  placeholder="C:\Program Files\..."
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                Пример: C:\Program Files\Tracker Software\PDF Editor\PDFXEdit.exe
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 pt-4 border-t border-border">
          <Button type="button" onClick={handleSave}>
            Сохранить
          </Button>
          <Button type="button" onClick={handleClose} variant="outline">
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}