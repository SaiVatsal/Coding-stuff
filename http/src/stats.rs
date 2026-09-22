use hdrhistogram::Histogram;
use std::time::Duration;

/// Metrics collected locally by a single worker thread without locks
pub struct ThreadStats {
    pub requests: u64,
    pub bytes_read: u64,
    pub latency_hist: Histogram<u64>,
    pub req_sec_hist: Histogram<u64>,
    pub connect_errors: u64,
    pub read_errors: u64,
    pub write_errors: u64,
    pub timeout_errors: u64,
    pub status_errors: u64,
}

impl Default for ThreadStats {
    fn default() -> Self {
        Self::new()
    }
}

impl ThreadStats {
    pub fn new() -> Self {
        // Latency in microseconds: 1 us to 3,600,000,000 us (1 hour), 3 sig figures
        let latency_hist = Histogram::<u64>::new_with_bounds(1, 3_600_000_000, 3)
            .unwrap_or_else(|_| Histogram::<u64>::new(3).unwrap());

        // Requests per second: 1 to 10,000,000, 3 sig figures
        let req_sec_hist = Histogram::<u64>::new_with_bounds(1, 10_000_000, 3)
            .unwrap_or_else(|_| Histogram::<u64>::new(3).unwrap());

        ThreadStats {
            requests: 0,
            bytes_read: 0,
            latency_hist,
            req_sec_hist,
            connect_errors: 0,
            read_errors: 0,
            write_errors: 0,
            timeout_errors: 0,
            status_errors: 0,
        }
    }

    #[inline]
    pub fn record_latency_us(&mut self, us: u64) {
        let us = us.clamp(1, 3_600_000_000);
        let _ = self.latency_hist.record(us);
        self.requests += 1;
    }

    #[inline]
    pub fn record_bytes(&mut self, bytes: usize) {
        self.bytes_read += bytes as u64;
    }

    #[inline]
    pub fn record_req_sec(&mut self, rps: u64) {
        if rps > 0 {
            let _ = self.req_sec_hist.record(rps.min(10_000_000));
        }
    }
}

/// Aggregated stats computed across all worker threads
#[derive(Debug, Clone)]
pub struct MetricStats {
    pub avg: f64,
    pub stdev: f64,
    pub max: f64,
    pub plus_minus_stdev_pct: f64,
}

#[derive(Debug, Clone)]
pub struct LatencyPercentiles {
    pub p50: f64,
    pub p75: f64,
    pub p90: f64,
    pub p99: f64,
    pub p99_9: f64,
}

#[derive(Debug, Clone)]
pub struct BenchmarkSummary {
    pub duration: Duration,
    pub total_requests: u64,
    pub total_bytes: u64,
    pub requests_per_sec: f64,
    pub transfer_per_sec: f64,
    pub latency: MetricStats,
    pub req_sec: MetricStats,
    pub percentiles: LatencyPercentiles,
    pub connect_errors: u64,
    pub read_errors: u64,
    pub write_errors: u64,
    pub timeout_errors: u64,
    pub status_errors: u64,
    pub raw_latency_hist: Histogram<u64>,
}

