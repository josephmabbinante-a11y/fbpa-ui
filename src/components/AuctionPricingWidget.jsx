import React, { useState, useEffect } from 'react';
import { quoteSaiaAuction, getSaiaAuctionCircuit } from '../api/auctionClient';
import { Zap, RefreshCw } from 'lucide-react';

export default function AuctionPricingWidget() {
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl mt-8">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4 text-yellow-400" /> Auction Pricing
      </h3>
      <div className="mb-4">
        <strong className="text-indigo-400">Circuit State:</strong>
        <pre className="bg-slate-950 p-2 rounded text-xs text-indigo-300 mt-2">{JSON.stringify(circuit, null, 2)}</pre>
      </div>
      <div className="mb-4">
        <h4 className="text-white text-sm font-bold mb-2">Quote Saia Auction</h4>
        <textarea
          rows={4}
          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"
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
        <button onClick={handleQuote} disabled={loading} className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 flex items-center gap-2">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {loading ? 'Quoting...' : 'Quote Auction'}
        </button>
      </div>
      {quoteResult && (
        <div className="mt-4">
          <strong className="text-indigo-400">Quote Result:</strong>
          <pre className="bg-slate-950 p-2 rounded text-xs text-indigo-300 mt-2">{JSON.stringify(quoteResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
