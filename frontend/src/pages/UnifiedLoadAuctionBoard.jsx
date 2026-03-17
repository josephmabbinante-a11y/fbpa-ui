import { lazy, Suspense, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import BrowseAndBid from './BrowseAndBid';
import MyActivity from './MyActivity';
import BoardConnections from './BoardConnections';

const LoadManagement = lazy(() => import('./LoadManagement'));

export default function UnifiedLoadAuctionBoard() {
  const { theme } = useTheme();
  const t = theme || {};
  const location = useLocation();
  const navigate = useNavigate();

  const activeSection = useMemo(() => {
    if (location.pathname.startsWith('/load-board/new-shipment')) return 'post-auction';
    if (location.pathname.startsWith('/load-board/my-activity')) return 'my-activity';
    if (location.pathname.startsWith('/load-board/connections')) return 'connections';
    if (location.pathname === '/auction-board') return 'browse-bid';
    return 'browse-bid';
  }, [location.pathname]);

  const tabButtonStyle = (isActive) => ({
    border: `1px solid ${isActive ? t.accent : t.border}`,
    background: isActive ? `${t.accent}22` : t.surface,
    color: isActive ? t.accent : t.text,
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  });

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {/* Header */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>🚛 Freight Exchange</div>
        <div style={{ fontSize: 13, color: t.textSecondary }}>
          Post loads, browse freight from DAT, Truckstop, Saia &amp; internal board — bid, auction, and manage all in one place.
        </div>
      </div>

      {/* Nav Tabs */}
      <div
        style={{
          position: 'sticky',
          top: 8,
          zIndex: 30,
          display: 'flex',
          gap: 8,
          width: 'fit-content',
          padding: 4,
          borderRadius: 10,
          border: `1px solid ${t.border}`,
          background: t.bgAlt,
          boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/load-board')}
          style={tabButtonStyle(activeSection === 'browse-bid')}
          aria-pressed={activeSection === 'browse-bid'}
        >
          📦 Browse &amp; Bid
        </button>
        <button
          type="button"
          onClick={() => navigate('/load-board/new-shipment')}
          style={tabButtonStyle(activeSection === 'post-auction')}
          aria-pressed={activeSection === 'post-auction'}
        >
          ➕ Post &amp; Auction
        </button>
        <button
          type="button"
          onClick={() => navigate('/load-board/my-activity')}
          style={tabButtonStyle(activeSection === 'my-activity')}
          aria-pressed={activeSection === 'my-activity'}
        >
          📋 My Activity
        </button>
        <button
          type="button"
          onClick={() => navigate('/load-board/connections')}
          style={tabButtonStyle(activeSection === 'connections')}
          aria-pressed={activeSection === 'connections'}
        >
          🔌 Board Connections
        </button>
      </div>

      {/* Content */}
      {activeSection === 'post-auction' ? (
        <Suspense fallback={<div style={{ padding: 24, color: t.textSecondary }}>Loading...</div>}>
          <LoadManagement pageTitle="Post & Auction" activeTab="load-basics" />
        </Suspense>
      ) : activeSection === 'my-activity' ? (
        <MyActivity />
      ) : activeSection === 'connections' ? (
        <BoardConnections />
      ) : (
        <BrowseAndBid />
      )}
    </div>
  );
}
