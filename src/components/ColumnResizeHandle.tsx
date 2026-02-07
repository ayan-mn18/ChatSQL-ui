import { useCallback, useRef } from 'react';

// ============================================
// COLUMN RESIZE HANDLE
// A drag handle rendered at the right edge of each <th>.
// Calls onResize(columnName, newWidth) during drag.
// ============================================

interface ColumnResizeHandleProps {
  column: string;
  onResize: (column: string, width: number) => void;
  onResizeEnd?: () => void;
  currentWidth: number;
  minWidth?: number;
  maxWidth?: number;
}

export default function ColumnResizeHandle({
  column,
  onResize,
  onResizeEnd,
  currentWidth,
  minWidth = 60,
  maxWidth = 800,
}: ColumnResizeHandleProps) {
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startXRef.current = e.clientX;
      startWidthRef.current = currentWidth;

      const handleMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startXRef.current;
        const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta));
        onResize(column, newWidth);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        onResizeEnd?.();
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [column, currentWidth, minWidth, maxWidth, onResize, onResizeEnd]
  );

  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize z-10 group/resize hover:bg-blue-500/40 active:bg-blue-500/60"
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Visible drag indicator line */}
      <div className="absolute right-0 top-1 bottom-1 w-[1px] bg-white/10 group-hover/resize:bg-blue-400/80 group-active/resize:bg-blue-400 transition-colors" />
    </div>
  );
}
