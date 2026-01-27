# Phase 2 & 3: Observability and Operational Readiness

**Status:** In Progress
**Started:** 2026-01-13
**Estimated Completion:** 2-3 days

---

## 📋 Overview

Building on Phase 1's security foundation, we're now implementing:
- **Phase 2:** Observability (logging, monitoring, dashboards)
- **Phase 3:** Operational readiness (testing, documentation, stub cleanup)

---

## 🎯 Phase 2: Observability

### 2.1 Structured Logging ✅ (In Progress)

**Goal:** Replace console.log with production-grade structured logging

**Tasks:**
- [ ] Install Pino logger (`pino`, `pino-pretty`)
- [ ] Create `src/lib/logger.ts` with configured logger
- [ ] Replace console.log calls with structured logging
- [ ] Add log levels (debug, info, warn, error)
- [ ] Add contextual metadata (requestId, userId, etc.)

**Benefits:**
- Searchable, filterable logs
- Better performance than console.log
- Integration with log aggregation tools

---

### 2.2 Request/Response Logging Middleware

**Goal:** Track all API requests for debugging and monitoring

**Tasks:**
- [ ] Create `src/middleware/logging.ts`
- [ ] Log request method, URL, headers (sanitized)
- [ ] Log response status, duration
- [ ] Add request ID for tracing
- [ ] Integrate with existing middleware

**Benefits:**
- Full visibility into API traffic
- Performance tracking per endpoint
- Request correlation for debugging

---

### 2.3 Monitoring Dashboard Setup

**Goal:** Centralized view of system health

**Tasks:**
- [ ] Configure Inngest dashboard monitoring
- [ ] Set up Vercel Analytics (built-in)
- [ ] Configure Sentry performance monitoring
- [ ] Optional: Set up uptime monitoring (UptimeRobot)

**Benefits:**
- Real-time system health visibility
- Proactive issue detection
- Performance insights

---

## 🔧 Phase 3: Operational Readiness

### 3.1 Complete or Remove Stub Features

**Current Stubs:**
1. `src/inngest/functions/poll-manager.ts` - TODO stub
2. `src/inngest/functions/vision-estimator.ts` - TODO stub
3. `src/inngest/functions/billing-guard.ts` - Empty export

**Decision Matrix:**

| Feature | Priority | Action | Effort |
|---------|----------|--------|--------|
| **poll-manager** | Low | Remove (not needed yet) | 5 min |
| **vision-estimator** | Medium | Implement basic version | 1 hour |
| **billing-guard** | High | Implement credit checking | 30 min |

**Tasks:**
- [ ] Remove poll-manager (not needed for MVP)
- [ ] Implement vision-estimator for image analysis
- [ ] Implement billing-guard for credit enforcement
- [ ] Update Inngest route registration

---

### 3.2 Testing Infrastructure

**Goal:** Basic test coverage for critical paths

**Tasks:**
- [ ] Install Jest & React Testing Library
- [ ] Configure `jest.config.js`
- [ ] Add test scripts to `package.json`
- [ ] Write tests for critical utilities:
  - [ ] `src/lib/errors.ts` - Error handling
  - [ ] `src/lib/ratelimit.ts` - Rate limiting
  - [ ] `src/lib/whatsapp/waha.ts` - Webhook verification
- [ ] Target: 30-40% coverage initially

**Benefits:**
- Catch regressions before deployment
- Confidence in refactoring
- Documentation via tests

---

### 3.3 Health Check Endpoint

**Goal:** Vercel and monitoring tools can check if app is healthy

**Tasks:**
- [ ] Create `src/app/api/health/route.ts`
- [ ] Check database connection (Convex)
- [ ] Check Redis connection (Upstash)
- [ ] Check Inngest connectivity
- [ ] Return JSON with status + details

**Benefits:**
- Automated health monitoring
- Quick debugging of connectivity issues
- Integration with uptime monitors

---

### 3.4 Documentation

**Goal:** Complete operational documentation

**Tasks:**
- [ ] Create `RUNBOOK.md` - Incident response procedures
- [ ] Create `DEPLOYMENT.md` - Deployment procedures
- [ ] Update `README.md` - Project overview
- [ ] Document rollback procedures
- [ ] Add troubleshooting guide

**Benefits:**
- Faster incident response
- Onboarding new team members
- Reduced debugging time

---

## 📊 Success Criteria

### Phase 2 Complete When:
- [ ] All logs use structured logging (no console.log in production)
- [ ] Request/response logging captures all API calls
- [ ] Monitoring dashboards configured and accessible
- [ ] Logs are searchable and include context

### Phase 3 Complete When:
- [ ] All stub features implemented or removed
- [ ] 30%+ test coverage on critical paths
- [ ] Health check endpoint returns accurate status
- [ ] Complete operational documentation
- [ ] Deployment can be done by following docs alone

---

## 🗓️ Implementation Timeline

### Day 1 (Today)
- [x] Plan Phase 2 & 3
- [ ] Structured logging setup
- [ ] Remove poll-manager stub
- [ ] Implement billing-guard

### Day 2
- [ ] Request/response logging
- [ ] Implement vision-estimator
- [ ] Health check endpoint
- [ ] Test infrastructure setup

### Day 3
- [ ] Write critical path tests
- [ ] Monitoring dashboards
- [ ] Operational documentation
- [ ] Final verification

---

## 🚀 Let's Start!

**Next Immediate Steps:**
1. Set up structured logging (30 min)
2. Remove poll-manager stub (5 min)
3. Implement billing-guard (30 min)

Ready to begin? I'll start with structured logging!
