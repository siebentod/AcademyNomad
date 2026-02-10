import Split from 'react-split';
import { Toaster } from 'react-hot-toast';
import BooksSection from 'src/sections/books-section';
import HighlightsSection from 'src/sections/highlights-section';
import { useStore } from 'src/store';
import ModalsContainer from 'src/sections/modals';
import Tabs from 'src/sections/lists-tabs';
import SearchPanel from 'src/sections/top-panel';

function App() {
  const areListsLoaded = useStore((state) => state.areListsLoaded);

  const activeMode = useStore((state) => state.view.activeMode);

  if (!areListsLoaded) return <div>Загрузка...</div>;

  return (
    <>
      <div className="mx-auto p-8 pt-2 relative">
        <SearchPanel />

        <div>
          <div className="overflow-x-auto">
            <Tabs />

            {activeMode === 'highlights' ? (
              <Split
                className="flex max-h-[77dvh] bg-surface"
                sizes={[50, 50]}
                minSize={200}
                gutterSize={8}
                direction="horizontal"
              >
                <BooksSection />
                <HighlightsSection />
              </Split>
            ) : (
              <BooksSection />
            )}
          </div>
        </div>
      </div>

      <ModalsContainer />

      <Toaster
        position="top-center"
        gutter={12}
        containerStyle={{ margin: '8px' }}
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: '14px',
            maxWidth: '500px',
            padding: '4px 8px',
            backgroundColor: '#005AE1',
            color: 'white',
          },
        }}
      />
    </>
  );
}

function AppWithProviders() {
  return <App />;
}

export default AppWithProviders;
