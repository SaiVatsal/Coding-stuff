"""
Tests for UE5 Payload Sanitizer & Safety Filter (Python)
"""

import math
from app.utils.sanitizer import (
    sanitize_text,
    sanitize_url,
    sanitize_float,
    sanitize_payload_object,
    sanitize_payload,
)


def test_sanitizer_removes_null_bytes_and_control_characters():
    dirty = "Hello\x00World!\x01\x02\x08Test\x1FString"
    clean = sanitize_text(dirty)
    assert clean == "HelloWorld! Test String"
    assert "\x00" not in clean


def test_sanitizer_strips_malicious_html_tags():
    dirty = '<p>Normal text <script>alert("hack")</script><iframe src="evil.com"></iframe><b>Bold</b></p>'
    clean = sanitize_text(dirty)
    assert clean == "Normal text Bold"
    assert "script" not in clean
    assert "iframe" not in clean


def test_sanitizer_strips_inline_event_handlers_and_javascript_urls():
    dirty = '<a href="javascript:alert(1)" onclick="stealCookies()">Click me</a>'
    clean = sanitize_text(dirty)
    assert clean == "Click me"
    assert "javascript:" not in clean
    assert "onclick" not in clean


def test_sanitizer_decodes_html_entities_properly():
    dirty = "Vice City &amp; Leonida &quot;Best City&quot; &lt;3"
    clean = sanitize_text(dirty)
    assert clean == 'Vice City & Leonida "Best City" <3'


def test_sanitizer_clamps_string_length_without_breaking_words():
    long_text = "A" * 5000
    clean = sanitize_text(long_text, 50)
    assert len(clean) <= 53  # 50 + '...'
    assert clean.endswith("...")


def test_sanitizer_url_validation_and_protocol_restrictions():
    assert sanitize_url("https://eyefind.info/search") == "https://eyefind.info/search"
    assert sanitize_url("http://bawsaq.com/stocks") == "http://bawsaq.com/stocks"
    assert sanitize_url("javascript:alert(1)") == ""
    assert sanitize_url("data:text/html,<html>") == ""
    assert sanitize_url("file:///etc/passwd") == ""
    assert sanitize_url(None, "https://default.com") == "https://default.com"


def test_sanitizer_float_sanitization_with_boundary_clamping():
    assert sanitize_float(0.75, 0.0, -1.0, 1.0) == 0.75
    assert sanitize_float(5.0, 0.0, -1.0, 1.0) == 1.0
    assert sanitize_float(-10.0, 0.0, -1.0, 1.0) == -1.0
    assert sanitize_float("invalid", 0.5) == 0.5
    assert sanitize_float(float("nan"), 0.2) == 0.2


def test_sanitizer_recursive_payload_object_sanitization():
    payload = {
        "title": "<b>Breaking:</b> FIB Raid<script>xss()</script>",
        "source_url": "https://weazelnews.com/article?id=123",
        "market_impact": 0.85,
        "details": {
            "location": "Vice Beach\x00",
            "officers": ["Officer A", "<i>Officer B</i>"],
        },
    }

    clean = sanitize_payload_object(payload)
    assert clean["title"] == "Breaking: FIB Raid"
    assert clean["source_url"] == "https://weazelnews.com/article?id=123"
    assert clean["details"]["location"] == "Vice Beach"
    assert clean["details"]["officers"][1] == "Officer B"
