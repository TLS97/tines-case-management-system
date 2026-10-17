import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useScrollableRegion } from './useScrollableRegion';

function Region({ contentWidth }: { contentWidth: number }) {
  const [setRegion, tabIndex] = useScrollableRegion();
  return (
    <div
      ref={(element) => {
        // jsdom has no layout, so the sizes are set by hand.
        if (element) {
          Object.defineProperty(element, 'clientWidth', { value: 300, configurable: true });
          Object.defineProperty(element, 'scrollWidth', {
            value: contentWidth,
            configurable: true,
          });
        }
        setRegion(element);
      }}
      role="region"
      aria-label="Wide table"
      tabIndex={tabIndex}
    />
  );
}

describe('useScrollableRegion', () => {
  it('makes the region focusable while its content is wider than it', async () => {
    render(<Region contentWidth={500} />);

    expect(await screen.findByRole('region')).toHaveAttribute('tabindex', '0');
  });

  it('adds no tab stop when everything fits', () => {
    render(<Region contentWidth={300} />);

    expect(screen.getByRole('region')).not.toHaveAttribute('tabindex');
  });
});
