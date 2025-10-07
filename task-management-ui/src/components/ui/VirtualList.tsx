import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/utils';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
  getItemKey = (_, index) => index,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      result.push({
        index: i,
        item: items[i],
        key: getItemKey(items[i], i),
      });
    }
    return result;
  }, [items, visibleRange, getItemKey]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  };

  const scrollToIndex = (index: number) => {
    if (scrollElementRef.current) {
      const scrollTop = index * itemHeight;
      scrollElementRef.current.scrollTop = scrollTop;
      setScrollTop(scrollTop);
    }
  };

  const scrollToTop = () => {
    scrollToIndex(0);
  };

  const scrollToBottom = () => {
    scrollToIndex(items.length - 1);
  };

  useEffect(() => {
    // Expose scroll methods to parent component
    if (scrollElementRef.current) {
      (scrollElementRef.current as any).scrollToIndex = scrollToIndex;
      (scrollElementRef.current as any).scrollToTop = scrollToTop;
      (scrollElementRef.current as any).scrollToBottom = scrollToBottom;
    }
  }, []);

  return (
    <div
      ref={scrollElementRef}
      className={cn(
        'overflow-auto',
        className
      )}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      role="list"
      aria-label={`Virtual list with ${items.length} items`}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleRange.start * itemHeight}px)`,
          }}
        >
          {visibleItems.map(({ item, index, key }) => (
            <div
              key={key}
              style={{ height: itemHeight }}
              role="listitem"
              aria-setsize={items.length}
              aria-posinset={index + 1}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook for virtual list with dynamic item heights
export const useVirtualList = <T,>(
  items: T[],
  estimatedItemHeight: number = 50
) => {
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const measureItem = (index: number, height: number) => {
    setItemHeights(prev => {
      const newMap = new Map(prev);
      newMap.set(index, height);
      return newMap;
    });
  };

  const getItemHeight = (index: number) => {
    return itemHeights.get(index) ?? estimatedItemHeight;
  };

  const getTotalHeight = () => {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += getItemHeight(i);
    }
    return total;
  };

  const getVisibleRange = (containerHeight: number) => {
    let start = 0;
    let end = 0;
    let currentTop = 0;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const itemHeight = getItemHeight(i);
      if (currentTop + itemHeight > scrollTop) {
        start = i;
        break;
      }
      currentTop += itemHeight;
    }

    // Find end index
    currentTop = 0;
    for (let i = 0; i < items.length; i++) {
      const itemHeight = getItemHeight(i);
      if (i >= start && currentTop > containerHeight) {
        end = i - 1;
        break;
      }
      if (i >= start) {
        currentTop += itemHeight;
      }
    }

    if (end === 0) end = items.length - 1;

    return { start: Math.max(0, start - 2), end: Math.min(items.length - 1, end + 2) };
  };

  return {
    containerRef,
    scrollTop,
    setScrollTop,
    measureItem,
    getItemHeight,
    getTotalHeight,
    getVisibleRange,
  };
};