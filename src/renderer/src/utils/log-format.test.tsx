import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getLevelTone, getSeverityTone, highlightText } from '@renderer/utils/log-format';

describe('log formatting helpers', () => {
  it('returns critical tones for errors and fatal logs', () => {
    expect(getLevelTone('E', 'normal')).toEqual({
      row: 'bg-red-500/[0.06]',
      level: 'text-red-300'
    });
    expect(getLevelTone('I', 'critical')).toEqual({
      row: 'bg-red-500/[0.06]',
      level: 'text-red-300'
    });
  });

  it('returns warning and verbose/debug tones', () => {
    expect(getLevelTone('W', 'normal')).toEqual({
      row: 'bg-amber-500/[0.055]',
      level: 'text-amber-300'
    });
    expect(getLevelTone('D', 'normal')).toEqual({
      row: 'bg-[rgb(189_241_70/0.03)]',
      level: 'text-[var(--brand-500)]'
    });
  });

  it('returns tones for semantic severities', () => {
    expect(getSeverityTone('error')).toEqual({
      row: 'bg-red-500/[0.08]',
      level: 'text-red-200'
    });
    expect(getSeverityTone('warning')).toEqual({
      row: 'bg-amber-500/[0.085]',
      level: 'text-amber-200'
    });
  });

  it('highlights matching search terms and escapes special regex chars', () => {
    render(<div>{highlightText('Error (fatal) happened', '(fatal)')}</div>);

    const mark = screen.getByText('(fatal)');
    expect(mark.tagName).toBe('MARK');
    expect(mark).toHaveClass('rounded');
  });

  it('returns the original value when no search query is provided', () => {
    expect(highlightText('plain text', '')).toBe('plain text');
  });
});
