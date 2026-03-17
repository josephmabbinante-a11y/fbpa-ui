import React, { useState } from 'react';
import BookLoadDialog from '../components/BookLoadDialog';

export default function BookLoadButton({ carriers, load, onBook }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBook = async (data) => {
    setLoading(true);
    try {
      await onBook(data);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16 }}>
        Book Load
      </button>
      <BookLoadDialog
        open={open}
        onClose={() => setOpen(false)}
        onBook={handleBook}
        carriers={carriers}
        load={load}
        loading={loading}
      />
    </>
  );
}
