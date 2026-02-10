import { LazyStore } from '@tauri-apps/plugin-store';
import type { Settings } from 'src/shared/types';
import type { Store } from '../types';

const storeFile = new LazyStore('settings.json');

const defaultSettings: Settings = {
  types: ['pdf', 'djvu'],
  excludedList: [],
  pdfReaderPath: '',
};

export const createPrivateSlice = (
  set: any,
  get: () => Store
) => ({
  _setSetting: async (key: string, value: unknown) => {
    set((state: any) => ({
      settings: { ...state.settings, [key]: value },
    }));

    await get()._writeSetting(key, value);
  },

  _setSettings: async (settings: Settings) => {
    set({ settings });
    await get()._writeSettings(settings);
  },
  
  _loadSettings: async () => {
    try {
      const entries = await storeFile.entries();
      const loadedSettings = Object.fromEntries(entries) as Settings;
      const mergedSettings = { ...defaultSettings, ...loadedSettings };
      set({ settings: mergedSettings });
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      set({ settings: defaultSettings });
    }
  },

  _writeSetting: async (key: string, value: unknown) => {
    try {
      await storeFile.set(key, value);
      await storeFile.save();
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      throw error;
    }
  },

  _writeSettings: async (settings: Settings) => {
    try {
      // Сохраняем все настройки через Promise.all
      await Promise.all(
        Object.entries(settings).map(([key, value]) => storeFile.set(key, value))
      );
      await storeFile.save();
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      throw error;
    }
  },
});
