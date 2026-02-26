import type { BookHeaderProps } from '../types';

export default function FileHeader({
  fileName,
  index,
  onSelectBook
}: BookHeaderProps) {
  return (
    <div key={`file-${index}`} className="mt-1.5 flex items-center">
      <div
        className="px-1 ml-2 text-md font-semibold text-gray-300 truncate pr-4 hover:text-white cursor-pointer"
        onClick={() => onSelectBook(fileName)}
        title={`Показать только "${fileName}"`}
      >
        {fileName}
      </div>
    </div>
  );
}