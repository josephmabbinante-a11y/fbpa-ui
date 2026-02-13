'use client'
import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const plainTextPassword = "p@ssw0rd'9'!,";
  const encodedPassword = encodeURIComponent(plainTextPassword);

  async function fetchMongoData() {
    setLoading(true);
    setError('');

    try {
      const appId = process.env.NEXT_PUBLIC_MONGODB_APP_ID;
      const apiKey = process.env.NEXT_PUBLIC_MONGODB_DATA_API_KEY;
      const dataSource = process.env.NEXT_PUBLIC_MONGODB_DATA_SOURCE;
      const database = process.env.NEXT_PUBLIC_MONGODB_DATABASE;
      const collection = process.env.NEXT_PUBLIC_MONGODB_COLLECTION;

      if (!appId || !apiKey || !dataSource || !database || !collection) {
        throw new Error('Missing Mongo Data API environment variables');
      }

      const response = await fetch(`https://data.mongodb-api.com/app/${appId}/endpoint/data/v1/action/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          dataSource,
          database,
          collection,
          filter: {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Mongo Data API request failed (${response.status})`);
      }

      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err.message || 'Request failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '2em', textAlign: 'center' }}>
      <h1>Opscale Portal</h1>
      <p>Welcome to FBPA Portal</p>
      <p>
        Mongo password special characters must be URL-encoded:
        <br />
        <code> : / ? # [ ] @ ! $ &apos; ( ) * , ; = % </code>
      </p>
      <p>
        Example plain text password: <code>{plainTextPassword}</code>
        <br />
        Encoded password: <code>{encodedPassword}</code>
      </p>
      <button type="button" onClick={fetchMongoData} disabled={loading} style={{ padding: '0.5em 1em', cursor: 'pointer' }}>
        {loading ? 'Loading...' : 'Load Mongo Data API Sample'}
      </button>
      {error ? <p style={{ color: 'crimson', marginTop: '1em' }}>{error}</p> : null}
      {data ? (
        <pre style={{ textAlign: 'left', marginTop: '1em', background: '#f4f4f4', padding: '1em', overflow: 'auto' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : null}
      <div style={{ marginTop: '2em' }}>
        <a href="/login" style={{ marginRight: '1em', padding: '0.5em 1em', background: '#1877F2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>Login</a>
        <a href="/register" style={{ padding: '0.5em 1em', background: '#666', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>Register</a>
      </div>
    </div>
  )
}
