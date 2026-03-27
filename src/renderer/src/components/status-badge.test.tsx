import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from '@renderer/components/status-badge';

describe('StatusBadge', () => {
  it('renders the supplied label', () => {
    render(<StatusBadge label="Streaming logcat" status="streaming" />);

    expect(screen.getByText('Streaming logcat')).toBeInTheDocument();
  });

  it('applies the streaming tone with pulse animation', () => {
    const { container } = render(<StatusBadge label="Streaming logcat" status="streaming" />);

    expect(container.querySelector('.animate-pulse')).not.toBeNull();
  });

  it('applies the error tone for error states', () => {
    const { container } = render(<StatusBadge label="Error" status="error" />);

    expect(container.querySelector('.text-red-300')).not.toBeNull();
  });
});
