import { useState, useCallback, useRef } from "react";

interface ViewState {
  x: number;
  y: number;
  scale: number;
}

export function usePanZoom() {
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startView = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    // Zoom limits
    const MIN_SCALE = 0.2;
    const MAX_SCALE = 5;
    
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    
    setView((prev) => {
      let newScale = prev.scale * scaleFactor;
      newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
      
      if (newScale === prev.scale) return prev;

      // Zoom towards cursor
      const rect = containerRef.current!.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;

      // Calculate where the cursor is in the local coordinate space
      const localX = (pointerX - prev.x) / prev.scale;
      const localY = (pointerY - prev.y) / prev.scale;

      return {
        scale: newScale,
        x: pointerX - localX * newScale,
        y: pointerY - localY * newScale,
      };
    });
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    
    setView((prev) => {
      startView.current = { x: prev.x, y: prev.y };
      return prev;
    });
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    
    setView((prev) => ({
      ...prev,
      x: startView.current.x + dx,
      y: startView.current.y + dy,
    }));
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    isDragging.current = false;
  }, []);

  const resetView = useCallback(() => {
    setView({ x: 0, y: 0, scale: 1 });
  }, []);

  return { view, containerRef, onWheel, onPointerDown, onPointerMove, onPointerUp, resetView };
}
