import { useDemo } from './DemoContext';

function DemoGuide() {
  const { isDemoMode } = useDemo();

  if (!isDemoMode) {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      padding: '15px', 
      backgroundColor: '#f0f0f0', 
      border: '1px solid #ccc',
      borderRadius: '5px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      <h4>Demo Mode Active</h4>
      <p>This is a demo guide placeholder</p>
    </div>
  );
}

export default DemoGuide;
