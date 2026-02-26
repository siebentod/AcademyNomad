// Helper function to build INSERT statements
export function buildInsert(tableName: string, data: Record<string, unknown>) {
  const keys = Object.keys(data);
  const columns = keys.join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map(k => data[k]);
  
  return {
    sql: `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
    values
  };
}

// Добавьте эту функцию рядом с buildInsert
export function buildBatchInsert(tableName: string, items: Record<string, unknown>[]) {
  if (items.length === 0) {
    throw new Error('No items to insert');
  }

  const keys = Object.keys(items[0]);
  const columns = keys.join(', ');
  
  // Создаем placeholders для каждой строки: ($1, $2), ($3, $4), ($5, $6)
  const placeholders = items.map((_, rowIndex) => 
    `(${keys.map((_, colIndex) => `$${rowIndex * keys.length + colIndex + 1}`).join(', ')})`
  ).join(', ');
  
  // Собираем все значения в один плоский массив
  const values = items.flatMap(item => keys.map(key => item[key]));
  
  return {
    sql: `INSERT INTO ${tableName} (${columns}) VALUES ${placeholders}`,
    values
  };
}

export function convertValues(data: Record<string, unknown>): Record<string, unknown> {
  const booleanFields = ['is_locked', 'is_pinned'];
  console.log('data', data)
  
  const converted = { ...data };
  
  for (const field of booleanFields) {
    if (field in converted) {
      converted[field] = converted[field] ? 1 : 0;
    }
  }
  
  return converted;
}