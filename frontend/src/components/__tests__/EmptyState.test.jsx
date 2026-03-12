import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../EmptyState';
import { ThemeContext } from '../../contexts/ThemeContext';

const mockTheme = {
  theme: {
    textSecondary: '#9a9a9a',
    text: '#f3f4f6',
    accent: '#2563eb',
    border: '#303748',
    bgAlt: '#171a21',
    surface: '#171a21',
  },
  settings: {
    fontScale: 1,
    fontWeight: 600,
    effectsStrength: 1,
    scheduleEnabled: false,
    forceDarkDataPages: false,
    reduceAnimationInDark: false,
  },
  setModePreference: () => {},
  setPalette: () => {},
  availablePalettes: [],
};

function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={mockTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

describe('EmptyState', () => {
  it('renders the headline when provided', () => {
    render(
      <ThemeProvider>
        <EmptyState headline="No loads yet" category="logistics" />
      </ThemeProvider>
    );
    expect(screen.getByText('No loads yet')).toBeInTheDocument();
  });

  it('renders the icon when provided', () => {
    render(
      <ThemeProvider>
        <EmptyState icon="🚚" headline="No loads yet" category="logistics" />
      </ThemeProvider>
    );
    expect(screen.getByText('🚚')).toBeInTheDocument();
  });

  it('renders a motivational quip', () => {
    render(
      <ThemeProvider>
        <EmptyState category="logistics" />
      </ThemeProvider>
    );
    const quip = screen.getByText(/\u201c.+\u201d/);
    expect(quip).toBeInTheDocument();
  });

  it('renders the action button when actionLabel and onAction are provided', () => {
    const onAction = jest.fn();
    render(
      <ThemeProvider>
        <EmptyState
          headline="No carriers yet"
          category="carriers"
          actionLabel="Add Carrier"
          onAction={onAction}
        />
      </ThemeProvider>
    );
    const button = screen.getByRole('button', { name: /add carrier/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when onAction is missing', () => {
    render(
      <ThemeProvider>
        <EmptyState headline="No data" actionLabel="Import Data" />
      </ThemeProvider>
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses a provided message override instead of a random quip', () => {
    render(
      <ThemeProvider>
        <EmptyState message="Custom motivational message here." />
      </ThemeProvider>
    );
    expect(screen.getByText(/Custom motivational message here\./)).toBeInTheDocument();
  });
});
