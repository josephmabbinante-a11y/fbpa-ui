import React, { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getRandomEmptyStateMessage } from '../constants/emptyStateMessages';

/**
 * EmptyState — displays a motivational quip when a data list is empty.
 *
 * Props:
 *   icon        {string}   Emoji or text icon shown above the headline (default: "📭")
 *   headline    {string}   Short headline (e.g. "No loads yet")
 *   category    {string}   Message category: 'logistics' | 'carriers' | 'sales' |
 *                          'analytics' | 'productivity' | 'humor' | 'general'
 *   message     {string}   Override the random quip with a specific message
 *   actionLabel {string}   Label for the primary action button
 *   onAction    {Function} Callback fired when the action button is clicked
 */
export default function EmptyState({
  icon = '📭',
  headline,
  category,
  message,
  actionLabel,
  onAction,
}) {
  const { theme } = useTheme();
  const t = theme || {};

  // Memoize so the message stays stable during a single render session
  const quip = useMemo(
    () => message || getRandomEmptyStateMessage(category),
    [category, message]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '48px 24px',
        textAlign: 'center',
        color: t.textSecondary || '#9a9a9a',
      }}
    >
      {icon && (
        <span style={{ fontSize: 48, lineHeight: 1 }} role="img" aria-hidden="true">
          {icon}
        </span>
      )}

      {headline && (
        <div style={{ fontSize: 18, fontWeight: 700, color: t.text || '#f3f4f6' }}>
          {headline}
        </div>
      )}

      <div style={{ fontSize: 14, fontStyle: 'italic', maxWidth: 360, lineHeight: 1.5 }}>
        &ldquo;{quip}&rdquo;
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            marginTop: 8,
            padding: '10px 20px',
            borderRadius: 8,
            border: `1px solid ${t.accent || '#2563eb'}`,
            background: t.accent || '#2563eb',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
