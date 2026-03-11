import React, { useEffect, useRef, useState } from 'react';

export default function LogoUpload({ onUpload }) {
  const [logo, setLogo] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    return () => {
      if (logo && logo.startsWith('blob:')) URL.revokeObjectURL(logo);
    };
  }, [logo]);

  function handleChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PNG, JPEG, SVG, or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('File must be under 2 MB.');
      return;
    }
    setError('');
    const url = URL.createObjectURL(file);
    setLogo(url);
    onUpload && onUpload(file);
  }

  return (
    <div>
      <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" ref={fileRef} style={{ display: 'none' }} onChange={handleChange} />
      <button onClick={() => fileRef.current.click()}>Upload Logo</button>
      {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{error}</div>}
      {logo && <img src={logo} alt="Logo Preview" style={{ maxHeight: 60, marginTop: 8 }} />}
    </div>
  );
}

