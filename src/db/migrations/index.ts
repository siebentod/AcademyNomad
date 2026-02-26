import { initDb, getDb } from '../index';
import { migration as addFileNameToHighlights } from './001-add-file-name-to-highlights';
import { migration as addCountersToFiles } from './002-add-counters-to-files';
import { migration as removeListIdFromHighlights } from './003-remove-list-id-from-highlights';
import { migration as createFileListsJunctionTable } from './004-create-file-lists-junction-table';
import { migration as linkHighlightsToFilesAndRemoveRedundantFields } from './005-link-highlights-to-files-and-remove-redundant-fields';
import { migration as movePinnedFieldsToFileLists } from './006-move-pinned-fields-to-file-lists';

const migrations = [
  addFileNameToHighlights,
  addCountersToFiles,
  removeListIdFromHighlights,
  createFileListsJunctionTable,
  linkHighlightsToFilesAndRemoveRedundantFields,
  movePinnedFieldsToFileLists,
];

export async function runMigrations() {
  try {
    await initDb();
    const db = getDb();
    
    console.log('Starting database migrations...');
    
    for (const migration of migrations) {
      console.log(`Running migration: ${migration.name}`);
      await migration.up(db);
      console.log(`Completed: ${migration.name}`);
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Экспортируем для удобства
export { migrateFromJsonToDb } from '../migrate';
