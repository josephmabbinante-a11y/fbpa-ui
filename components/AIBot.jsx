import { useState } from 'react';

function AIBot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      left: '270px',
      zIndex: 1000
    }}>
      {isOpen && (
        <div style={{
          width: '300px',
          height: '400px',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '10px',
          padding: '15px'
        }}>
          <h3>AI Assistant</h3>
          <p>AI Bot placeholder - ready to help!</p>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
      >
        AI
      </button>
    </div>
  );
}

export default AIBot;
