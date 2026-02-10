// hooks/useModal.ts
import { useCallback } from 'react';
import { useModalStore } from 'src/store/modal';
import { useShallow } from 'zustand/shallow';

export const useModal = <T = any>(key: string) => {
  // Селектор для state (оптимизация)
  const { isOpen, value } = useModalStore(
    useShallow((state) => ({
      isOpen: !!state.modals[key],
      value: state.modalValues[key] as T | undefined,
    }))
  );

  // Actions берём отдельно (не вызывают ререндер)
  const openModal = useModalStore((state) => state.openModal);
  const closeModal = useModalStore((state) => state.closeModal);
  const toggleModal = useModalStore((state) => state.toggleModal);

  return {
    isOpen,
    value,
    open: useCallback((val?: T) => openModal(key, val), [key, openModal]),
    close: useCallback(() => closeModal(key), [key, closeModal]),
    toggle: useCallback(() => toggleModal(key), [key, toggleModal]),
  };
};
