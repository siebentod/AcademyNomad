import { Lists, List, ListItem } from 'src/shared/types';

// Вспомогательные функции для работы с массивом списков
export const findListByName = (
  lists: Lists,
  name: string
): List | undefined => {
  return lists.find((list) => list.name === name);
};

export const updateListByName = (
  lists: Lists,
  name: string,
  items: ListItem[]
): Lists => {
  const existingIndex = lists.findIndex((list) => list.name === name);
  if (existingIndex !== -1) {
    const newLists = [...lists];
    newLists[existingIndex] = { ...newLists[existingIndex], items };
    return newLists;
  }
  return [...lists, { name, items }];
};
