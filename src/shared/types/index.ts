// Общие типы для приложения

export interface Highlight {
  id?: number;
  annotation_text?: string;
  color?: [number, number, number];
  color_r?: number;
  color_g?: number;
  color_b?: number;
  date?: string;
  file_name?: string;
  highlight_type?: string;
  highlighted_text?: string;
  page?: number;
  file_path?: string;
  title?: string;
  file_id?: number;
}

export interface File {
  id?: number;
  pdf_id?: string;
  file_name: string;
  full_path: string;
  title: string;
  extension: string;
  status?: string;
  modified_date?: string;
  created_date?: string;
  pdf_creator?: string;
  size?: number;
  is_locked?: boolean;
  highlights?: Highlight[];
  new_numbers?: boolean;
  highlights_count?: number;
  annotations_count?: number;
  is_in_lists?: boolean;
  isMissing?: boolean;
  is_pinned?: boolean;
  pinned_order?: number | null;
  [key: string]: unknown; // ?
}

export interface FileResult {
  file_name: string;
  full_path: string;
  title: string;
  size?: number;
  created_date: string;
  modified_date: string;
  extension?: string;
  is_locked: boolean;
  id?: number;
  pdf_id?: string;
  pdf_title?: string;
  pdf_author?: string;
  pdf_creator?: string;
  highlights?: Highlight[];
}

export interface ExcludedListItem {
  file_name?: string;
  path?: string;
  date_added: string;
}

export interface ListItem extends File {
  date_added: string;
  is_pinned?: boolean;
  pinned_order?: number | null;
  highlights?: Highlight[];
  in_list?: number;
}

export interface List {
  name: string;
  items: ListItem[];
  id?: number;
}

export type Lists = List[];

export interface Settings {
  types: string[];
  excludedList: ExcludedListItem[];
  pdfReaderPath: string;
  [key: string]: any;
}
