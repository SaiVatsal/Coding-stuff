use crate::cli::Config;
use crate::lua::LuaEngine;
use crate::stats::ThreadStats;
use anyhow::{bail, Result};
use std::net::SocketAddr;
use std::pin::Pin;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::task::{Context, Poll};
use std::time::{Duration, Instant};
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt, ReadBuf};
use tokio::net::TcpStream;
use tokio_rustls::client::TlsStream;
use tokio_rustls::TlsConnector;

pub enum ConnectionStream {
    Plain(TcpStream),
    Tls(Box<TlsStream<TcpStream>>),
}

impl AsyncRead for ConnectionStream {
    fn poll_read(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &mut ReadBuf<'_>,
    ) -> Poll<std::io::Result<()>> {
        match self.get_mut() {
            ConnectionStream::Plain(s) => Pin::new(s).poll_read(cx, buf),
            ConnectionStream::Tls(s) => Pin::new(s.as_mut()).poll_read(cx, buf),
        }
    }
}

impl AsyncWrite for ConnectionStream {
    fn poll_write(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &[u8],
    ) -> Poll<std::io::Result<usize>> {
        match self.get_mut() {
            ConnectionStream::Plain(s) => Pin::new(s).poll_write(cx, buf),
            ConnectionStream::Tls(s) => Pin::new(s.as_mut()).poll_write(cx, buf),
        }
    }

