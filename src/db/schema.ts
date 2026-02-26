import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';

export const lists = sqliteTable('lists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const files = sqliteTable('files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pdf_id: text('pdf_id'),
  created_date: text('created_date'),
  date_added: text('date_added'),
  extension: text('extension'),
  file_name: text('file_name'),
  full_path: text('full_path'),
  highlights_count: integer('highlights_count').default(0),
  annotations_count: integer('annotations_count').default(0),
  is_locked: integer('is_locked', { mode: 'boolean' }).default(false),
  modified_date: text('modified_date'),
  pdf_author: text('pdf_author'),
  pdf_creator: text('pdf_creator'),
  pdf_title: text('pdf_title'),
  size: integer('size'),
  title: text('title'),
});

// Связующая таблица для отношений многие-ко-многим
export const fileLists = sqliteTable('file_lists', {
  file_id: integer('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  list_id: integer('list_id').notNull().references(() => lists.id, { onDelete: 'cascade' }),
  date_added: text('date_added').default(new Date().toISOString()),
  is_pinned: integer('is_pinned', { mode: 'boolean' }).default(false),
  pinned_order: integer('pinned_order').default(0),
}, (table) => ({
  pk: primaryKey({ columns: [table.file_id, table.list_id] })
}));

export const highlights = sqliteTable('highlights', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  file_id: integer('file_id').references(() => files.id, { onDelete: 'cascade' }),
  annotation_text: text('annotation_text'),
  color_r: real('color_r'),
  color_g: real('color_g'),
  color_b: real('color_b'),
  date: text('date'),
  highlight_type: text('highlight_type'),
  highlighted_text: text('highlighted_text'),
  page: integer('page'),
});