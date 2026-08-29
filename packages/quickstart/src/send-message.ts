#!/usr/bin/env node
/**
 * RELT Quickstart — Send your first WhatsApp message
 * 
 * Usage:
 *   1. Copy .env.example to .env
 *   2. Add your RELT_API_KEY (get it from https://relt.dev/dashboard/api-keys)
 *   3. Set TEST_PHONE to a valid phone number in E.164 format
 *   4. Run: npm run send
 * 
 * Expected output:
 *   ✓ Message queued successfully
 *   Message ID: msg_xxxxxxxxx
 *   Status: queued
 */

import 'dotenv/config';
import { Relt } from '@relt/sdk';

// Validate environment variables
const apiKey = process.env.RELT_API_KEY;
const testPhone = process.env.TEST_PHONE;

if (!apiKey) {
  console.error('❌ Missing RELT_API_KEY');
  console.error('   Get your API key from: https://relt.dev/dashboard/api-keys');
  console.error('   Add it to your .env file as: RELT_API_KEY=relt_live_xxxxx');
  process.exit(1);
}

if (!testPhone) {
  console.error('❌ Missing TEST_PHONE');
  console.error('   Add a phone number in E.164 format to your .env file');
  console.error('   Example: TEST_PHONE=+573001234567');
  process.exit(1);
}

// Initialize Relt SDK
const relt = new Relt({
  apiKey,
  baseUrl: process.env.RELT_API_BASE_URL || 'https://api.relt.dev',
});

async function main() {
  console.log('🚀 Sending WhatsApp message via Relt...');
  console.log(`   To: ${testPhone}`);
  console.log(`   Message: Hello from Relt Quickstart!`);
  console.log('');

  try {
    const response = await relt.messages.send({
      to: testPhone,
      text: 'Hello from Relt Quickstart! 🚀\n\nThis message was sent using the Relt SDK.',
    });

    console.log('✓ Message queued successfully');
    console.log(`  Message ID: ${response.data.id}`);
    console.log(`  Status: ${response.data.status}`);
    console.log(`  Created: ${response.data.createdAt}`);
    console.log('');
    console.log('📱 Check your WhatsApp app — the message should arrive shortly.');
    console.log('');
    console.log('Next steps:');
    console.log('  → Reply to the message to test webhooks');
    console.log('  → Run "npm run webhook" to receive inbound messages');
    console.log('  → Visit https://relt.dev/dashboard to view message history');
  } catch (error: any) {
    console.error('❌ Failed to send message');
    console.error('');
    
    if (error.status === 401) {
      console.error('   Authentication failed');
      console.error('   → Check that RELT_API_KEY is correct');
      console.error('   → Verify the key hasn\'t been revoked in the dashboard');
    } else if (error.status === 400) {
      console.error('   Validation error');
      console.error(`   → ${error.body?.detail || error.message}`);
      console.error('   → Ensure TEST_PHONE is in E.164 format (+countrycode number)');
    } else if (error.status === 429) {
      console.error('   Rate limit exceeded');
      console.error('   → Wait a moment and try again');
      console.error('   → Check your rate limits in the dashboard');
    } else {
      console.error(`   ${error.message}`);
    }
    
    process.exit(1);
  }
}

main();
