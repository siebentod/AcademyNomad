import { create } from 'zustand';
import { ModalStore } from './types';

export type { ModalStore } from './types';

const initialState = {
  modals: {},
  modalValues: {},
};

export const useModalStore = create<ModalStore>((set, get) => ({
  ...initialState,

  openModal: (name: string, value?: any) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [name]: true,
      },
      modalValues: {
        ...state.modalValues,
        [name]: value,
      },
    }));
  },

  closeModal: (name: string) => {
    set((state) => {
      const { [name]: _, ...remainingModals } = state.modals;
      const { [name]: __, ...remainingValues } = state.modalValues;
      return {
        modals: remainingModals,
        modalValues: remainingValues,
      };
    });
  },

  toggleModal: (name: string) => {
    const isCurrentlyOpen = get().modals[name];
    if (isCurrentlyOpen) {
      // Закрываем модалку
      set((state) => {
        const { [name]: _, ...remainingModals } = state.modals;
        const { [name]: __, ...remainingValues } = state.modalValues;
        return {
          modals: remainingModals,
          modalValues: remainingValues,
        };
      });
    } else {
      // Открываем модалку
      set((state) => ({
        modals: {
          ...state.modals,
          [name]: true,
        },
      }));
    }
  },
}));
