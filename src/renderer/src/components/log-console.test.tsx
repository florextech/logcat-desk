import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LogEntry } from '@shared/types';
import { LogConsole } from '@renderer/components/log-console';

const makeLog = (sequence: number): LogEntry => ({
  id: `log-${sequence}`,
  sequence,
  deviceId: 'device-1',
  raw: `raw-${sequence}`,
  level: 'I',
  tag: 'Tag',
  message: `message-${sequence}`,
  emphasis: 'normal',
  receivedAt: new Date().toISOString()
});

const configureScrollRegion = (element: HTMLDivElement): {
  getScrollTop: () => number;
  setScrollTop: (value: number) => void;
  setScrollHeight: (value: number) => void;
} => {
  let scrollTop = 0;
  let scrollHeight = 420;

  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    value: 100
  });

  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = value;
    }
  });

  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeight
  });

  Object.defineProperty(element, 'scrollTo', {
    configurable: true,
    value: vi.fn(({ top }: { top?: number }) => {
      scrollTop = top ?? 0;
    })
  });

  return {
    getScrollTop: () => scrollTop,
    setScrollTop: (value) => {
      scrollTop = value;
    },
    setScrollHeight: (value) => {
      scrollHeight = value;
    }
  };
};

afterEach(() => {
  cleanup();
});

describe('LogConsole', () => {
  it('does not force auto-scroll when the user is reviewing older logs', () => {
    const onCopyLine = vi.fn();

    const { rerender } = render(
      <LogConsole autoScroll logs={[makeLog(1)]} onCopyLine={onCopyLine} searchQuery="" />
    );

    const scrollRegion = screen.getByTestId('log-console-scroll') as HTMLDivElement;
    const scroll = configureScrollRegion(scrollRegion);

    rerender(<LogConsole autoScroll logs={[makeLog(1), makeLog(2)]} onCopyLine={onCopyLine} searchQuery="" />);
    expect(scroll.getScrollTop()).toBe(420);

    scroll.setScrollTop(120);
    fireEvent.scroll(scrollRegion);

    expect(screen.getByRole('button', { name: /ir al ultimo log/i })).toBeInTheDocument();

    scroll.setScrollHeight(540);
    rerender(
      <LogConsole autoScroll logs={[makeLog(1), makeLog(2), makeLog(3)]} onCopyLine={onCopyLine} searchQuery="" />
    );

    expect(scroll.getScrollTop()).toBe(120);
  });

  it('allows returning to the latest log manually with the floating action', () => {
    const onCopyLine = vi.fn();

    const { rerender } = render(
      <LogConsole autoScroll logs={[makeLog(1)]} onCopyLine={onCopyLine} searchQuery="" />
    );

    const scrollRegion = screen.getByTestId('log-console-scroll') as HTMLDivElement;
    const scroll = configureScrollRegion(scrollRegion);

    scroll.setScrollTop(80);
    fireEvent.scroll(scrollRegion);
    scroll.setScrollHeight(600);

    rerender(<LogConsole autoScroll logs={[makeLog(1), makeLog(2)]} onCopyLine={onCopyLine} searchQuery="" />);

    fireEvent.click(screen.getByRole('button', { name: /ir al ultimo log/i }));
    expect(scroll.getScrollTop()).toBe(600);
  });
});
