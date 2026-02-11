import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <aside style={{ 
      width: '250px', 
      height: '100vh', 
      backgroundColor: '#2c3e50', 
      color: 'white',
      position: 'fixed',
      left: 0,
      top: 0,
      padding: '20px',
      overflowY: 'auto'
    }}>
      <h2 style={{ marginBottom: '20px' }}>FBPA UI</h2>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '10px' }}><Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link></li>
          <li style={{ marginBottom: '10px' }}><Link to="/invoices" style={{ color: 'white', textDecoration: 'none' }}>Invoices</Link></li>
          <li style={{ marginBottom: '10px' }}><Link to="/exceptions" style={{ color: 'white', textDecoration: 'none' }}>Exceptions</Link></li>
          <li style={{ marginBottom: '10px' }}><Link to="/reports" style={{ color: 'white', textDecoration: 'none' }}>Reports</Link></li>
          <li style={{ marginBottom: '10px' }}><Link to="/carriers" style={{ color: 'white', textDecoration: 'none' }}>Carriers</Link></li>
          <li style={{ marginBottom: '10px' }}><Link to="/uploads" style={{ color: 'white', textDecoration: 'none' }}>Uploads</Link></li>
          <li style={{ marginBottom: '10px' }}><Link to="/customers" style={{ color: 'white', textDecoration: 'none' }}>Customers</Link></li>
          <li style={{ marginBottom: '10px' }}><Link to="/settings" style={{ color: 'white', textDecoration: 'none' }}>Settings</Link></li>
          <li style={{ marginBottom: '10px' }}><Link to="/rate-logic" style={{ color: 'white', textDecoration: 'none' }}>Rate Logic</Link></li>
          <li style={{ marginBottom: '10px' }}><Link to="/fleet-dashboard" style={{ color: 'white', textDecoration: 'none' }}>Fleet Dashboard</Link></li>
          <li style={{ marginBottom: '10px' }}><Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>My Profile</Link></li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