    fn poll_flush(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<std::io::Result<()>> {
        match self.get_mut() {
            ConnectionStream::Plain(s) => Pin::new(s).poll_flush(cx),
            ConnectionStream::Tls(s) => Pin::new(s.as_mut()).poll_flush(cx),
        }
    }

    fn poll_shutdown(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<std::io::Result<()>> {
        match self.get_mut() {
            ConnectionStream::Plain(s) => Pin::new(s).poll_shutdown(cx),
            ConnectionStream::Tls(s) => Pin::new(s.as_mut()).poll_shutdown(cx),
        }
    }
}

pub struct BenchmarkClient {
    target_addrs: Vec<SocketAddr>,
    tls_connector: Option<TlsConnector>,
    is_tls: bool,
    host_str: String,
    prebuilt_request: Vec<u8>,
}

impl BenchmarkClient {
    pub fn new(config: Config, target_addrs: Vec<SocketAddr>) -> Result<Self> {
        let is_tls = config.target_url.scheme() == "https";
        let host_str = config
            .target_url
            .host_str()
            .ok_or_else(|| anyhow::anyhow!("URL missing host"))?
            .to_string();

        let tls_connector = if is_tls {
            let mut root_store = rustls::RootCertStore::empty();
            root_store.extend(webpki_roots::TLS_SERVER_ROOTS.iter().cloned());

            let client_config = rustls::ClientConfig::builder()
                .with_root_certificates(root_store)
                .with_no_client_auth();

            Some(TlsConnector::from(Arc::new(client_config)))
        } else {
            None
        };

        let prebuilt_request = build_default_request(&config);

        Ok(BenchmarkClient {
            target_addrs,
            tls_connector,
            is_tls,
            host_str,
            prebuilt_request,
        })
    }

    pub fn prebuilt_request(&self) -> &[u8] {
        &self.prebuilt_request
    }

    pub async fn connect(&self) -> Result<ConnectionStream> {
        if self.target_addrs.is_empty() {
            bail!("No resolved IP addresses for target host");
        }

        let mut last_err = None;
        let mut stream = None;
        for addr in &self.target_addrs {
            match TcpStream::connect(addr).await {
                Ok(s) => {
                    let _ = s.set_nodelay(true);
                    stream = Some(s);
                    break;
                }
                Err(e) => {
                    last_err = Some(e);
                }
            }
        }

        let tcp_stream = match stream {
            Some(s) => s,
            None => {
                bail!(
                    "Failed to connect to any target address: {:?}",
                    last_err
                );
            }
        };

        if self.is_tls {
            let connector = self
                .tls_connector
                .as_ref()
                .ok_or_else(|| anyhow::anyhow!("TLS connector not initialized"))?;

            let server_name = rustls::pki_types::ServerName::try_from(self.host_str.clone())
                .map_err(|e| anyhow::anyhow!("Invalid server name: {}", e))?
                .to_owned();

            let tls_stream = connector.connect(server_name, tcp_stream).await?;
            Ok(ConnectionStream::Tls(Box::new(tls_stream)))
        } else {
            Ok(ConnectionStream::Plain(tcp_stream))
        }
    }
}

pub fn build_default_request(config: &Config) -> Vec<u8> {
    let method = "GET";
    let mut path = config.target_url.path().to_string();
    if let Some(query) = config.target_url.query() {
        path.push('?');
        path.push_str(query);
    }
    if path.is_empty() {
        path = "/".to_string();
    }

    let port = config.target_url.port_or_known_default().unwrap_or(80);
    let host = config.target_url.host_str().unwrap_or("localhost");
    let host_header = if (config.target_url.scheme() == "http" && port == 80)
        || (config.target_url.scheme() == "https" && port == 443)
    {
        host.to_string()
    } else {
        format!("{}:{}", host, port)
    };

    let mut req = format!("{} {} HTTP/1.1\r\n", method, path);
    let mut has_host = false;
    let mut has_conn = false;
    let mut has_ua = false;

    for (k, v) in &config.custom_headers {
        if k.eq_ignore_ascii_case("host") {
            has_host = true;
        }
        if k.eq_ignore_ascii_case("connection") {
            has_conn = true;
        }
        if k.eq_ignore_ascii_case("user-agent") {
            has_ua = true;
        }
        req.push_str(&format!("{}: {}\r\n", k, v));
    }

    if !has_host {
        req.push_str(&format!("Host: {}\r\n", host_header));
    }
    if !has_conn {
        req.push_str("Connection: keep-alive\r\n");
    }
    if !has_ua {
        req.push_str("User-Agent: wrk/0.1.0\r\n");
    }
    req.push_str("\r\n");

    req.into_bytes()
}

pub async fn stream_write_all(stream: &mut ConnectionStream, bytes: &[u8]) -> Result<()> {
    stream.write_all(bytes).await?;
    stream.flush().await?;
    Ok(())
}

/// Run a single connection loop until stop flag is set
pub async fn run_connection_loop(
    client: Arc<BenchmarkClient>,
    stop: Arc<AtomicBool>,
    conn_counter: Arc<AtomicU64>,
    lua_engine: Option<LuaEngine>,
    timeout: Duration,
) -> ThreadStats {
    let mut stats = ThreadStats::new();
    let mut read_buf = vec![0u8; 65536];
    let mut buf_len;

    'outer: while !stop.load(Ordering::Relaxed) {
        let connect_fut = client.connect();
        let mut stream = match tokio::time::timeout(timeout, connect_fut).await {
            Ok(Ok(s)) => s,
            Ok(Err(_)) => {
                stats.connect_errors += 1;
                tokio::time::sleep(Duration::from_millis(50)).await;
                continue 'outer;
            }
            Err(_) => {
                stats.connect_errors += 1;
                stats.timeout_errors += 1;
                tokio::time::sleep(Duration::from_millis(50)).await;
                continue 'outer;
            }
        };

        buf_len = 0;

        'conn: loop {
            if stop.load(Ordering::Relaxed) {
                break 'outer;
            }

            let req_bytes = match &lua_engine {
                Some(lua) => match lua.generate_request() {
                    Ok(b) => b,
                    Err(_) => client.prebuilt_request().to_vec(),
                },
                None => client.prebuilt_request().to_vec(),
            };

            let start_time = Instant::now();

            let write_res = tokio::time::timeout(timeout, stream_write_all(&mut stream, &req_bytes)).await;
            match write_res {
                Ok(Ok(())) => {}
                Ok(Err(_)) => {
                    stats.write_errors += 1;
                    break 'conn;
                }
                Err(_) => {
                    stats.write_errors += 1;
                    stats.timeout_errors += 1;
                    break 'conn;
                }
            }

            let read_res = tokio::time::timeout(
                timeout,
                read_http_response(&mut stream, &mut read_buf, &mut buf_len),
            )
            .await;

            let (status, headers, body_range, total_read, should_close) = match read_res {
                Ok(Ok(parsed)) => parsed,
                Ok(Err(_)) => {
                    stats.read_errors += 1;
                    break 'conn;
                }
                Err(_) => {
                    stats.read_errors += 1;
                    stats.timeout_errors += 1;
                    break 'conn;
                }
            };

            let elapsed_us = start_time.elapsed().as_micros() as u64;
            stats.record_latency_us(elapsed_us);
            stats.record_bytes(total_read);
            conn_counter.fetch_add(1, Ordering::Relaxed);

            if status < 200 || status >= 400 {
                stats.status_errors += 1;
            }

            if let Some(ref lua) = lua_engine {
                if lua.has_response() {
                    let body_slice = &read_buf[body_range.0..body_range.1];
                    let _ = lua.call_response(status, &headers, body_slice);
                }
            }

            if should_close {
                break 'conn;
            }
        }
    }

