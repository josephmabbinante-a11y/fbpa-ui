import React from 'react';
import GridLayout from './components/GridLayout';
import LeftPanel from './components/LeftPanel';
import CenterEngine from './components/CenterEngine';
import RightPanel from './components/RightPanel';

const App: React.FC = () => {
  return (
    <GridLayout>
      <LeftPanel />
      <CenterEngine />
      <RightPanel />
    </GridLayout>
  );
};

export default App;
