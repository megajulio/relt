# RELT Quickstart

Get from npm install to your first WhatsApp message in under 5 minutes.

## What's Inside

- **send-message.ts** — Send your first WhatsApp message
- **webhook-receiver.ts** — Receive inbound messages and events
- **.env.example** — Configuration template

## Prerequisites

- Node.js 18+
- A Relt account: https://relt.dev/register
- An API key: https://relt.dev/dashboard/api-keys

## Quick Start

### 1. Clone and install

    git clone https://github.com/relt/quickstart.git
    cd quickstart
    npm install

### 2. Configure environment

    cp .env.example .env

Edit .env:

    RELT_API_KEY=relt_live_your_api_key_here
    TEST_PHONE=+573001234567

### 3. Send your first message

    npm run send

Expected output:

    ✓ Message queued successfully
      Message ID: msg_xxxxxxxxx
      Status: queued

Check your WhatsApp app — the message should arrive within seconds.

### 4. Receive inbound messages (webhooks)

    npm run webhook

In another terminal, expose your local server:

    ngrok http 3000

Register the ngrok URL at https://relt.dev/dashboard/webhooks,
then reply to your message and watch events arrive:

    📨 Event received: message.received
    📥 Inbound message received
       From: +573001234567
       Message: Thanks for the message!

## Troubleshooting

### ❌ Missing RELT_API_KEY
Copy .env.example to .env and add your key.

### ❌ 401 Authentication failed
Your key is invalid or revoked. Create a new one in the dashboard.

### ❌ 400 Invalid phone number
Use E.164 format: +573001234567 (no spaces or dashes).

### ❌ 429 Rate limit exceeded
Wait and retry. Check limits in the dashboard.

### ❌ Webhooks not arriving
1. Is ngrok running? (ngrok http 3000)
2. Is the webhook URL registered in the dashboard?
3. Is WEBHOOK_SECRET set in .env?
4. Is the receiver running? (npm run webhook)

## Next Steps

- SDK docs: https://relt.dev/docs/sdk
- Webhook events: https://relt.dev/docs/webhooks
- Message lifecycle: https://relt.dev/docs/messages

## Support

- Docs: https://relt.dev/docs
- Email: support@relt.dev

## License

MIT © Relt
