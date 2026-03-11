import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();

  // Parse token from URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  // Verify email on mount
  useState(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setMessage('Email verified! You can now log in.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Verification failed.');
      });
  });

  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2>Email Verification</h2>
      <p>{message}</p>
      {status === 'success' && <button onClick={() => navigate('/login')}>Go to Login</button>}
    </div>
  );
}
