import React from 'react';

export const PricingLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-full h-screen max-h-screen grid grid-cols-12 bg-gray-100" style={{ gridTemplateRows: '1fr' }}>
    {children}
  </div>
);
