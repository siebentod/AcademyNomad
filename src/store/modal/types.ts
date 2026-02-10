export interface ModalState {
  modals: Record<string, boolean>;
  modalValues: Record<string, any>;
}

export interface ModalStore extends ModalState {
  // Actions
  openModal: (name: string, value?: any) => void;
  closeModal: (name: string) => void;
  toggleModal: (name: string) => void;
}
