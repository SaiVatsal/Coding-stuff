/**
 * Sanitization & Safety Filter Module
 * Protects Unreal Engine 5.5 C++ client from memory corruptions,
 * XSS payloads, malicious script tags, tracking scripts, and invalid payload formats.
 */

const DANGEROUS_TAGS_REGEX = /<\s*(script|style|iframe|embed|object|form|input|button|svg|math|meta|link|base)[^>]*>.*?<\s*\/\s*\1\s*>|<\s*(script|style|iframe|embed|object|form|input|button|svg|math|meta|link|base)[^>]*\/?>/gis;
const ALL_HTML_TAGS_REGEX = /<[^>]+>/g;
const EVENT_HANDLERS_REGEX = /\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URL_REGEX = /(?:javascript|vbscript|data|file)\s*:\s*/gi;
const TRACKING_PATTERNS = [
  /[?&](utm_[a-z]+|fbclid|gclid|msclkid|mc_eid|igshid)=[^&#]*/gi,
  /[?&](ref|ref_src|source|referrer)=[^&#]*/gi,
];

// Dangerous ASCII control characters (excluding null \0 handled separately, newline \n 0x0A, carriage return \r 0x0D, tab \t 0x09)
const NON_PRINTABLE_CONTROL_REGEX = /[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const ALL_CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

/**
 * Basic HTML entity decoder
 */
function decodeHtmlEntities(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Sanitize a plain text string for Unreal Engine FString / Slate rendering
 * @param {string} text - Raw input string
 * @param {number} maxLength - Max allowed characters
 * @returns {string} Cleaned safe string
 */
function sanitizeText(text, maxLength = 2048) {
  if (text === null || text === undefined) return '';
  let str = String(text);

  // 1. Remove Null bytes directly
  str = str.replace(/\0/g, '');

  // 2. Replace dangerous non-printable control characters with spaces to preserve word separation
  str = str.replace(NON_PRINTABLE_CONTROL_REGEX, ' ');

  // 3. Strip dangerous tags with their contents (e.g. <script>alert(1)</script>)
  str = str.replace(DANGEROUS_TAGS_REGEX, '');

  // 4. Strip remaining HTML tags
  str = str.replace(ALL_HTML_TAGS_REGEX, ' ');

  // 5. Strip inline event handlers and pseudo-protocols
  str = str.replace(EVENT_HANDLERS_REGEX, '');
  str = str.replace(JAVASCRIPT_URL_REGEX, '');

  // 6. Decode HTML entities cleanly
  str = decodeHtmlEntities(str);

  // 7. Normalize whitespace
  str = str.replace(/\s+/g, ' ').trim();

  // 8. Unicode normalization (NFKC)
  str = str.normalize('NFKC');

  // 9. Clamp length
  if (maxLength > 0 && str.length > maxLength) {
    str = str.substring(0, maxLength).trim() + '...';
  }

  return str;
}

/**
 * Sanitize a URL to ensure safe HTTP/HTTPS navigation
 * @param {string} rawUrl - Raw URL string
 * @param {string} fallback - Fallback URL if invalid
 * @returns {string} Sanitized URL or fallback
 */
function sanitizeUrl(rawUrl, fallback = '') {
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;

  let cleaned = rawUrl.trim().replace(ALL_CONTROL_CHARS_REGEX, '');

  // Check for javascript/data/vbscript exploits
  if (JAVASCRIPT_URL_REGEX.test(cleaned)) {
    return fallback;
  }

  // Strip tracking parameters
  for (const pattern of TRACKING_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Clean trailing ? or & if stripped
  cleaned = cleaned.replace(/[?&]$/, '');

  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // If not a full URL, ensure it doesn't contain dangerous scheme prefixes
    if (/^[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+$/.test(cleaned) && !/^(javascript|data|vbscript|file):/i.test(cleaned)) {
      return cleaned;
    }
  }

  return fallback;
}

/**
 * Safely parse and clamp float values for market impact metrics
 */
function sanitizeFloat(val, defaultValue = 0.0, min = -1.0, max = 1.0) {
  const num = parseFloat(val);
  if (isNaN(num)) return defaultValue;
  return Math.min(Math.max(num, min), max);
}

/**
 * Deeply sanitize an object or array payload
 * @param {any} data - Raw payload
 * @returns {any} Sanitized payload
 */
function sanitizePayload(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeText(data);
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizePayload(item));
  }

  if (typeof data === 'object') {
    const cleanedObj = {};
    for (const [key, value] of Object.entries(data)) {
      const cleanKey = sanitizeText(key, 64);
      if (cleanKey.toLowerCase().includes('url') && typeof value === 'string') {
        cleanedObj[cleanKey] = sanitizeUrl(value);
      } else {
        cleanedObj[cleanKey] = sanitizePayload(value);
      }
    }
    return cleanedObj;
  }

  return data;
}

module.exports = {
  sanitizeText,
  sanitizeUrl,
  sanitizeFloat,
  sanitizePayload,
  sanitizePayloadObject: sanitizePayload,
  decodeHtmlEntities,
};
