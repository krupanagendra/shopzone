# OmniKart AI — Production Polish Task Tracker

## Phase 1: Backend Bug Fixes & Edge Cases
- [/] Set up Redis on Windows
- [ ] Fix orderAgent.js — double-save race condition, idempotency
- [ ] Fix pricingAgent.js — redundant condition, memory usage
- [ ] Fix emailAgent.js — dedup, null safety, consolidate email config
- [ ] Fix queues/index.js — memory management, error handling
- [ ] Fix scheduler.js — demo mode, jobId
- [ ] Consolidate email to GMAIL_USER only

## Phase 2: System Monitoring
- [ ] Fix dashboard-stats — real MongoDB aggregation
- [ ] Add agent health endpoint
- [ ] Add manual agent trigger endpoint
- [ ] Add server uptime tracking

## Phase 3: Email Template Enhancement
- [ ] Add more email templates
- [ ] Update sender branding

## Phase 4: Frontend Admin Dashboard
- [ ] Replace alert() with inline AI response
- [ ] Add AI logs pagination
- [ ] Build AdminAIAgents page
- [ ] Add system health section
- [ ] Update AdminLayout sidebar
- [ ] Update App.jsx routes
- [ ] Update api.js

## Phase 5: Order Tracking UI
- [ ] Enhanced order detail page

## Phase 6: Performance & DB Optimization
- [ ] Aggregation pipeline for revenue
- [ ] BulkWrite for stock updates
- [ ] Remove deprecated Mongoose options

## Phase 7: Deployment Setup
- [ ] Complete .env.example
- [ ] Add NODE_ENV handling

## Phase 8: Documentation
- [ ] README.md rewrite
- [ ] DEMO_SCRIPT.md
- [ ] INTERVIEW_PREP.md

## Phase 9: Test Script
- [ ] test-scenarios.js
