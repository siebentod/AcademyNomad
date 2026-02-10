import { useStore } from 'src/store';
import { useShallow } from 'zustand/shallow';
import { useModal } from 'src/sections/modals/useModal';
import Input from 'src/shared/ui/Input';

import Checkbox from './components/search-checkbox';
import SearchForm from './components/search-form';
import SearchButton from './components/search-button';
import SettingsButton from './components/settings-button';
import ExcludeButton from './components/exclude-button';
import { useSearch } from './hooks/useSearch';
import { useState } from 'react';

export default function SearchPanel() {
  const [innerSearchQuery, setInnerSearchQuery] = useState('');
  const activeProject = useStore((state) => state.view.activeProject);
  const activeMode = useStore((state) => state.view.activeMode);
  const { setActiveMode } = useStore(useShallow((state) => state.view.actions));
  const { setSearchQuery } = useSearch(activeProject, activeMode);
  const excludeModal = useModal('exclude');
  const settingsModal = useModal('settings');

  return (
    <>
      <SearchForm
        onSubmit={(e) => {
          e.preventDefault();
          setSearchQuery(innerSearchQuery);
        }}
      >
        <Input
          placeholder="Search..."
          value={innerSearchQuery}
          onChange={(e) => setInnerSearchQuery(e.target.value)}
          onClear={() => {
            setInnerSearchQuery('');
            setSearchQuery('');
          }}
          className="text-sm w-full px-4 py-1.5 h-6 bg-gray-100 rounded-lg
          border-none
          focus:outline-none focus:bg-white
          shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]
          text-black"
        />
        <SearchButton onClick={() => setSearchQuery(innerSearchQuery)} />
        <ExcludeButton onClick={() => excludeModal.open()} />
        <Checkbox
          checked={activeMode === 'highlights'}
          onChange={(checked) =>
            setActiveMode(checked ? 'highlights' : 'no-highlights')
          }
          className=""
        />
        <SettingsButton onClick={() => settingsModal.open()} />
      </SearchForm>
    </>
  );
}
