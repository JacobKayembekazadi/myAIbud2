# Quick Start Guide - My Aibud Development

> **Last Updated:** January 7, 2026  
> **Estimated Setup Time:** 30 minutes

---

## 🎯 Prerequisites

Before you begin, ensure you have:

- [ ] **Node.js 18+** installed
- [ ] **npm** or **pnpm** package manager
- [ ] **Git** for version control
- [ ] **VS Code** (recommended) with extensions:
  - ESLint
  - Tailwind CSS IntelliSense
  - Convex

### Required Accounts

| Service | Purpose | Cost |
|---------|---------|------|
| [Convex](https://convex.dev) | Database | Free tier available |
| [Clerk](https://clerk.com) | Authentication | Free tier available |
| [WAHA Plus](https://waha.devlike.pro) | WhatsApp API | $19/month |
| [Google AI](https://ai.google.dev) | Gemini AI | Free tier available |
| [Inngest](https://inngest.com) | Background jobs | Free tier available |

---

## 🚀 Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-org/my-aibud.git
cd my-aibud

# Install dependencies
npm install
```

---

## 🔐 Step 2: Set Up Authentication (Clerk)

1. Create a [Clerk application](https://dashboard.clerk.com)
2. Enable **Email** and **Google** sign-in methods
3. Copy your API keys

Add to `.env.local`:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
CLERK_ISSUER_URL=https://your-app.clerk.accounts.dev

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_FALLBACK_REDIRECT_URL=/
```

---

## 💾 Step 3: Set Up Database (Convex)

1. Create a [Convex project](https://dashboard.convex.dev)
2. Link your local project:

```bash
npx convex dev
# Follow prompts to create/select project
```

Add to `.env.local`:
```bash
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOYMENT=prod:your-project-name
```

Deploy the schema:
```bash
npx convex deploy
```

---

## 📱 Step 4: Set Up WhatsApp API (WAHA Plus)

### Option A: Use Existing Server

If you have access to the production server:
```bash
WHATSAPP_PROVIDER=waha
WAHA_API_URL=http://49.13.153.22:3000
WAHA_API_KEY=myaibud-waha-key-2025
WAHA_WEBHOOK_SECRET=my-aibud-waha-webhook-secret
```

### Option B: Set Up Your Own Server

1. **Get a VPS** (Hetzner, DigitalOcean, etc.)
2. **Install Coolify** or Docker
3. **Deploy WAHA Plus:**

```yaml
# docker-compose.yml
version: '3.8'
services:
  waha:
    image: 'devlikeapro/waha-plus:latest'
    container_name: waha
    restart: always
    ports:
      - '3000:3000'
    environment:
      WHATSAPP_API_KEY: your-secure-api-key
      WHATSAPP_API_PORT: '3000'
      WHATSAPP_HOOK_URL: 'https://your-app.vercel.app/api/webhooks/whatsapp'
      WHATSAPP_HOOK_EVENTS: 'message,session.status'
    volumes:
      - 'waha_data:/app/.sessions'
volumes:
  waha_data: null
```

4. **Pull the image** (requires Docker Hub login):
```bash
docker login -u devlikeapro -p YOUR_TOKEN
docker pull devlikeapro/waha-plus:latest
docker-compose up -d
```

---

## 🤖 Step 5: Set Up AI (Google Gemini)

1. Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

Add to `.env.local`:
```bash
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...your-key
```

---

## ⚡ Step 6: Set Up Background Jobs (Inngest)

1. Create an [Inngest account](https://app.inngest.com)
2. Copy your event key and signing key

Add to `.env.local`:
```bash
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=signkey-prod-...
```

---

## 📝 Step 7: Complete Environment File

Your `.env.local` should look like:

```bash
# ===========================================
# WhatsApp Provider
# ===========================================
WHATSAPP_PROVIDER=waha
WAHA_API_URL=http://your-server:3000
WAHA_API_KEY=your-api-key
WAHA_WEBHOOK_SECRET=your-webhook-secret

# ===========================================
# Database (Convex)
# ===========================================
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOYMENT=prod:your-project

# ===========================================
# Authentication (Clerk)
# ===========================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_ISSUER_URL=https://your-app.clerk.accounts.dev
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_FALLBACK_REDIRECT_URL=/

# ===========================================
# AI (Google Gemini)
# ===========================================
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...

# ===========================================
# Background Jobs (Inngest)
# ===========================================
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=signkey-prod-...
```

---

## 🏃 Step 8: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ✅ Step 9: Test Core Features

### Test Authentication
1. Go to `/sign-up`
2. Create an account
3. Verify redirect to dashboard

### Test Instance Creation
1. Go to `/instances`
2. Click "Create New Instance"
3. Enter a name (e.g., "Test Instance")
4. Click "Create"

### Test QR Code Linking
1. Click "Show QR" on your instance
2. Open WhatsApp on your phone
3. Go to Settings → Linked Devices → Link a Device
4. Scan the QR code
5. Wait for status to change to "Connected"

### Test Chat Sync
1. Once connected, click "Sync Chats"
2. Go to `/chat` to see imported contacts

---

## 🌐 Step 10: Deploy to Production

### Deploy Frontend (Vercel)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Deploy Database (Convex)

```bash
npx convex deploy
```

### Update Webhook URL

In your WAHA docker-compose, update:
```yaml
WHATSAPP_HOOK_URL: 'https://your-app.vercel.app/api/webhooks/whatsapp'
```

Restart the WAHA container.

---

## 🐛 Troubleshooting

### QR Code Not Loading
- Check WAHA server is running: `curl http://your-server:3000/api/sessions`
- Verify API key is correct
- Check browser console for errors

### Instance Shows "Disconnected"
- Refresh the page (auto-syncs status)
- Try clicking "Show QR" to restart session

### Convex Errors
- Run `npx convex deploy` to sync schema
- Check Convex dashboard for logs

### Webhooks Not Working (Local)
- Webhooks only work when deployed to Vercel
- Use ngrok for local testing: `ngrok http 3000`

---

## 📚 Next Steps

1. **Read the Architecture docs:** [@docs/Architecture.md](./Architecture.md)
2. **Understand the context:** [@docs/context.md](./context.md)
3. **Check recent updates:** [@docs/updates.md](./updates.md)
4. **Review security:** [@docs/security.md](./security.md)

---

## 🆘 Getting Help

- Check existing documentation in `@docs/`
- Review the codebase in `src/`
- Check Convex dashboard for database issues
- Check Vercel logs for deployment issues

---

*Happy coding! 🚀*
