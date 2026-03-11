import React from 'react';

const GridLayout: React.FC<{ children: React.ReactNode[] }> = ({ children }) => (
  <div className="grid grid-cols-12 gap-2 w-full h-screen max-h-screen bg-gray-100">
    <aside className="col-span-3 h-full overflow-y-auto border-r border-gray-200 bg-white">
      {children[0]}
    </aside>
    <main className="col-span-6 h-full overflow-y-auto bg-white">
      {children[1]}
    </main>
    <aside className="col-span-3 h-full overflow-y-auto border-l border-gray-200 bg-white">
      {children[2]}
    </aside>
  </div>
);

export default GridLayout;
