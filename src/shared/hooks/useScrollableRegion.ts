import { useEffect, useState } from 'react';

/**
 * For a region that scrolls sideways on narrow screens: it can be focused (tabIndex 0) only while its
 * content overflows, so keyboard users can scroll it with the arrow keys (WCAG 2.1.1, axe
 * "scrollable-region-focusable") without an extra tab stop when everything fits.
 *
 * @returns a function to pass as the region's `ref`, and the region's tabIndex.
 */
export function useScrollableRegion(): [(region: HTMLElement | null) => void, 0 | undefined] {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    if (!element) return;
    const check = () => setOverflows(element.scrollWidth > element.clientWidth);
    check();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(check);
    observer.observe(element);
    for (const child of Array.from(element.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [element]);

  return [setElement, overflows ? 0 : undefined];
}
