function Layout({ children }) {
  return (
    <main style={{ 
      marginLeft: '250px', 
      padding: '20px',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {children}
    </main>
  );
}

export default Layout;
