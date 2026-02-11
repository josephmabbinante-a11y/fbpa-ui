import React, { useEffect, useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';
import GoogleMapEmbed from '../components/GoogleMapEmbed';
import { calculateRateLogic } from '../api/client';

export default function RateLogicTool() {
  const { theme } = useTheme();
  const t = themes[theme];
  const [origin, setOrigin] = useState('Los Angeles, CA');
  const [destination, setDestination] = useState('Dallas, TX');
  const [equipment, setEquipment] = useState('Van');
  const [laneType, setLaneType] = useState('Line Haul');
  const [mileage, setMileage] = useState(1435);

  const [rateData, setRateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError('');

      const res = await calculateRateLogic({
        origin,
        destination,
        equipment,
        laneType,
        mileage,
      });

      if (isCancelled) return;

      if (res?.error) {
        setError(res.error);
      } else {
        setRateData(res);
      }

      setLoading(false);
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [origin, destination, equipment, laneType, mileage]);

  const laneData = rateData?.laneData || [];
  const shortTermHistory = rateData?.shortTermHistory || [];
  const topCarriers = rateData?.topCarriers || [];
  const loadBoard = rateData?.loadBoard || [];
  const quote = rateData?.quote || 0;
  const confidence = rateData?.confidence || 0;
  const marketPosition = rateData?.marketPosition || 'At Avg';

  return (
    <div style={{ padding: 24, background: t.bg, color: t.text, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Rate Logic Tool</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ background: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Return to Shipper</button>
          <button style={{ background: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Return to Search</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 340 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Lane Selector</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Origin" style={{ flex: 1, padding: 6, borderRadius: 4, border: `1px solid ${t.borderLight}` }} />
              <span style={{ alignSelf: 'center' }}>-&gt;</span>
              <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination" style={{ flex: 1, padding: 6, borderRadius: 4, border: `1px solid ${t.borderLight}` }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={equipment} onChange={(e) => setEquipment(e.target.value)} style={{ flex: 1, padding: 6, borderRadius: 4, border: `1px solid ${t.borderLight}` }}>
                <option>Van</option>
                <option>Reefer</option>
                <option>Flatbed</option>
              </select>
              <select value={laneType} onChange={(e) => setLaneType(e.target.value)} style={{ flex: 1, padding: 6, borderRadius: 4, border: `1px solid ${t.borderLight}` }}>
                <option>Line Haul</option>
                <option>Drayage</option>
                <option>Intermodal</option>
              </select>
            </div>
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Market Rate Table</div>
            <table style={{ width: '100%', fontSize: 13, marginBottom: 8 }}>
              <thead>
                <tr style={{ color: t.textSecondary }}>
                  <th>Source</th>
                  <th>Lane Avg</th>
                  <th>Low</th>
                  <th>High</th>
                </tr>
              </thead>
              <tbody>
                {laneData.map((row, i) => (
                  <tr key={i}>
                    <td>{row.source}</td>
                    <td>${row.laneAvg}</td>
                    <td>${row.low}</td>
                    <td>${row.high}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ height: 8, background: t.bgAlt, borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ width: `${confidence}%`, height: '100%', background: t.accent }} />
            </div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>
              {loading ? 'Calculating latest lane signal...' : 'Live quote based on selected lane.'}
            </div>
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Short Term History</div>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 8 }}>Last 30 days loads</div>
            <div style={{ height: 60, background: t.bgAlt, borderRadius: 4, marginBottom: 8, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              {shortTermHistory.map((pt, i) => (
                <div key={i} style={{ width: 20, height: Math.max(6, (pt.rate - 2500) / 16), background: t.accent, borderRadius: 2 }} title={`${pt.date}: $${pt.rate}`} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>Show filtered loads</div>
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Top Carriers</div>
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ color: t.textSecondary }}>
                  <th>Carrier</th>
                  <th>Date</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {topCarriers.map((row, i) => (
                  <tr key={i}>
                    <td>{row.carrier}</td>
                    <td>{row.date}</td>
                    <td>${row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 320, maxWidth: 400 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Quote Calculation</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: t.accent, marginBottom: 8 }}>${quote}</div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 8 }}>Confidence: <span style={{ color: t.positive }}>{confidence}%</span></div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 8 }}>Market Position: <span style={{ color: t.warning }}>{marketPosition}</span></div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input type="number" value={mileage} onChange={(e) => setMileage(Number(e.target.value) || 0)} style={{ flex: 1, padding: 6, borderRadius: 4, border: `1px solid ${t.borderLight}` }} />
              <span style={{ alignSelf: 'center', fontSize: 13 }}>miles</span>
            </div>
            {error ? <div style={{ fontSize: 12, color: t.error, marginBottom: 8 }}>{error}</div> : null}
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ background: t.positive, color: '#fff', border: 'none', borderRadius: 4, padding: '7px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Book this Rate</button>
              <button style={{ background: t.bgAlt, color: t.text, border: `1px solid ${t.border}`, borderRadius: 4, padding: '7px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Save</button>
            </div>
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Map</div>
            <GoogleMapEmbed origin={origin} destination={destination} height={160} />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 320, maxWidth: 400 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Shipment Info</div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 8 }}>Customer: <b>Parade</b></div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 8 }}>Origin: {origin}</div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 8 }}>Destination: {destination}</div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 8 }}>Equipment: {equipment}</div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 8 }}>Lane Type: {laneType}</div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 8 }}>Mileage: {mileage}</div>
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Capacity Tools</div>
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ color: t.textSecondary }}>
                  <th>Load Board</th>
                  <th>Last Posted</th>
                  <th>Requests</th>
                </tr>
              </thead>
              <tbody>
                {loadBoard.map((row, i) => (
                  <tr key={i}>
                    <td>{row.board}</td>
                    <td>{row.lastPosted}</td>
                    <td>{row.requests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
