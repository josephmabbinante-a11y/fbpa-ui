# TMS Pre-Flight Deployment Checklist

## 1. Smoke Tests (Happy Path)
- [ ] User can log in (test with real credentials)
- [ ] Load creation works (test with valid data)
- [ ] Rate calculation succeeds (test with typical shipment)
- [ ] Key integrations (ELD, GPS, Carrier APIs) respond as expected
- [ ] No critical errors in logs after test actions

## 2. Rollback Plan
- [ ] Previous stable build is available and tested
- [ ] Rollback script/process documented and accessible
- [ ] Rollback can be triggered in under 60 seconds
- [ ] Database migrations are reversible or backup is ready

## 3. Zero-Downtime Deployment
- [ ] Blue-Green or Canary deployment configured
- [ ] Health checks pass for new (Green) environment
- [ ] Traffic switch is automated and monitored
- [ ] Old (Blue) environment remains available until Green is confirmed

## 4. Security Audit
- [ ] Run vulnerability scan (OWASP Top 10, Snyk, etc.)
- [ ] All API keys/secrets managed via Secret Manager (not hardcoded)
- [ ] Access controls reviewed (least privilege for users/services)
- [ ] TLS/SSL enabled for all endpoints
- [ ] Audit logs enabled and accessible

## 5. Log & Monitoring Setup
- [ ] Log aggregation (Datadog, ELK, etc.) is active
- [ ] Alerts configured for 500 errors, slow queries, integration failures
- [ ] Correlation IDs traceable across frontend, backend, and DB

## 6. Database & Performance
- [ ] Indexes reviewed for critical tables (loads, shipments, users)
- [ ] No full table scans in production queries
- [ ] Circuit breakers/fallbacks for external APIs
- [ ] Input validation enforced (no script/invalid data injection)

## 7. Documentation & Communication
- [ ] Deployment steps documented and accessible
- [ ] Team notified of deployment window and rollback plan
- [ ] Stakeholders informed of expected downtime (if any)
