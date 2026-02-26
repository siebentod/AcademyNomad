import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Highlight } from 'src/shared/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function parsePDFDate(pdfDate: string) {
  if (!pdfDate) return 0;
  // Извлекаем компоненты: D:YYYYMMDDHHmmss
  const match = pdfDate.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!match) return 0;

  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  return new Date(year, month - 1, day, hour, minute, second).getTime();
}

export function parseISODate(isoString: string): number {
  if (!isoString) return 0;
  const date = new Date(isoString);
  return date.getTime();
}

export function getDateKey(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function getFileName(filePath: string): string {
  if (!filePath) return '';
  
  // Разделяем путь по обратным слешам и берем последний элемент
  const fileNameWithExt = filePath.split('\\').pop() || filePath.split('/').pop() || '';
  
  // Находим последнюю точку и отсекаем расширение
  const lastDotIndex = fileNameWithExt.lastIndexOf('.');
  
  // Если точка найдена и это не начало файла, отсекаем расширение
  if (lastDotIndex > 0) {
    return fileNameWithExt.substring(0, lastDotIndex);
  }
  
  // Если расширение не найдено, возвращаем все имя файла
  return fileNameWithExt;
}

export function processDateToEverythingQuery(isoString: string): string {
  const date = new Date(isoString);

  // Добавляем 3 часа к UTC времени
  date.setUTCHours(date.getUTCHours() + 3);

  // Получаем компоненты даты и времени в формате UTC после добавления 3 часов
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export function convertHighlightsToDB(highlights: Highlight[]) {
  return highlights.map(highlight => {
    const { color, ...highlightWithoutColor } = highlight;
    
    return {
      ...highlightWithoutColor,
      ...(color && {
        color_r: color[0],
        color_g: color[1],
        color_b: color[2]
      })
    };
  });
}

export function convertHighlightsToArray(highlights: Highlight[]) {
  return highlights.map(highlight => {
    const { color_r, color_g, color_b, ...highlightWithoutColor } = highlight;
    
    return {
      ...highlightWithoutColor,
      color: (color_r !== undefined && color_g !== undefined && color_b !== undefined) 
        ? [color_r, color_g, color_b] as [number, number, number]
        : undefined
    };
  });
}

export function countHighlightsAndAnnotations(highlights: Highlight[]): [number, number] {
  if (!highlights || !Array.isArray(highlights)) {
    return [0, 0];
  }
  
  const highlightsCount = highlights.length;
  const annotationsCount = highlights.filter(
    (highlight: Highlight) =>
      highlight.annotation_text &&
      highlight.annotation_text.trim() !== ''
  ).length;
  
  return [highlightsCount, annotationsCount];
}