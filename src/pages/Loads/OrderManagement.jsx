
import React, { useState } from 'react';

const initialOrders = [
  {
    id: 'ORD-1001',
    customer: 'MetroMart',
    status: 'In Warehouse',
    shippingStatus: 'Ready to Ship',
    warehouseStatus: 'Staged',
    tracking: [
      { event: 'Order Received', timestamp: '2026-02-25 09:00' },
      { event: 'In Warehouse', timestamp: '2026-02-25 10:00' },
      { event: 'Ready for Shipment', timestamp: '2026-02-26 08:00' },
    ],
  },
  {
    id: 'ORD-1002',
    customer: 'Nordex',
    status: 'In Warehouse',
    shippingStatus: 'Not Ready',
    warehouseStatus: 'Receiving',
    tracking: [
      { event: 'Order Received', timestamp: '2026-02-25 11:00' },
      { event: 'In Warehouse', timestamp: '2026-02-25 12:00' },
    ],
  },
];

function ShippingStatusPage({ orders, onBack }) {
  return (
    <div style={{ padding: 16 }}>
      <h3>Order Shipping Status Tracking</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Shipping Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer}</td>
              <td>{order.shippingStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onBack}>Back to Orders</button>
    </div>
  );
}

function WarehouseTrackingPage({ orders, onBack }) {
  return (
    <div style={{ padding: 16 }}>
      <h3>In-Warehouse Shipment Readiness</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Warehouse Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer}</td>
              <td>{order.warehouseStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onBack}>Back to Orders</button>
    </div>
  );
}

export default function OrderManagement() {
  const [orders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [subPage, setSubPage] = useState('main');

  if (subPage === 'shipping') {
    return <ShippingStatusPage orders={orders} onBack={() => setSubPage('main')} />;
  }
  if (subPage === 'warehouse') {
    return <WarehouseTrackingPage orders={orders} onBack={() => setSubPage('main')} />;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Order Management System</h2>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setSubPage('shipping')} style={{ marginRight: 8 }}>
          Shipping Status Tracking
        </button>
        <button onClick={() => setSubPage('warehouse')}>
          In-Warehouse Tracking
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Shipping Status</th>
            <th>Warehouse Status</th>
            <th>Track</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer}</td>
              <td>{order.status}</td>
              <td>{order.shippingStatus}</td>
              <td>{order.warehouseStatus}</td>
              <td>
                <button onClick={() => setSelectedOrder(order)}>
                  View Tracking
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedOrder && (
        <div style={{ background: '#f8f9fa', border: '1px solid #ccc', borderRadius: 6, padding: 16, marginBottom: 16 }}>
          <h3>Tracking for {selectedOrder.id}</h3>
          <ul>
            {selectedOrder.tracking.map((t, idx) => (
              <li key={idx}>
                <b>{t.event}</b> <span style={{ color: '#888', marginLeft: 8 }}>{t.timestamp}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => setSelectedOrder(null)}>Close</button>
        </div>
      )}
    </div>
  );
}
