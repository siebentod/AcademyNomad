import SettingsModal from './settings-modal';
import ExcludeModal from './exclude-modal';
import ConfirmModal from './confirm-modal';
import RenameModal from './rename-modal';
import RenameListModal from './rename-list-modal';

export default function ModalsContainer() {
  return (
    <>
      <SettingsModal />
      <ExcludeModal />
      <ConfirmModal />
      <RenameModal />
      <RenameListModal />
    </>
  );
}
