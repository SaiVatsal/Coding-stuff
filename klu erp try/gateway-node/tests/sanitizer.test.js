/**
 * Tests for UE5 Payload Sanitizer & Safety Filter
 */

const test = require('node:test');
const assert = require('node:assert');
const {
  sanitizeText,
  sanitizeUrl,
  sanitizeFloat,
  sanitizePayloadObject,
} = require('../src/utils/sanitizer');

test('Sanitizer - removes null bytes and control characters for UE5 FString safety', () => {
  const dirty = "Hello\x00World!\x01\x02\x08Test\x1FString";
  const clean = sanitizeText(dirty);
  assert.strictEqual(clean, "HelloWorld! Test String");
  assert.ok(!clean.includes('\x00'));
});

test('Sanitizer - strips malicious HTML tags (script, iframe, embed, object)', () => {
  const dirty = '<p>Normal text <script>alert("hack")</script><iframe src="evil.com"></iframe><b>Bold</b></p>';
  const clean = sanitizeText(dirty);
  assert.strictEqual(clean, 'Normal text Bold');
  assert.ok(!clean.includes('script'));
  assert.ok(!clean.includes('iframe'));
});

test('Sanitizer - strips inline event handlers and javascript: URI schemes', () => {
  const dirty = '<a href="javascript:alert(1)" onclick="stealCookies()">Click me</a>';
  const clean = sanitizeText(dirty);
  assert.strictEqual(clean, 'Click me');
  assert.ok(!clean.includes('javascript:'));
  assert.ok(!clean.includes('onclick'));
});

test('Sanitizer - decodes HTML entities properly', () => {
  const dirty = 'Vice City &amp; Leonida &quot;Best City&quot; &lt;3';
  const clean = sanitizeText(dirty);
  assert.strictEqual(clean, 'Vice City & Leonida "Best City" <3');
});

test('Sanitizer - clamps string length without breaking words', () => {
  const longText = 'A'.repeat(5000);
  const clean = sanitizeText(longText, 50);
  assert.ok(clean.length <= 53); // 50 + '...'
  assert.ok(clean.endsWith('...'));
});

test('Sanitizer - URL validation and protocol restrictions', () => {
  assert.strictEqual(sanitizeUrl('https://eyefind.info/search'), 'https://eyefind.info/search');
  assert.strictEqual(sanitizeUrl('http://bawsaq.com/stocks'), 'http://bawsaq.com/stocks');
  assert.strictEqual(sanitizeUrl('javascript:alert(1)'), '');
  assert.strictEqual(sanitizeUrl('data:text/html,<html>'), '');
  assert.strictEqual(sanitizeUrl('file:///etc/passwd'), '');
  assert.strictEqual(sanitizeUrl(null, 'https://default.com'), 'https://default.com');
});

test('Sanitizer - Float sanitization with boundary clamping', () => {
  assert.strictEqual(sanitizeFloat(0.75, 0.0, -1.0, 1.0), 0.75);
  assert.strictEqual(sanitizeFloat(5.0, 0.0, -1.0, 1.0), 1.0);
  assert.strictEqual(sanitizeFloat(-10.0, 0.0, -1.0, 1.0), -1.0);
  assert.strictEqual(sanitizeFloat('invalid', 0.5), 0.5);
  assert.strictEqual(sanitizeFloat(NaN, 0.2), 0.2);
});

test('Sanitizer - recursive payload object sanitization', () => {
  const payload = {
    title: '<b>Breaking:</b> FIB Raid<script>xss()</script>',
    source_url: 'https://weazelnews.com/article?id=123',
    market_impact: 0.85,
    details: {
      location: 'Vice Beach\x00',
      officers: ['Officer A', '<i>Officer B</i>'],
    },
  };

  const clean = sanitizePayloadObject(payload);
  assert.strictEqual(clean.title, 'Breaking: FIB Raid');
  assert.strictEqual(clean.source_url, 'https://weazelnews.com/article?id=123');
  assert.strictEqual(clean.details.location, 'Vice Beach');
  assert.strictEqual(clean.details.officers[1], 'Officer B');
});
