#!/usr/bin/env node
/**
 * RELT Quickstart — Webhook Receiver
 * 
 * This server receives inbound WhatsApp events (messages, status updates, etc.)
 * from Relt and logs them to the console.
 * 
 * Usage:
 *   1. Copy .env.example to .env
 *   2. Set WEBHOOK_PORT (default: 3000)
 *   3. Set WEBHOOK_SECRET (get from https://relt.dev/dashboard/webhooks)
 *   4. Run: npm run webhook
 *   5. Expose your local server with ngrok:
 *        ngrok http 3000
 *   6. Register the ngrok URL as a webhook in the Relt dashboard
 *   7. Send a message to your WhatsApp number
 *   8. Watch the events arrive in your terminal!
 * 
 * Events you'll see:
 *   - message.received (inbound messages from users)
 *   - message.sent (your outbound messages)
 *   - message.delivered (message delivered to WhatsApp)
 *   - message.read (message read by user)
 *   - message.failed (message failed to send)
 */

import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';

const app = express();
const port = parseInt(process.env.WEBHOOK_PORT || '3000', 10);
const webhookSecret = process.env.WEBHOOK_SECRET;

// Parse JSON bodies
app.use(express.json());

/**
 * Verify webhook signature (HMAC-SHA256)
 * 
 * Relt signs every webhook payload with your webhook secret.
 * This ensures the request actually came from Relt and wasn't tampered with.
 */
function verifySignature(payload: string, signature: string): boolean {
  if (!webhookSecret) {
    console.warn('⚠️  WEBHOOK_SECRET not set — skipping signature verification');
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * POST /webhook
 * 
 * Relt sends all events to this endpoint.
 */
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-relt-signature'] as string;
  const rawBody = JSON.stringify(req.body);

  // Verify signature
  if (signature && !verifySignature(rawBody, signature)) {
    console.error('❌ Invalid webhook signature');
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const event = req.body;

  // Log the event
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📨 Event received: ${event.type || 'unknown'}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Event ID:', event.id);
  console.log('Timestamp:', event.timestamp);
  console.log('Organization:', event.organizationId);
  console.log('');

  // Handle different event types
  switch (event.type) {
    case 'message.received':
      console.log('📥 Inbound message received');
      console.log('   From:', event.data.from);
      console.log('   To:', event.data.to);
      console.log('   Message:', event.data.text);
      console.log('');
      console.log('💡 Tip: You can reply programmatically using the SDK:');
      console.log('   const relt = new Relt({ apiKey: process.env.RELT_API_KEY });');
      console.log('   await relt.messages.send({ to: event.data.from, text: "Thanks!" });');
      break;

    case 'message.sent':
      console.log('📤 Outbound message sent');
      console.log('   To:', event.data.to);
      console.log('   Message ID:', event.data.messageId);
      break;

    case 'message.delivered':
      console.log('✓ Message delivered to WhatsApp');
      console.log('   Message ID:', event.data.messageId);
      break;

    case 'message.read':
      console.log('👁️  Message read by user');
      console.log('   Message ID:', event.data.messageId);
      break;

    case 'message.failed':
      console.log('❌ Message failed to send');
      console.log('   Message ID:', event.data.messageId);
      console.log('   Error:', event.data.error);
      break;

    default:
      console.log('ℹ️  Unknown event type');
      console.log('   Raw event:', JSON.stringify(event, null, 2));
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Always respond with 200 OK
  // If you don't respond quickly, Relt will retry the webhook
  res.status(200).json({ received: true });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 RELT Webhook Receiver is running');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Webhook endpoint: http://localhost:${port}/webhook`);
  console.log(`  Health check:     http://localhost:${port}/health`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Expose your local server to the internet:');
  console.log('     $ ngrok http ' + port);
  console.log('');
  console.log('  2. Copy the ngrok URL (e.g., https://abc123.ngrok.io/webhook)');
  console.log('');
  console.log('  3. Register it as a webhook in the Relt dashboard:');
  console.log('     https://relt.dev/dashboard/webhooks');
  console.log('');
  console.log('  4. Send a message to your WhatsApp number');
  console.log('');
  console.log('  5. Watch the events arrive here! 🎉');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});
