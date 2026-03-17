import React from 'react';
import {useThemeTokens} from '../contexts/ThemeContext';

const Button = ({ children, onClick, variant = 'primary', icon, ...props }) => {

  const fallbackTheme = {
    gradients: { primaryButton: '#007bff' },
    colors: { surface: '#fff', textPrimary: '#000', textSecondary: '#333' },
    borderRadius: '4px',
    shadow: '0 2px 8px rgba(0,0,0,0.08)',
    hoverGlow: '0 0 8px rgba(0,123,255,0.18)',
  };
  const theme = useThemeTokens() || fallbackTheme;

  const styles = {
    background: variant === 'primary' ? theme.gradients?.primaryButton || fallbackTheme.gradients.primaryButton : theme.colors?.surface || fallbackTheme.colors.surface,
    color: variant === 'primary' ? theme.colors?.textPrimary || fallbackTheme.colors.textPrimary : theme.colors?.textSecondary || fallbackTheme.colors.textSecondary,
    borderRadius: theme.borderRadius || fallbackTheme.borderRadius,
    border: 'none',
    boxShadow: theme.shadow || fallbackTheme.shadow,
    fontWeight: 600,
    padding: '10px 20px',
    transition: 'transform 0.18s, box-shadow 0.18s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  };

  const handleMouseEnter = (e) => {
    e.currentTarget.style.boxShadow = theme.hoverGlow;
    e.currentTarget.style.transform = 'scale(1.02)';
  };
  const handleMouseLeave = (e) => {
    e.currentTarget.style.boxShadow = theme.shadow;
    e.currentTarget.style.transform = 'scale(1)';
  };

  return (
    <button
      onClick={onClick}
      style={styles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
