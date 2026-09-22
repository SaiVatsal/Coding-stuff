-- example script: report.lua
-- Demonstrates custom post-test reporting using the done() callback.
-- wrk passes (summary, latency, requests) to done() when the benchmark ends.

function done(summary, latency, requests)
    print("\n--------------------------------------------------")
    print("                 CUSTOM LUA REPORT                ")
    print("--------------------------------------------------")
    print(string.format("Duration (sec):    %.2f", summary.duration / 1000000.0))
    print(string.format("Total Requests:    %d", summary.requests))
    print(string.format("Total Bytes Read:  %d", summary.bytes))
    print(string.format("Latency Min:       %.2f ms", latency.min / 1000.0))
    print(string.format("Latency Mean:      %.2f ms", latency.mean / 1000.0))
    print(string.format("Latency Max:       %.2f ms", latency.max / 1000.0))
    print(string.format("Latency p50:       %.2f ms", latency:percentile(50.0) / 1000.0))
    print(string.format("Latency p90:       %.2f ms", latency:percentile(90.0) / 1000.0))
    print(string.format("Latency p99:       %.2f ms", latency:percentile(99.0) / 1000.0))
    print(string.format("Socket Errors:     connect=%d, read=%d, write=%d, timeout=%d",
        summary.errors.connect, summary.errors.read, summary.errors.write, summary.errors.timeout))
    print("--------------------------------------------------\n")
end
