import React from 'react';
import { useThemeTokens } from '../contexts/ThemeContext';

const Button = ({ children, onClick, variant = 'primary', icon, ...props }) => {
  const theme = useThemeTokens();

  const styles = {
    background: variant === 'primary' ? theme.gradients.primaryButton : theme.colors.surface,
    color: variant === 'primary' ? theme.colors.textPrimary : theme.colors.textSecondary,
    borderRadius: theme.borderRadius,
    border: 'none',
    boxShadow: theme.shadow,
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
