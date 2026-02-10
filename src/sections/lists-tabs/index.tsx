import { ProjectCreator } from './components/project-creator';
import { TabsList } from './components/tabs-list';
import { TabButton } from './components/tab-button';
import { useStore } from 'src/store';
import { useShallow } from 'zustand/shallow';
import { useListsContextMenu } from './hooks/useListsContextMenu';
import type { List } from 'src/shared/types';

function Tabs() {
  const activeProject = useStore((state) => state.view.activeProject);
  const { setActiveProject } = useStore(useShallow((state) => state.view.actions));

  const lists = useStore((state) => state.lists);
  const createList = useStore((state) => state.createList);
  const { showListContextMenu } = useListsContextMenu();

  const listsKeys = ['', ...lists.map((l: List) => l.name)];

  const tabs = listsKeys
    .sort((a, b) => {
      if (a === '') return -1;
      if (b === '') return 1;

      return a.localeCompare(b);
    })
    .map((project) => project);

  const createNewProject = async (projectName: string) => {
    if (!listsKeys.includes(projectName)) {
      createList(projectName, []);
    }

    setActiveProject(projectName);
  };

  const handleTabContextMenu = (tab: string) => {
    if (tab) { // Не показываем меню для пустой вкладки "All"
      const list = lists.find((l: List) => l.name === tab);
      if (list) {
        showListContextMenu({ list });
      }
    }
  };

  return (
    <div className="w-full bg-surface flex flex-col border border-border-dark">
      <div className="flex items-center">
        <ProjectCreator onCreate={createNewProject} tabsCount={tabs.length} />
        <TabsList
          tabs={tabs}
          renderTab={(tab) => (
            <TabButton
              key={tab}
              tab={tab}
              isActive={activeProject === tab}
              onClick={() => setActiveProject(tab)}
              onContextMenu={() => handleTabContextMenu(tab)}
            />
          )}
        />
      </div>
    </div>
  );
}

export default Tabs;