    stats
}

/// Reads from stream until a full HTTP response is parsed.
/// Returns: (status_code, headers, (body_start, body_end), total_bytes_read, should_close)
pub async fn read_http_response(
    stream: &mut ConnectionStream,
    buf: &mut Vec<u8>,
    buf_len: &mut usize,
) -> Result<(u16, Vec<(String, String)>, (usize, usize), usize, bool)> {
    let initial_leftover = *buf_len;
    let mut total_bytes_this_response = 0usize;

    loop {
        let mut headers = [httparse::EMPTY_HEADER; 64];
        let mut resp = httparse::Response::new(&mut headers);

        match resp.parse(&buf[..*buf_len]) {
            Ok(httparse::Status::Complete(header_len)) => {
                let status = resp.code.unwrap_or(200);

                let mut content_length: Option<usize> = None;
                let mut is_chunked = false;
                let mut should_close = false;
                let mut parsed_headers = Vec::with_capacity(resp.headers.len());

                for h in resp.headers.iter() {
                    let name = h.name.to_string();
                    let val = String::from_utf8_lossy(h.value).to_string();

                    if name.eq_ignore_ascii_case("content-length") {
                        if let Ok(len) = val.trim().parse::<usize>() {
                            content_length = Some(len);
                        }
                    } else if name.eq_ignore_ascii_case("transfer-encoding") {
                        if val.to_ascii_lowercase().contains("chunked") {
                            is_chunked = true;
                        }
                    } else if name.eq_ignore_ascii_case("connection") {
                        if val.to_ascii_lowercase().contains("close") {
                            should_close = true;
                        }
                    }

                    parsed_headers.push((name, val));
                }

                // If status has no body (204, 304, 1xx)
                if status == 204 || status == 304 || (status >= 100 && status < 200) {
                    let body_start = header_len;
                    let body_end = header_len;
                    let remaining = *buf_len - header_len;
                    total_bytes_this_response += header_len.saturating_sub(initial_leftover);

                    if remaining > 0 {
                        buf.copy_within(header_len..*buf_len, 0);
                    }
                    *buf_len = remaining;

                    return Ok((status, parsed_headers, (body_start, body_end), total_bytes_this_response, should_close));
                }

                // Fixed Content-Length
                if let Some(cl) = content_length {
                    let required = header_len + cl;
                    while *buf_len < required {
                        if buf.len() < required {
                            buf.resize(required + 16384, 0);
                        }
                        let n = stream.read(&mut buf[*buf_len..]).await?;
                        if n == 0 {
                            bail!("Unexpected EOF while reading response body");
                        }
                        total_bytes_this_response += n;
                        *buf_len += n;
                    }

                    let body_start = header_len;
                    let body_end = header_len + cl;
                    let remaining = *buf_len - required;
                    total_bytes_this_response += header_len.saturating_sub(initial_leftover);

                    if remaining > 0 {
                        buf.copy_within(required..*buf_len, 0);
                    }
                    *buf_len = remaining;

                    return Ok((status, parsed_headers, (body_start, body_end), total_bytes_this_response, should_close));
                }

                // Chunked transfer encoding
                if is_chunked {
                    loop {
                        if let Some(end_idx) = find_chunked_end(&buf[header_len..*buf_len]) {
                            let total_resp_len = header_len + end_idx;
                            let body_start = header_len;
                            let body_end = total_resp_len;
                            let remaining = *buf_len - total_resp_len;
                            total_bytes_this_response += header_len.saturating_sub(initial_leftover);

                            if remaining > 0 {
                                buf.copy_within(total_resp_len..*buf_len, 0);
                            }
                            *buf_len = remaining;

                            return Ok((status, parsed_headers, (body_start, body_end), total_bytes_this_response, should_close));
                        }

                        if *buf_len == buf.len() {
                            buf.resize(buf.len() + 32768, 0);
                        }
                        let n = stream.read(&mut buf[*buf_len..]).await?;
                        if n == 0 {
                            bail!("Unexpected EOF in chunked body");
                        }
                        total_bytes_this_response += n;
                        *buf_len += n;
                    }
                }

                // If no Content-Length and not chunked, if should_close read to EOF
                if should_close {
                    loop {
                        if *buf_len == buf.len() {
                            buf.resize(buf.len() + 32768, 0);
                        }
                        let n = stream.read(&mut buf[*buf_len..]).await?;
                        if n == 0 {
                            break;
                        }
                        total_bytes_this_response += n;
                        *buf_len += n;
                    }
                    let body_start = header_len;
                    let body_end = *buf_len;
                    *buf_len = 0;
                    return Ok((status, parsed_headers, (body_start, body_end), total_bytes_this_response, true));
                }

                // Default assumed no body
                let body_start = header_len;
                let body_end = header_len;
                let remaining = *buf_len - header_len;
                if remaining > 0 {
                    buf.copy_within(header_len..*buf_len, 0);
                }
                *buf_len = remaining;
                return Ok((status, parsed_headers, (body_start, body_end), total_bytes_this_response, should_close));
            }
            Ok(httparse::Status::Partial) => {
                if *buf_len == buf.len() {
                    buf.resize(buf.len() + 16384, 0);
                }
                let n = stream.read(&mut buf[*buf_len..]).await?;
                if n == 0 {
                    if *buf_len == 0 {
                        bail!("Connection closed before receiving response");
                    }
                    bail!("Unexpected EOF while reading headers");
                }
                total_bytes_this_response += n;
                *buf_len += n;
            }
            Err(e) => {
                bail!("HTTP header parse error: {:?}", e);
            }
        }
    }
}

