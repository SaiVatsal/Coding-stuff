-- example script: post.lua
-- Demonstrates sending HTTP POST requests with a JSON payload and custom header.

wrk.method = "POST"
wrk.body   = '{"username": "benchmarker", "action": "load_test", "timestamp": 1725792000}'
wrk.headers["Content-Type"] = "application/json"
wrk.headers["X-Requested-By"] = "wrk-load-tester"
