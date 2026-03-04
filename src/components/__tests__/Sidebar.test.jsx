
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Sidebar from '../Sidebar';
import { ThemeContext } from '../../contexts/ThemeContext';
import { MemoryRouter } from 'react-router-dom';

const mockTheme = {
  theme: {
    border: '#ccc',
    textSecondary: '#333',
    accent: '#007bff',
    text: '#222',
    surfaceStrong: '#fff',
    bgAlt: '#f4f4f4',
  },
  setModePreference: () => {},
  setPalette: () => {},
  availablePalettes: [],
  settings: {
    fontScale: 1,
    fontWeight: 600,
    effectsStrength: 1,
    scheduleEnabled: false,
    forceDarkDataPages: false,
    reduceAnimationInDark: false,
  },
};

function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={mockTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

describe('Sidebar', () => {
  it('renders sidebar with expected text', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Sidebar />
        </ThemeProvider>
      </MemoryRouter>
    );
    // Use getAllByText since multiple elements match 'dashboard'
    const dashboardElements = screen.getAllByText(/dashboard/i);
    expect(dashboardElements.length).toBeGreaterThan(0);
    dashboardElements.forEach(el => expect(el).toBeInTheDocument());
  });
});