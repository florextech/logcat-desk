import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommandBar } from '@renderer/components/command-bar';

afterEach(() => {
  cleanup();
});

describe('CommandBar', () => {
  it('renders and triggers the clear logs action', () => {
    const onClearLogs = vi.fn();

    render(
      <CommandBar
        canStart
        canClearLogs
        filters={{ text: '', tag: '', packageName: '', search: '', minLevel: 'ALL' }}
        isPaused={false}
        isStreaming={false}
        onClearLogs={onClearLogs}
        onOpenActions={vi.fn()}
        onPauseResume={vi.fn()}
        onSetFilters={vi.fn()}
        onStart={vi.fn()}
        onStop={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /limpiar logs/i }));
    expect(onClearLogs).toHaveBeenCalledTimes(1);
  });

  it('disables clear logs when there is no visible output', () => {
    render(
      <CommandBar
        canStart
        canClearLogs={false}
        filters={{ text: '', tag: '', packageName: '', search: '', minLevel: 'ALL' }}
        isPaused={false}
        isStreaming={false}
        onClearLogs={vi.fn()}
        onOpenActions={vi.fn()}
        onPauseResume={vi.fn()}
        onSetFilters={vi.fn()}
        onStart={vi.fn()}
        onStop={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /limpiar logs/i })).toBeDisabled();
  });
});
