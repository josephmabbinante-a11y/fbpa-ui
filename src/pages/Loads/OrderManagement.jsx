import React, { useState } from 'react';

const initialOrders = [
  {
    id: 'ORD-1001',
    customer: 'MetroMart',
    status: 'In Warehouse',
    shippingStatus: 'Ready to Ship',
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
    tracking: [
      { event: 'Order Received', timestamp: '2026-02-25 11:00' },
      { event: 'In Warehouse', timestamp: '2026-02-25 12:00' },
    ],
  },
];

export default function OrderManagement() {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <div style={{ padding: 20 }}>
      <h2>Order Management System</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Shipping Status</th>
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
