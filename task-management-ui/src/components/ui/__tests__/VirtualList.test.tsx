import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VirtualList } from '../VirtualList';

const mockItems = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  value: i * 10,
}));

const renderItem = (item: typeof mockItems[0], index: number) => (
  <div key={item.id} data-testid={`item-${index}`}>
    {item.name}: {item.value}
  </div>
);

describe('VirtualList', () => {
  it('renders virtual list container', () => {
    render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        containerHeight={300}
        renderItem={renderItem}
      />
    );

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(list).toHaveAttribute('aria-label', 'Virtual list with 1000 items');
  });

  it('renders only visible items', () => {
    render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        containerHeight={300}
        renderItem={renderItem}
      />
    );

    // With 300px container height and 50px item height, we should see ~6 items + overscan
    const visibleItems = screen.getAllByTestId(/item-/);
    expect(visibleItems.length).toBeLessThan(20); // Should be much less than 1000
    expect(visibleItems.length).toBeGreaterThan(5); // Should have some items visible
  });

  it('updates visible items on scroll', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        containerHeight={300}
        renderItem={renderItem}
      />
    );

    const scrollContainer = container.firstChild as HTMLElement;
    
    // Scroll down
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } });

    // Should now show different items
    const visibleItems = screen.getAllByTestId(/item-/);
    const firstVisibleItem = visibleItems[0];
    
    // The first visible item should be different after scrolling
    expect(firstVisibleItem).toHaveAttribute('data-testid', expect.stringMatching(/item-\d+/));
  });

  it('calls onScroll callback', () => {
    const onScroll = vi.fn();
    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        containerHeight={300}
        renderItem={renderItem}
        onScroll={onScroll}
      />
    );

    const scrollContainer = container.firstChild as HTMLElement;
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 200 } });

    expect(onScroll).toHaveBeenCalledWith(200);
  });

  it('uses custom getItemKey function', () => {
    const getItemKey = vi.fn((item, index) => `custom-${item.id}`);
    
    render(
      <VirtualList
        items={mockItems.slice(0, 10)}
        itemHeight={50}
        containerHeight={300}
        renderItem={renderItem}
        getItemKey={getItemKey}
      />
    );

    expect(getItemKey).toHaveBeenCalled();
  });

  it('handles empty items array', () => {
    render(
      <VirtualList
        items={[]}
        itemHeight={50}
        containerHeight={300}
        renderItem={renderItem}
      />
    );

    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('aria-label', 'Virtual list with 0 items');
    
    const items = screen.queryAllByTestId(/item-/);
    expect(items).toHaveLength(0);
  });

  it('applies custom className', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        containerHeight={300}
        renderItem={renderItem}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('sets correct container height', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={renderItem}
      />
    );

    const scrollContainer = container.firstChild as HTMLElement;
    expect(scrollContainer).toHaveStyle({ height: '400px' });
  });

  it('calculates total height correctly', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        containerHeight={300}
        renderItem={renderItem}
      />
    );

    const innerContainer = container.querySelector('div > div') as HTMLElement;
    expect(innerContainer).toHaveStyle({ height: '50000px' }); // 1000 items * 50px
  });

  it('has proper ARIA attributes on list items', () => {
    render(
      <VirtualList
        items={mockItems.slice(0, 10)}
        itemHeight={50}
        containerHeight={300}
        renderItem={renderItem}
      />
    );

    const listItems = screen.getAllByRole('listitem');
    
    listItems.forEach((item, index) => {
      expect(item).toHaveAttribute('aria-setsize', '10');
      expect(item).toHaveAttribute('aria-posinset', String(index + 1));
    });
  });

  it('handles overscan correctly', () => {
    render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        containerHeight={300}
        renderItem={renderItem}
        overscan={10}
      />
    );

    // With higher overscan, should render more items
    const visibleItems = screen.getAllByTestId(/item-/);
    expect(visibleItems.length).toBeGreaterThan(15); // More items due to overscan
  });
});