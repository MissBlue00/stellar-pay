#!/usr/bin/env node
/**
 * Test Token Generator
 * 
 * Usage: node generate-test-token.mjs
 * 
 * This script generates a valid JWT token for testing the payments endpoint.
 * Uses the same secret as in .env file.
 */

import crypto from 'crypto';

// JWT Manual Implementation (no external dependencies needed)
function base64UrlEncode(str) {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function generateJWT(payload, secret, expiresIn = 3600) {
    const header = {
        alg: 'HS256',
        typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const claims = {
        ...payload,
        iat: now,
        exp: now + expiresIn,
    };

    const headerEncoded = base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = base64UrlEncode(JSON.stringify(claims));
    const message = `${headerEncoded}.${payloadEncoded}`;

    const signature = crypto
        .createHmac('sha256', secret)
        .update(message)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    return `${message}.${signature}`;
}

// Generate token
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';
const token = generateJWT(
    {
        merchant_id: 'test-merchant-123',
        email: 'test@example.com',
    },
    JWT_SECRET,
    3600 // 1 hour
);

console.log('\n✅ Token generated successfully!\n');
console.log('🔑 Authorization Header:');
console.log(`Bearer ${token}\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📋 Test Commands:\n');

console.log('1️⃣ Create Payment Intent:');
console.log(`curl -X POST http://localhost:3001/payments \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "Authorization: Bearer ${token}" \\`);
console.log(`  -d '{`);
console.log(`    "amount": 100.50,`);
console.log(`    "asset": "USDC",`);
console.log(`    "description": "Test payment"`);
console.log(`  }'\n`);

console.log('2️⃣ Get All Payment Intents:');
console.log(`curl -X GET http://localhost:3001/payments \\`);
console.log(`  -H "Authorization: Bearer ${token}"\n`);

console.log('3️⃣ Check API Health:');
console.log(`curl http://localhost:3001/health\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
