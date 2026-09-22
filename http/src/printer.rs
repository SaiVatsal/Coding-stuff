use crate::cli::Config;
use crate::stats::BenchmarkSummary;

pub fn print_banner(config: &Config) {
    let duration_str = format_duration_short(config.duration);
    println!(
        "Running {} test @ {}",
        duration_str,
        config.target_url.as_str()
    );
    println!(
        "  {} threads and {} connections",
        config.threads, config.connections
    );
}

pub fn print_summary(summary: &BenchmarkSummary, config: &Config) {
    println!("  Thread Stats   Avg      Stdev     Max   +/- Stdev");
    println!(
        "    Latency   {:>8}  {:>8}  {:>8}   {:>6.2}%",
        format_time_us(summary.latency.avg),
        format_time_us(summary.latency.stdev),
        format_time_us(summary.latency.max),
        summary.latency.plus_minus_stdev_pct
    );
    println!(
        "    Req/Sec   {:>8}  {:>8}  {:>8}   {:>6.2}%",
        format_count_short(summary.req_sec.avg),
        format_count_short(summary.req_sec.stdev),
        format_count_short(summary.req_sec.max),
        summary.req_sec.plus_minus_stdev_pct
    );

    if config.print_latency {
        println!("  Latency Distribution");
        println!("     50%   {:>8}", format_time_us(summary.percentiles.p50));
        println!("     75%   {:>8}", format_time_us(summary.percentiles.p75));
        println!("     90%   {:>8}", format_time_us(summary.percentiles.p90));
        println!("     99%   {:>8}", format_time_us(summary.percentiles.p99));
        println!("   99.9%   {:>8}", format_time_us(summary.percentiles.p99_9));
    }

    println!(
        "  {} requests in {:.2}s, {} read",
        summary.total_requests,
        summary.duration.as_secs_f64(),
        format_bytes(summary.total_bytes)
    );

    let total_socket_errors = summary.connect_errors
        + summary.read_errors
        + summary.write_errors
        + summary.timeout_errors;

    if total_socket_errors > 0 {
        println!(
            "  Socket errors: connect {}, read {}, write {}, timeout {}",
            summary.connect_errors,
            summary.read_errors,
            summary.write_errors,
            summary.timeout_errors
        );
    }

    if summary.status_errors > 0 {
        println!("  Non-2xx or 3xx responses: {}", summary.status_errors);
    }

    println!("Requests/sec: {:>10.2}", summary.requests_per_sec);
    println!("Transfer/sec: {:>10}", format_rate_bytes(summary.transfer_per_sec));
}

pub fn format_time_us(us: f64) -> String {
    if us < 1000.0 {
        format!("{:.2}us", us)
    } else if us < 1_000_000.0 {
        format!("{:.2}ms", us / 1000.0)
    } else {
        format!("{:.2}s", us / 1_000_000.0)
    }
}

pub fn format_count_short(n: f64) -> String {
    if n < 1000.0 {
        format!("{:.2}", n)
    } else if n < 1_000_000.0 {
        format!("{:.2}k", n / 1000.0)
    } else {
        format!("{:.2}M", n / 1_000_000.0)
    }
}

pub fn format_bytes(bytes: u64) -> String {
    const KB: f64 = 1024.0;
    const MB: f64 = KB * 1024.0;
    const GB: f64 = MB * 1024.0;

    let b = bytes as f64;
    if b < KB {
        format!("{}B", bytes)
    } else if b < MB {
        format!("{:.2}KB", b / KB)
    } else if b < GB {
        format!("{:.2}MB", b / MB)
    } else {
        format!("{:.2}GB", b / GB)
    }
}

pub fn format_rate_bytes(rate: f64) -> String {
    const KB: f64 = 1024.0;
    const MB: f64 = KB * 1024.0;
    const GB: f64 = MB * 1024.0;

    if rate < KB {
        format!("{:.2}B", rate)
    } else if rate < MB {
        format!("{:.2}KB", rate / KB)
    } else if rate < GB {
        format!("{:.2}MB", rate / MB)
    } else {
        format!("{:.2}GB", rate / GB)
    }
}

pub fn format_duration_short(d: std::time::Duration) -> String {
    let secs = d.as_secs_f64();
    if secs < 1.0 {
        format!("{}ms", d.as_millis())
    } else if secs < 60.0 {
        format!("{:.0}s", secs)
    } else if secs < 3600.0 {
        format!("{:.0}m", secs / 60.0)
    } else {
        format!("{:.0}h", secs / 3600.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_time_us() {
        assert_eq!(format_time_us(500.0), "500.00us");
        assert_eq!(format_time_us(1500.0), "1.50ms");
        assert_eq!(format_time_us(2_500_000.0), "2.50s");
    }

    #[test]
    fn test_format_count_short() {
        assert_eq!(format_count_short(500.0), "500.00");
        assert_eq!(format_count_short(2500.0), "2.50k");
        assert_eq!(format_count_short(1_500_000.0), "1.50M");
    }

    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(500), "500B");
        assert_eq!(format_bytes(2048), "2.00KB");
        assert_eq!(format_bytes(5 * 1024 * 1024), "5.00MB");
        assert_eq!(format_bytes(3 * 1024 * 1024 * 1024), "3.00GB");
    }

    #[test]
    fn test_format_duration_short() {
        assert_eq!(format_duration_short(std::time::Duration::from_millis(500)), "500ms");
        assert_eq!(format_duration_short(std::time::Duration::from_secs(30)), "30s");
        assert_eq!(format_duration_short(std::time::Duration::from_secs(120)), "2m");
    }
}

