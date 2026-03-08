import React, { useState, useEffect } from 'react';
import { quoteSaiaAuction, getSaiaAuctionCircuit } from '../api/auctionClient';

export default function AuctionBoard() {
  const [circuit, setCircuit] = useState(null);
  const [load, setLoad] = useState({});
  const [quoteResult, setQuoteResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSaiaAuctionCircuit().then(setCircuit);
  }, []);

  const handleQuote = async () => {
    setLoading(true);
    const result = await quoteSaiaAuction(load);
    setQuoteResult(result);
    setLoading(false);
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Auction Board</h2>
      <div>
        <strong>Circuit State:</strong>
        <pre>{JSON.stringify(circuit, null, 2)}</pre>
      </div>
      <div style={{ marginTop: 24 }}>
        <h3>Quote Saia Auction</h3>
        <textarea
          rows={6}
          style={{ width: '100%' }}
          placeholder="Paste load JSON here"
          value={JSON.stringify(load, null, 2)}
          onChange={e => {
            try {
              setLoad(JSON.parse(e.target.value));
            } catch {
              // ignore parse errors
            }
          }}
        />
        <button onClick={handleQuote} disabled={loading} style={{ marginTop: 12 }}>
          {loading ? 'Quoting...' : 'Quote Auction'}
        </button>
        {quoteResult && (
          <div style={{ marginTop: 16 }}>
            <strong>Quote Result:</strong>
            <pre>{JSON.stringify(quoteResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
