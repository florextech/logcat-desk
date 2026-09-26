import type { JSX } from 'react';

interface HelpTooltipProps {
  text: string;
  tone?: 'muted' | 'brand' | 'cyan' | 'amber' | 'violet';
}

export const HelpTooltip = ({ text, tone = 'muted' }: HelpTooltipProps): JSX.Element => (
  <span className="flx-help-tooltip no-drag">
    <button
      aria-label="Help"
      className={`flx-help-tooltip-trigger flx-help-tooltip-${tone}`}
      type="button"
    >
      <svg aria-hidden="true" fill="none" height="12" viewBox="0 0 16 16" width="12">
        <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M6.8 6.1a1.3 1.3 0 1 1 2.3.8c-.3.4-.7.6-1 .9-.3.2-.4.4-.4.9"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.2"
        />
        <circle cx="8" cy="11.4" fill="currentColor" r="0.7" />
      </svg>
    </button>
    <span className="flx-help-tooltip-bubble" role="tooltip">
      {text}
    </span>
  </span>
);
