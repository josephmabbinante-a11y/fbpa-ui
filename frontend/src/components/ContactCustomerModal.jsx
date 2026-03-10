import React, { useState } from 'react';

export default function ContactCustomerModal({ open, onClose, onSend, customer, invoice, exception }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      await onSend({ message, customer, invoice, exception });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Contact Customer</h2>
        <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        {sent ? (
          <div style={styles.success}>Message sent successfully!</div>
        ) : (
          <>
            <div style={styles.label}>To:</div>
            <div style={styles.value}>{customer?.name || invoice?.customer || exception?.customer || 'Customer'}</div>
            <div style={styles.label}>Message:</div>
            <textarea
              style={styles.textarea}
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              placeholder="Type your message..."
              disabled={sending}
            />
            {error && <div style={styles.error}>{error}</div>}
            <button style={styles.sendBtn} onClick={handleSend} disabled={sending || !message.trim()}>
              {sending ? 'Sending...' : 'Send'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.25)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    background: '#fff',
    borderRadius: 8,
    padding: '32px 24px 24px 24px',
    minWidth: 340,
    maxWidth: 420,
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    background: 'none',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    color: '#888',
  },
  label: {
    fontWeight: 600,
    marginTop: 12,
    marginBottom: 4,
    fontSize: 13,
  },
  value: {
    marginBottom: 8,
    fontSize: 14,
    color: '#333',
  },
  textarea: {
    width: '100%',
    borderRadius: 4,
    border: '1px solid #ccc',
    padding: 8,
    fontSize: 14,
    marginBottom: 12,
    resize: 'vertical',
  },
  sendBtn: {
    background: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '8px 20px',
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    marginTop: 8,
  },
  error: {
    color: '#d32f2f',
    fontSize: 13,
    marginBottom: 8,
  },
  success: {
    color: '#388e3c',
    fontSize: 15,
    fontWeight: 600,
    margin: '24px 0',
    textAlign: 'center',
  },
};
