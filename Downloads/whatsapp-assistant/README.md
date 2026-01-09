# My Aibud - WhatsApp AI Assistant

> **AI-Powered Real Estate Lead Automation via WhatsApp**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-Database-orange)](https://convex.dev/)
[![WAHA Plus](https://img.shields.io/badge/WAHA-Plus-green)](https://waha.devlike.pro/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-purple)](https://clerk.com/)

---

## 🎯 What is My Aibud?

My Aibud is a SaaS platform that helps real estate agents automate WhatsApp conversations with leads. The AI assistant:

- 📱 **Manages multiple WhatsApp instances** per user
- 🤖 **Auto-responds to leads** using AI (Gemini)
- 📊 **Qualifies leads** through polls and conversations
- 📸 **Analyzes property photos** with Vision AI
- 📢 **Sends bulk campaigns** to contact lists using XLSX/CSV

---

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 16 (App Router) |
| **Database** | Convex |
| **Auth** | Clerk |
| **WhatsApp API** | WAHA Plus |
| **AI** | Google Gemini (Flash & Pro) |
| **Queue** | Inngest |
| **UI** | Shadcn/ui + Tailwind + Lucide Icons |
| **Hosting** | Vercel + Hetzner |

---

## ✅ Features (January 2026 Update)

- [x] **Premium UI/UX:** High-end dark theme dashboard with analytics and glassmorphism.
- [x] **Collapsible Sidebar:** Optimized real estate for managing multiple tools.
- [x] **Premium Auth:** ProPilot-style split-screen authentication with brand storytelling.
- [x] **WAHA Plus Integration:** Multi-instance WhatsApp management on Hetzner VPS.
- [x] **Excel Support:** Bulk campaign messaging with .xlsx and .xls file support.
- [x] **AI Configuration:** Granular control over AI model, temperature, and auto-reply settings.
- [x] **Quick Replies:** Template system for managing repetitive responses.

---

## 🚀 Deployment

The system is currently deployed to production. Follow the [deployment-guide.md](@docs/deployment-guide.md) for environment configuration and webhook setup.

### Vercel
- GitHub linked deployment
- Automatic builds on push to `master`

### WhatsApp API (Hetzner)
- **IP:** 49.13.153.22
- **Port:** 3000
- Managed via Coolify

---

## 📚 Documentation

Detailed documentation is available in the `@docs/` folder:

- **[context.md](@docs/context.md)** - Project overview and status
- **[Architecture.md](@docs/Architecture.md)** - Full technical deep dive
- **[updates.md](@docs/updates.md)** - Detailed version history
- **[deployment-guide.md](@docs/deployment-guide.md)** - Production setup instructions

---

## 🔐 Security

- All routes protected by Clerk authentication
- Strict multi-tenant data isolation in Convex
- HMAC signature verification for all WhatsApp webhooks
- Environment variables for all production secrets

---

## 📄 License

Proprietary - All rights reserved.

---

*Built with ❤️ for real estate professionals*
