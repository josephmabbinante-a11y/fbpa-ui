import React from 'react';

const Button = ({ children, onClick, variant = 'primary', ...props }) => {
  return (
    <button
      onClick={onClick}
      className={`btn btn-${variant}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
