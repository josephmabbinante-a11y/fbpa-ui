# FBPA v1.2 Structure (Invoice-First, Finance-Centric)

## Sidebar Navigation (Order)

1. **Dashboard**
2. **Invoices**
3. **Uploads**
4. **Exceptions**
5. **Finance**
    - AP (Carrier Pay)
    - AR (if broker)
    - Aging
6. **Analytics**
    - Spend Reports
    - Carrier Performance
    - Lane Intelligence
7. **CRM**
    - Carriers
    - Customers
8. **Tools**
    - Rate Logic Tool
9. **Account**

---

## Dashboard (Financial Command Center)
- Total Freight Spend (MTD)
- Overcharges Detected
- Open Exceptions
- Carrier Payable Total
- Customer Receivable Total
- Avg Margin %
- Top 5 Overbilling Carriers

---

## Invoices (Primary Engine)
- Carrier Invoice Intake
- Auto-match to shipment
- Rate validation
- Accessorial validation
- Variance detection
- Duplicate detection
- Approval workflow
- Audit trail log

---

## Uploads (Automation Gateway)
- Bulk invoice upload
- POD upload
- Rate confirmation upload
- CSV import
- (OCR parsing: future)

---

## Exceptions (Differentiator)
- Auto-create exception if:
    - Invoice > agreed rate
    - Duplicate invoice #
    - Fuel mismatch
    - Accessorial mismatch
    - No POD attached
- Exception fields:
    - Type
    - Dollar impact
    - Assigned user
    - Resolution status

---

## Finance (FBPA Core)
- **AP (Carrier Pay):** Approved, Exception hold, Ready to Pay, Paid
- **AR (if broker):** Margin tracking, Receivables
- **Aging:** 0–30, 31–60, 61–90, 90+, Cash exposure

---

## Analytics (Spend Intelligence)
- Spend by Carrier
- Spend by Lane
- Accessorial Breakdown
- Overcharge Frequency
- Audit Recovery Amount

---

## CRM (Supporting)
- Carriers: Compliance, performance
- Customers: Revenue, margin, credit

---

## Tools
- Rate Logic Tool

---

## Account
- Profile, Team, Billing, Integrations, API Keys, Preferences

---

## Shipments (Reference Only)
- Lane, Agreed rate, Customer, Carrier, Accessorials
- Used only for invoice validation

---

## Not Included in v1.2
- Load board, dispatch, e-signatures, marketplace, team collaboration

---

**Positioning:**
- For Brokers: Margin Protection Engine
- For Shippers: Freight Spend Recovery Platform
- For Owner Ops: AR/AP Reconciliation Tool
