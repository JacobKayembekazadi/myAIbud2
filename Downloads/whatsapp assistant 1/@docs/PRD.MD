 Product Requirements Document (PRD) - My Aibud

## Executive Summary

My Aibud is a subscription-based AI Real Estate Assistant that automates WhatsApp prospecting for real estate agents. The system prevents leads from going cold by providing intelligent, context-aware conversations that qualify prospects, collect property photos for AI analysis, and schedule appointments.

## Problem Statement

Real estate agents struggle with:
- **Lead follow-up consistency:** Manual WhatsApp conversations often fall through the cracks
- **Lead qualification inefficiency:** Time-consuming back-and-forth to understand prospect needs
- **Property valuation challenges:** Difficulty getting accurate property assessments without site visits
- **Scalability limitations:** One agent can only handle so many concurrent conversations

## Solution Overview

My Aibud provides AI-powered WhatsApp automation with:
- **Poll-based lead qualification:** Frictionless prospect classification
- **Vision AI property analysis:** Instant valuation estimates from photos
- **Automated conversation flows:** Context-aware responses based on lead status
- **Credit-based subscription model:** Predictable costs with strict usage limits

## Target Users

### Primary User: Real Estate Agents
- **Profile:** Independent agents, small teams, brokerage firms
- **Pain Points:** Lead management, follow-up consistency, time efficiency
- **Goals:** More qualified leads, faster conversions, scalable prospecting

### Secondary User: Property Sellers/Homeowners
- **Profile:** Homeowners interested in selling or renting
- **Touchpoints:** WhatsApp polls, photo submissions, AI conversations
- **Value:** Convenient property valuation without agent visits

## Core Features

### 1. WhatsApp Integration (Evolution API)
- **Instance Management:** Create and manage WhatsApp business instances
- **QR Code Setup:** Easy WhatsApp Web connection
- **Webhook Processing:** Real-time message and poll response handling

### 2. AI-Powered Conversation Engine
- **Poll-Based Qualification:**
  - "I'm Interested" → Hot lead qualification flow
  - "I'd Like to Sell/Rent" → Property photo collection
  - "Have an Agent" → Polite disengagement
  - "Schedule Call" → Priority calendar booking
  - "Not Interested" → Archive and stop messaging

- **Context-Aware Responses:** AI generates personalized replies based on lead status and conversation history

### 3. Vision AI Property Analysis
- **Photo Processing:** Accepts property photos via WhatsApp
- **AI Analysis:** Identifies room types, features, and condition
- **Valuation Estimates:** Provides instant property assessments
- **Follow-up Questions:** Generates contextual next steps

### 4. Subscription & Billing System
- **Tiered Pricing:**
  - Starter: 400 credits/month (R399)
  - Pro: 1,200 credits/month (R799)
  - Business: 5,000 credits/month (R1,999)
  - Enterprise: Unlimited (Custom)

- **Credit System:** One credit = One AI interaction (inbound processing + outbound reply)
- **Usage Tracking:** Real-time monitoring and alerts
- **Auto-blocking:** Prevents overspending with hard limits

## Technical Requirements

### Tech Stack
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Server Actions
- **Database:** PostgreSQL with Drizzle ORM
- **Queue System:** Inngest for durable background processing
- **AI:** Google Gemini Pro 1.5 / Flash 2.0, Vision AI
- **WhatsApp:** Evolution API
- **Authentication:** Clerk
- **UI Components:** Shadcn/ui

### System Architecture
- **Serverless-first:** Vercel deployment with automatic scaling
- **Event-driven:** All background processing via Inngest
- **Microservices pattern:** Separated concerns for reliability
- **Database-first:** All state persisted to PostgreSQL

### Performance Requirements
- **Response Time:** < 3 seconds for AI-generated replies
- **Uptime:** 99.9% availability
- **Concurrent Users:** Support 100+ simultaneous conversations
- **Message Throughput:** 1000+ messages/hour per instance

### Security Requirements
- **Data Encryption:** End-to-end encryption for all stored data
- **API Security:** Rate limiting, input validation, authentication
- **Compliance:** GDPR compliant data handling
- **Access Control:** Tenant isolation, role-based permissions

## User Experience Requirements

### Agent Dashboard
- **Instance Management:** Create, configure, and monitor WhatsApp instances
- **Contact Overview:** View all leads with status and conversation history
- **Usage Analytics:** Real-time credit usage and billing information
- **Message History:** Complete conversation logs with AI decisions

### WhatsApp Experience
- **Seamless Integration:** Native WhatsApp feel with AI enhancements
- **Poll Interactions:** Easy tap-to-respond qualification
- **Photo Sharing:** Simple attachment and instant AI analysis
- **Contextual Responses:** Natural, personalized AI conversations

## Business Requirements

### Revenue Model
- **Subscription-based:** Monthly recurring revenue
- **Usage-based Limits:** Hard credit caps prevent overspending
- **Tier Progression:** Clear upgrade paths and value propositions

### Success Metrics
- **User Acquisition:** Monthly active tenants
- **Retention:** Subscription renewal rates (>85%)
- **Usage:** Average credits consumed per tenant
- **Satisfaction:** NPS scores and qualitative feedback

### Go-to-Market Strategy
- **Target Market:** South African real estate agents
- **Pricing Strategy:** Freemium with clear upgrade triggers
- **Sales Channels:** Direct website, agent networks, social selling

## Implementation Roadmap

### Phase 1: MVP Core (8 weeks)
- [ ] WhatsApp integration with Evolution API
- [ ] Basic poll qualification system
- [ ] Simple AI response generation
- [ ] Dashboard for instance management
- [ ] Credit system and billing

### Phase 2: AI Enhancement (6 weeks)
- [ ] Vision AI property analysis
- [ ] Advanced conversation flows
- [ ] Context-aware response generation
- [ ] Performance optimization

### Phase 3: Enterprise Features (8 weeks)
- [ ] Multi-instance management
- [ ] Advanced analytics and reporting
- [ ] CRM integrations
- [ ] White-label options

## Risk Assessment

### Technical Risks
- **WhatsApp API Changes:** Evolution API compatibility
- **AI Model Availability:** Google Gemini service reliability
- **Message Delivery:** WhatsApp delivery rate fluctuations

### Business Risks
- **Market Adoption:** Real estate agent technology adoption
- **Competition:** Alternative WhatsApp automation solutions
- **Regulatory:** WhatsApp business policy changes

### Mitigation Strategies
- **Technical:** Comprehensive testing, fallback mechanisms, monitoring
- **Business:** Pilot program, user feedback integration, competitive analysis

## Success Criteria

### Launch Readiness
- [ ] All core features functional and tested
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation complete

### Business Success
- [ ] 50+ paying tenants within 6 months
- [ ] >90% monthly retention rate
- [ ] Positive user feedback and feature requests

---

*This PRD serves as the comprehensive guide for My Aibud development and launch.*
