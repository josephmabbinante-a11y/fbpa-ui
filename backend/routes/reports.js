import express from 'express';
import Exception from '../models/Exception.js';
import Invoice from '../models/Invoice.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [invoices, exceptions] = await Promise.all([
      Invoice.find().sort({ createdAt: -1 }).limit(1000),
      Exception.find().sort({ createdAt: -1 }).limit(1000),
    ]);

    const monthKey = (d) => new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const monthly = invoices.reduce((acc, inv) => {
      const key = monthKey(inv.createdAt || new Date());
      if (!acc[key]) acc[key] = { month: key, invoices: 0, exceptions: 0, savings: 0 };
      acc[key].invoices += 1;
      return acc;
    }, {});

    exceptions.forEach((exc) => {
      const key = monthKey(exc.createdAt || new Date());
      if (!monthly[key]) monthly[key] = { month: key, invoices: 0, exceptions: 0, savings: 0 };
      monthly[key].exceptions += 1;
      monthly[key].savings += Number(exc.amount || 0);
    });

    const monthlySummary = Object.values(monthly)
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .slice(-6);

    const statusCounts = invoices.reduce((acc, inv) => {
      const raw = String(inv.status || 'Pending');
      const key = raw === 'Paid' ? 'Audited' : raw === 'Pending' ? 'Pending' : raw;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const invoiceTotal = Math.max(1, invoices.length);
    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: Number(((count / invoiceTotal) * 100).toFixed(1)),
    }));

    const exceptionReasonCounts = exceptions.reduce((acc, exc) => {
      const key = exc.reason || 'Other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const exceptionBreakdown = Object.entries(exceptionReasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: Number(((count / Math.max(1, exceptions.length)) * 100).toFixed(1)),
      }));

    const topCarrierSavings = exceptions.reduce((acc, exc) => {
      const carrier = exc.carrier || 'Unknown Carrier';
      acc[carrier] = (acc[carrier] || 0) + Number(exc.amount || 0);
      return acc;
    }, {});

    const topSavingsCarriers = Object.entries(topCarrierSavings)
      .map(([carrier, total]) => ({ carrier, total: Number(total.toFixed(2)) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const savingsTrend = monthlySummary.map((row, idx) => ({
      date: `M${idx + 1}`,
      savings: Math.round(row.savings || 0),
    }));

    const exceptionTrend = monthlySummary.map((row, idx) => ({
      date: `M${idx + 1}`,
      exceptions: row.exceptions || 0,
    }));

    const topCarrierTotal = Math.max(1, topSavingsCarriers.reduce((sum, row) => sum + row.total, 0));

    res.json({
      monthlySummary,
      exceptionBreakdown,
      statusDistribution,
      topSavingsCarriers,
      savingsTrend,
      exceptionTrend,
      categoryDrilldown: [
        {
          category: 'Billing Errors',
          summary: 'High-value billing exceptions requiring recovery and dispute management.',
          kpis: [
            { label: 'Findings', value: exceptions.length, note: 'Current volume' },
            {
              label: 'Recovery',
              value: topSavingsCarriers.reduce((sum, row) => sum + row.total, 0),
              format: 'currency',
              note: 'Potential recovery',
            },
          ],
          trend: savingsTrend.map((row, idx) => ({
            period: `M${idx + 1}`,
            findings: exceptionTrend[idx]?.exceptions || 0,
            recovery: row.savings,
          })),
          customers: [],
          causes: exceptionBreakdown.slice(0, 4).map((row) => ({ name: row.reason, value: row.count })),
        },
      ],
      auditMetrics: {
        freightBillAudit: [
          { metric: 'Bills Audited', value: invoices.length, trend: '', status: 'Current' },
          { metric: 'Exceptions Logged', value: exceptions.length, trend: '', status: 'Current' },
        ],
        paymentRecovery: topSavingsCarriers.slice(0, 4).map((row) => ({
          type: row.carrier,
          amount: row.total,
          percentage: Number(((row.total / topCarrierTotal) * 100).toFixed(1)),
        })),
        auditFindings: exceptionBreakdown.slice(0, 4).map((row) => ({
          category: row.reason,
          count: row.count,
          severity: row.percentage > 30 ? 'High' : row.percentage > 15 ? 'Medium' : 'Low',
          resolution: 'In Progress',
        })),
        paymentProcessing: statusDistribution.map((row) => ({
          status: row.status,
          invoices: row.count,
          percentage: row.percentage,
          amount: 0,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
