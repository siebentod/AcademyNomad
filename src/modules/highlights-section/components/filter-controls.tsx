import type { ReactNode } from 'react';

interface FilterControlsProps {
  children: ReactNode;
}

export default function FilterControls({ children }: FilterControlsProps) {
  return (
    <div className="px-3 py-2 flex items-center space-x-3 relative">{children}</div>
  );
}