impl BenchmarkSummary {
    pub fn aggregate(mut thread_stats: Vec<ThreadStats>, duration: Duration) -> Self {
        let mut total_requests = 0u64;
        let mut total_bytes = 0u64;
        let mut connect_errors = 0u64;
        let mut read_errors = 0u64;
        let mut write_errors = 0u64;
        let mut timeout_errors = 0u64;
        let mut status_errors = 0u64;

        let mut combined_latency = Histogram::<u64>::new_with_bounds(1, 3_600_000_000, 3)
            .unwrap_or_else(|_| Histogram::<u64>::new(3).unwrap());
        let mut combined_req_sec = Histogram::<u64>::new_with_bounds(1, 10_000_000, 3)
            .unwrap_or_else(|_| Histogram::<u64>::new(3).unwrap());

        for ts in thread_stats.iter_mut() {
            total_requests += ts.requests;
            total_bytes += ts.bytes_read;
            connect_errors += ts.connect_errors;
            read_errors += ts.read_errors;
            write_errors += ts.write_errors;
            timeout_errors += ts.timeout_errors;
            status_errors += ts.status_errors;

            let _ = combined_latency.add(&ts.latency_hist);
            let _ = combined_req_sec.add(&ts.req_sec_hist);
        }

        let secs = duration.as_secs_f64().max(0.0001);
        let requests_per_sec = total_requests as f64 / secs;
        let transfer_per_sec = total_bytes as f64 / secs;

        let latency_stats = compute_histogram_stats(&combined_latency, 1.0); // units: us
        let req_sec_stats = if combined_req_sec.len() > 0 {
            compute_histogram_stats(&combined_req_sec, 1.0)
        } else {
            MetricStats {
                avg: requests_per_sec,
                stdev: 0.0,
                max: requests_per_sec,
                plus_minus_stdev_pct: 100.0,
            }
        };

        let percentiles = LatencyPercentiles {
            p50: combined_latency.value_at_percentile(50.0) as f64,
            p75: combined_latency.value_at_percentile(75.0) as f64,
            p90: combined_latency.value_at_percentile(90.0) as f64,
            p99: combined_latency.value_at_percentile(99.0) as f64,
            p99_9: combined_latency.value_at_percentile(99.9) as f64,
        };

        BenchmarkSummary {
            duration,
            total_requests,
            total_bytes,
            requests_per_sec,
            transfer_per_sec,
            latency: latency_stats,
            req_sec: req_sec_stats,
            percentiles,
            connect_errors,
            read_errors,
            write_errors,
            timeout_errors,
            status_errors,
            raw_latency_hist: combined_latency,
        }
    }
}

fn compute_histogram_stats(h: &Histogram<u64>, scale: f64) -> MetricStats {
    let count = h.len();
    if count == 0 {
        return MetricStats {
            avg: 0.0,
            stdev: 0.0,
            max: 0.0,
            plus_minus_stdev_pct: 0.0,
        };
    }

    let mean = h.mean() * scale;
    let stdev = h.stdev() * scale;
    let max = (h.max() as f64) * scale;

    let low = (mean - stdev).max(0.0);
    let high = mean + stdev;

    let mut in_range_count = 0u64;
    for iter_val in h.iter_recorded() {
        let val = (iter_val.value_iterated_to() as f64) * scale;
        if val >= low && val <= high {
            in_range_count += iter_val.count_at_value();
        }
    }

    let plus_minus_stdev_pct = if count > 0 {
        (in_range_count as f64 / count as f64) * 100.0
    } else {
        0.0
    };

    MetricStats {
        avg: mean,
        stdev,
        max,
        plus_minus_stdev_pct,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_thread_stats_recording() {
        let mut ts = ThreadStats::new();
        ts.record_latency_us(1000);
        ts.record_latency_us(2000);
        ts.record_latency_us(3000);
        ts.record_bytes(500);

        assert_eq!(ts.requests, 3);
        assert_eq!(ts.bytes_read, 500);
        assert_eq!(ts.latency_hist.len(), 3);
    }

    #[test]
    fn test_aggregation() {
        let mut ts1 = ThreadStats::new();
        ts1.record_latency_us(1000);
        ts1.record_bytes(200);

        let mut ts2 = ThreadStats::new();
        ts2.record_latency_us(2000);
        ts2.record_bytes(300);

        let summary = BenchmarkSummary::aggregate(vec![ts1, ts2], Duration::from_secs(1));
        assert_eq!(summary.total_requests, 2);
        assert_eq!(summary.total_bytes, 500);
        assert_eq!(summary.requests_per_sec, 2.0);
        assert_eq!(summary.transfer_per_sec, 500.0);
        assert!(summary.latency.avg >= 1000.0 && summary.latency.avg <= 2000.0);
    }
}

