import { useCallback, useRef, useEffect } from 'react';
import type { Position } from '../types';

interface UseWindowDragOptions {
  _windowId?: string;
  position: Position;
  isMaximized: boolean;
  onPositionChange: (x: number, y: number) => void;
  onFocus: () => void;
  taskbarHeight?: number;
}

export function useWindowDrag({
  position,
  isMaximized,
  onPositionChange,
  onFocus,
  taskbarHeight = 56,
}: UseWindowDragOptions) {
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);
  const currentPosition = useRef(position);

  // Keep position ref updated
  useEffect(() => {
    currentPosition.current = position;
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;

      // Constrain to viewport bounds
      const maxX = window.innerWidth - 100; // Keep at least 100px visible
      const maxY = window.innerHeight - taskbarHeight - 30; // Account for title bar height

      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));

      onPositionChange(constrainedX, constrainedY);
    });
  }, [onPositionChange, taskbarHeight]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    if (e.button !== 0) return; // Only left click

    e.preventDefault();
    onFocus();

    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - currentPosition.current.x,
      y: e.clientY - currentPosition.current.y,
    };

    document.body.style.cursor = 'move';
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isMaximized, onFocus, handleMouseMove, handleMouseUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    onMouseDown: handleMouseDown,
    isDragging: isDragging.current,
  };
}
