import type { JSX } from 'react';
import type { Emphasis, LogLevel } from '@shared/types';

export const getLevelTone = (
  level: LogLevel,
  emphasis: Emphasis
): {
  row: string;
  level: string;
} => {
  if (emphasis === 'critical' || level === 'F' || level === 'E') {
    return {
      row: 'bg-red-500/[0.06]',
      level: 'text-red-300'
    };
  }

  if (emphasis === 'warning' || level === 'W') {
    return {
      row: 'bg-amber-500/[0.055]',
      level: 'text-amber-300'
    };
  }

  if (level === 'D' || level === 'V') {
    return {
      row: 'bg-[rgb(189_241_70/0.03)]',
      level: 'text-[var(--brand-500)]'
    };
  }

  return {
    row: 'bg-transparent',
    level: 'text-[var(--brand-700)]'
  };
};

export const highlightText = (value: string, query: string): JSX.Element | string => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return value;
  }

  const escapedQuery = normalizedQuery.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const matcher = new RegExp(`(${escapedQuery})`, 'ig');
  const parts = value.split(matcher);

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === normalizedQuery.toLowerCase() ? (
          <mark
            key={`${part}-${index}`}
            className="rounded bg-[rgb(189_241_70/0.26)] px-1 text-[#10130f]"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </>
  );
};