fn find_chunked_end(bytes: &[u8]) -> Option<usize> {
    if bytes.starts_with(b"0\r\n\r\n") {
        return Some(5);
    }
    let pattern = b"\r\n0\r\n\r\n";
    if let Some(pos) = bytes.windows(pattern.len()).position(|w| w == pattern) {
        return Some(pos + pattern.len());
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_default_request() {
        let config = Config {
            target_url: url::Url::parse("http://127.0.0.1:8080/api/test?foo=bar").unwrap(),
            connections: 10,
            threads: 2,
            duration: Duration::from_secs(10),
            timeout: Duration::from_secs(2),
            script_path: None,
            custom_headers: vec![("X-Custom-Auth".to_string(), "secret123".to_string())],
            print_latency: false,
        };

        let req_bytes = build_default_request(&config);
        let req_str = String::from_utf8(req_bytes).unwrap();

        assert!(req_str.starts_with("GET /api/test?foo=bar HTTP/1.1\r\n"));
        assert!(req_str.contains("Host: 127.0.0.1:8080\r\n"));
        assert!(req_str.contains("Connection: keep-alive\r\n"));
        assert!(req_str.contains("User-Agent: wrk/0.1.0\r\n"));
        assert!(req_str.contains("X-Custom-Auth: secret123\r\n"));
        assert!(req_str.ends_with("\r\n\r\n"));
    }

    #[test]
    fn test_find_chunked_end() {
        assert_eq!(find_chunked_end(b"0\r\n\r\n"), Some(5));
        assert_eq!(find_chunked_end(b"hello\r\n0\r\n\r\nextra"), Some(12));
        assert_eq!(find_chunked_end(b"hello incomplete"), None);
    }
}

