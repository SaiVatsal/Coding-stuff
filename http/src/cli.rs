use anyhow::{bail, Context, Result};
use clap::Parser;
use std::path::PathBuf;
use std::time::Duration;
use url::Url;

#[derive(Parser, Debug, Clone)]
#[command(
    name = "wrk",
    author = "wrk contributors",
    version = "0.1.0",
    about = "A fast, modern HTTP benchmarking tool like wrk with Lua scripting",
    after_help = "Examples:\n  wrk -t2 -c100 -d30s http://127.0.0.1:8080/\n  wrk -t4 -c200 -d1m --latency http://127.0.0.1:8080/index.html\n  wrk -t2 -c50 -d10s -s scripts/post.lua http://127.0.0.1:8080/api\n  wrk -H \"Authorization: Bearer token123\" http://127.0.0.1:8080/"
)]
pub struct Cli {
    /// Total number of HTTP connections to keep open
    #[arg(short = 'c', long = "connections", default_value_t = 10)]
    pub connections: usize,

    /// Duration of the test (e.g. 2s, 10s, 2m, 1h)
    #[arg(short = 'd', long = "duration", default_value = "10s")]
    pub duration: String,

    /// Total number of threads to use
    #[arg(short = 't', long = "threads", default_value_t = 2)]
    pub threads: usize,

    /// Lua script file to load
    #[arg(short = 's', long = "script")]
    pub script: Option<PathBuf>,

    /// HTTP header to add to request (can be specified multiple times)
    #[arg(short = 'H', long = "header")]
    pub headers: Vec<String>,

    /// Print detailed latency statistics
    #[arg(long = "latency", default_value_t = false)]
    pub latency: bool,

    /// Record a timeout if a response is not received within this duration
    #[arg(long = "timeout", default_value = "2s")]
    pub timeout: String,

    /// Target URL (e.g. http://127.0.0.1:8080/)
    #[arg(value_name = "URL")]
    pub url: String,
}

#[derive(Debug, Clone)]
pub struct Config {
    pub target_url: Url,
    pub connections: usize,
    pub threads: usize,
    pub duration: Duration,
    pub timeout: Duration,
    pub script_path: Option<PathBuf>,
    pub custom_headers: Vec<(String, String)>,
    pub print_latency: bool,
}

impl Config {
    pub fn from_cli(cli: Cli) -> Result<Self> {
        if cli.connections == 0 {
            bail!("Connections count must be greater than 0");
        }
        if cli.threads == 0 {
            bail!("Threads count must be greater than 0");
        }
        if cli.threads > cli.connections {
            bail!(
                "Cannot use more threads ({}) than connections ({})",
                cli.threads,
                cli.connections
            );
        }

        let parsed_url = Url::parse(&cli.url)
            .with_context(|| format!("Invalid target URL: '{}'", cli.url))?;

        if parsed_url.scheme() != "http" && parsed_url.scheme() != "https" {
            bail!("URL scheme must be http or https, got '{}'", parsed_url.scheme());
        }

        if parsed_url.host_str().is_none() {
            bail!("URL must contain a valid host: '{}'", cli.url);
        }

        let duration = parse_duration(&cli.duration)
            .with_context(|| format!("Invalid duration value: '{}'", cli.duration))?;

        let timeout = parse_duration(&cli.timeout)
            .with_context(|| format!("Invalid timeout value: '{}'", cli.timeout))?;

        let mut custom_headers = Vec::new();
        for h in cli.headers {
            if let Some((k, v)) = h.split_once(':') {
                custom_headers.push((k.trim().to_string(), v.trim().to_string()));
            } else {
                bail!("Invalid header format: '{}'. Expected 'Header-Name: value'", h);
            }
        }

        Ok(Config {
            target_url: parsed_url,
            connections: cli.connections,
            threads: cli.threads,
            duration,
            timeout,
            script_path: cli.script,
            custom_headers,
            print_latency: cli.latency,
        })
    }
}

pub fn parse_duration(s: &str) -> Result<Duration> {
    let s = s.trim();
    if s.is_empty() {
        bail!("Duration cannot be empty");
    }

    if let Some(rest) = s.strip_suffix("ms") {
        let n: u64 = rest.parse()?;
        return Ok(Duration::from_millis(n));
    }
    if let Some(rest) = s.strip_suffix('s') {
        let n: f64 = rest.parse()?;
        return Ok(Duration::from_secs_f64(n));
    }
    if let Some(rest) = s.strip_suffix('m') {
        let n: f64 = rest.parse()?;
        return Ok(Duration::from_secs_f64(n * 60.0));
    }
    if let Some(rest) = s.strip_suffix('h') {
        let n: f64 = rest.parse()?;
        return Ok(Duration::from_secs_f64(n * 3600.0));
    }

    // Default to seconds if purely numeric
    if let Ok(n) = s.parse::<f64>() {
        return Ok(Duration::from_secs_f64(n));
    }

    bail!(
        "Invalid duration unit in '{}'. Supported units: ms, s, m, h (e.g. 500ms, 30s, 2m)",
        s
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_duration() {
        assert_eq!(parse_duration("500ms").unwrap(), Duration::from_millis(500));
        assert_eq!(parse_duration("30s").unwrap(), Duration::from_secs(30));
        assert_eq!(parse_duration("2m").unwrap(), Duration::from_secs(120));
        assert_eq!(parse_duration("1h").unwrap(), Duration::from_secs(3600));
        assert_eq!(parse_duration("10").unwrap(), Duration::from_secs(10));
    }
}
