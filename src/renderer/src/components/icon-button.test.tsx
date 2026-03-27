import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from '@renderer/components/icon-button';

describe('IconButton', () => {
  it('renders the label and triggers clicks', () => {
    const onClick = vi.fn();

    render(<IconButton icon={<span>i</span>} label="Device" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: /device/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows an activity dot when active', () => {
    const { container } = render(
      <IconButton active icon={<span>i</span>} label="Device" onClick={() => undefined} />
    );

    expect(container.querySelector(String.raw`.bg-\[var\(--brand-600\)\]`)).not.toBeNull();
  });
});
