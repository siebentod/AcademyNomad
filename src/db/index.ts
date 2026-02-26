import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function initDb(): Promise<Database> {
  if (db) return db;
  
  db = await Database.load('sqlite:lists.db');
  
  // Создаем таблицы
  await createTables(db);
  
  return db;
}

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

async function createTables(db: Database) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pdf_id TEXT,
      created_date TEXT,
      date_added TEXT,
      extension TEXT,
      file_name TEXT,
      full_path TEXT,
      highlights_count INTEGER DEFAULT 0,
      annotations_count INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      modified_date TEXT,
      pdf_author TEXT,
      pdf_creator TEXT,
      pdf_title TEXT,
      size INTEGER,
      title TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS file_lists (
      file_id INTEGER NOT NULL,
      list_id INTEGER NOT NULL,
      date_added TEXT DEFAULT CURRENT_TIMESTAMP,
      is_pinned INTEGER DEFAULT 0,
      pinned_order INTEGER DEFAULT 0,
      PRIMARY KEY (file_id, list_id),
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER,
      annotation_text TEXT,
      color_r REAL,
      color_g REAL,
      color_b REAL,
      date TEXT,
      highlight_type TEXT,
      highlighted_text TEXT,
      page INTEGER,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_file_lists_file_id ON file_lists(file_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_file_lists_list_id ON file_lists(list_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_highlights_file_id ON highlights(file_id)`);
}