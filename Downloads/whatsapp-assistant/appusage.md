# My Aibud - Application Usage Guide

This guide explains how to use the **My Aibud** WhatsApp Assistant.

## 1. Prerequisites

- **Clerk Account**: You need to sign in to the application.
- **WhatsApp Account**: You need a phone with WhatsApp installed to scan the QR code.

## 2. Getting Started

1.  **Sign In**: Go to the app URL (e.g., `https://my-aibud.vercel.app`) and click "Sign In".
2.  **Dashboard**: Once signed in, you will see the main dashboard with statistics (Credits, Active Instances, etc.).

## 3. Connecting WhatsApp

To let the AI manage your WhatsApp:

1.  Navigate to the **Instances** tab in the sidebar (or top menu).
2.  **Create Instance**:
    - Enter a name for your instance (e.g., "My Business Phone").
    - Click **Create**.
3.  **Scan QR Code**:
    - Locate your new instance in the list.
    - Click the **Show QR** button.
    - Open WhatsApp on your phone -> Settings -> Linked Devices -> Link a Device.
    - Scan the QR code displayed on the screen.
    - The status should change to `connected`.

## 4. How the AI Works

Once connected, **My Aibud** listens for incoming messages.

- **Inbound Messages**: When someone messages you, the AI receives the text.
- **AI Processing**:
    - The AI analyzes the conversation history.
    - It generates a helpful, professional response using Gemini.
    - It checks if you have enough **Credits**.
- **Outbound Reply**: The AI automatically sends the reply back to the user on WhatsApp.

> **Note**: The AI currently responds to *all* incoming messages.

## 5. Credits System

- Every AI response consumes **1 Credit**.
- You can view your remaining credits on the Home Dashboard.
- If credits run out, the AI will stop responding until more credits are added.

## 6. Troubleshooting

- **QR Code Not Loading**: If the QR code doesn't appear, try refreshing the page or clicking "Show QR" again.
- **Messages Not Sending**:
    - Check if your instance status is `connected`.
    - Check if you have Credits remaining.
    - Ensure your phone is connected to the internet.

## 7. Configuration (Admin)

If you are the administrator deploying the app:

- **Switching Providers**: You can switch between WAHA, Evolution API, and Cloud API by changing the `WHATSAPP_PROVIDER` environment variable in Vercel.
- **Webhooks**: Ensure your WhatsApp provider's webhook is pointing to `https://your-app-url.com/api/webhooks/whatsapp`.
