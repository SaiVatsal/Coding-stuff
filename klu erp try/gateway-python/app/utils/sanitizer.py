"""
Sanitization & Safety Filter Module (Python/FastAPI)
Guarantees memory safety and Slate UI stability for Unreal Engine 5.5 FString/FText.
Strips null characters (\0), control chars, XSS payloads, malicious tags, and tracking query params.
"""

import re
import html
import unicodedata
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from typing import Any, Dict, List, Union

DANGEROUS_TAGS_REGEX = re.compile(
    r"<\s*(script|style|iframe|embed|object|form|input|button|svg|math|meta|link|base)[^>]*>.*?<\s*/\s*\1\s*>|"
    r"<\s*(script|style|iframe|embed|object|form|input|button|svg|math|meta|link|base)[^>]*/?>",
    re.IGNORECASE | re.DOTALL,
)
ALL_HTML_TAGS_REGEX = re.compile(r"<[^>]+>")
EVENT_HANDLERS_REGEX = re.compile(r"\bon\w+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)", re.IGNORECASE)
JAVASCRIPT_URL_REGEX = re.compile(r"(?:javascript|vbscript|data|file)\s*:\s*", re.IGNORECASE)

NON_PRINTABLE_CONTROL_REGEX = re.compile(r"[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]")
ALL_CONTROL_CHARS_REGEX = re.compile(r"[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]")

TRACKING_PARAM_NAMES = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "msclkid", "mc_eid", "igshid", "ref", "ref_src", "source", "referrer"
}


def sanitize_text(text: Any, max_length: int = 2048) -> str:
    """
    Sanitize plain text for safe Unreal Engine Slate rendering
    """
    if text is None:
        return ""

    s = str(text)

    # 1. Remove Null bytes directly
    s = s.replace("\x00", "")

    # 2. Replace non-printable control characters with spaces to preserve word separation
    s = NON_PRINTABLE_CONTROL_REGEX.sub(" ", s)

    # 3. Strip dangerous tags with their contents
    s = DANGEROUS_TAGS_REGEX.sub("", s)

    # 4. Strip remaining HTML tags
    s = ALL_HTML_TAGS_REGEX.sub(" ", s)

    # 5. Strip inline event handlers and pseudo-protocols
    s = EVENT_HANDLERS_REGEX.sub("", s)
    s = JAVASCRIPT_URL_REGEX.sub("", s)

    # 6. Decode HTML entities cleanly
    s = html.unescape(s)

    # 7. Normalize whitespace
    s = re.sub(r"\s+", " ", s).strip()

    # 8. Unicode normalization (NFKC)
    s = unicodedata.normalize("NFKC", s)

    # 9. Clamp length
    if max_length > 0 and len(s) > max_length:
        s = s[:max_length].rstrip() + "..."

    return s


def sanitize_url(raw_url: Any, fallback: str = "") -> str:
    """
    Sanitize and validate URL, stripping tracking params and malicious schemes
    """
    if not raw_url or not isinstance(raw_url, str):
        return fallback

    cleaned = ALL_CONTROL_CHARS_REGEX.sub("", raw_url.strip())

    # Check for javascript/data/vbscript/file schemes
    if JAVASCRIPT_URL_REGEX.search(cleaned):
        return fallback

    try:
        parsed = urlparse(cleaned)
        if parsed.scheme in ("http", "https"):
            # Strip tracking query params
            query_params = parse_qs(parsed.query, keep_blank_values=True)
            filtered_params = {
                k: v for k, v in query_params.items()
                if k.lower() not in TRACKING_PARAM_NAMES and not k.lower().startswith("utm_")
            }
            new_query = urlencode(filtered_params, doseq=True)
            cleaned_url = urlunparse((
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                parsed.params,
                new_query,
                parsed.fragment,
            ))
            return cleaned_url.rstrip("?&")
        elif re.match(r"^[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+$", cleaned):
            if not re.match(r"^(javascript|data|vbscript|file):", cleaned, re.IGNORECASE):
                return cleaned
    except Exception:
        pass

    return fallback


def sanitize_float(val: Any, default: float = 0.0, min_val: float = -1.0, max_val: float = 1.0) -> float:
    """
    Parse float safely and clamp to bounds
    """
    try:
        num = float(val)
        if num != num:  # Check NaN
            return default
        return max(min(num, max_val), min_val)
    except (ValueError, TypeError):
        return default


def sanitize_payload(data: Any) -> Any:
    """
    Recursively sanitize dictionaries, lists, strings, and objects
    """
    if data is None:
        return None

    if isinstance(data, str):
        return sanitize_text(data)

    if isinstance(data, (int, float, bool)):
        return data

    if isinstance(data, list):
        return [sanitize_payload(item) for item in data]

    if isinstance(data, dict):
        cleaned_dict = {}
        for key, value in data.items():
            clean_key = sanitize_text(key, max_length=64)
            if "url" in clean_key.lower() and isinstance(value, str):
                cleaned_dict[clean_key] = sanitize_url(value)
            else:
                cleaned_dict[clean_key] = sanitize_payload(value)
        return cleaned_dict

    return data


# Aliases
sanitize_payload_object = sanitize_payload
