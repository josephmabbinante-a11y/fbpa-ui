import React, { useRef, useState } from 'react';

export default function LogoUpload({ onUpload }) {
  const [logo, setLogo] = useState(null);
  const fileRef = useRef();

  function handleChange(e) {
    const file = e.target.files[0];
    if (file) {
      setLogo(URL.createObjectURL(file));
      onUpload && onUpload(file);
    }
  }

  return (
    <div>
      <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleChange} />
      <button onClick={() => fileRef.current.click()}>Upload Logo</button>
      {logo && <img src={logo} alt="Logo Preview" style={{ maxHeight: 60, marginTop: 8 }} />}
    </div>
  );
}
