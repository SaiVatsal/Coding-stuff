use crate::cli::Config;
use crate::stats::BenchmarkSummary;
use anyhow::Result;
use mlua::prelude::*;
use std::collections::HashMap;
use std::net::ToSocketAddrs;
use std::path::Path;
use std::sync::{Arc, Mutex};

/// Thread context shared with Lua setup/init hooks
#[derive(Clone)]
pub struct ThreadData {
    pub id: usize,
    pub addr: String,
    pub storage: Arc<Mutex<HashMap<String, String>>>,
}

pub struct LuaEngine {
    lua: Lua,
    has_request_hook: bool,
    has_response_hook: bool,
    has_done_hook: bool,
}

impl LuaEngine {
    pub fn new(
        script_path: &Path,
        config: &Config,
        _thread_id: usize,
        thread_data: Option<ThreadData>,
    ) -> Result<Self> {
        let lua = Lua::new();
        let script_content = std::fs::read_to_string(script_path)
            .map_err(|e| anyhow::anyhow!("Failed to read Lua script {:?}: {}", script_path, e))?;

        // Initialize global wrk table
        let wrk_table = lua.create_table()?;
        wrk_table.set("scheme", config.target_url.scheme())?;
        wrk_table.set(
            "host",
            config.target_url.host_str().unwrap_or("localhost"),
        )?;
        let port = config
            .target_url
            .port_or_known_default()
            .unwrap_or(80);
        wrk_table.set("port", port)?;
        wrk_table.set("method", "GET")?;

        let mut path_and_query = config.target_url.path().to_string();
        if let Some(query) = config.target_url.query() {
            path_and_query.push('?');
            path_and_query.push_str(query);
        }
        if path_and_query.is_empty() {
            path_and_query = "/".to_string();
        }
        wrk_table.set("path", path_and_query)?;

        // Headers table
        let headers_table = lua.create_table()?;
        for (k, v) in &config.custom_headers {
            headers_table.set(k.as_str(), v.as_str())?;
        }
        wrk_table.set("headers", headers_table)?;
        wrk_table.set("body", LuaValue::Nil)?;

        // Thread table
        if let Some(td) = thread_data {
            let thread_table = lua.create_table()?;
            thread_table.set("id", td.id)?;
            thread_table.set("addr", td.addr)?;

            let storage_get = td.storage.clone();
            let get_fn = lua.create_function(move |_, (_self, key): (LuaValue, String)| {
                let map = storage_get.lock().unwrap();
                Ok(map.get(&key).cloned())
            })?;
            thread_table.set("get", get_fn)?;

            let storage_set = td.storage.clone();
            let set_fn = lua.create_function(
                move |_, (_self, key, val): (LuaValue, String, String)| {
                    let mut map = storage_set.lock().unwrap();
                    map.insert(key, val);
                    Ok(())
                },
            )?;
            thread_table.set("set", set_fn)?;

            wrk_table.set("thread", thread_table)?;
        }

        // wrk.format(method, path, headers, body)
        let format_fn = lua.create_function(|lua, (method, path, headers, body): (Option<String>, Option<String>, Option<LuaTable>, Option<String>)| {
            let wrk: LuaTable = lua.globals().get("wrk")?;
            let scheme: String = wrk.get("scheme").unwrap_or_else(|_| "http".to_string());
            let host: String = wrk.get("host").unwrap_or_else(|_| "localhost".to_string());
            let port: u16 = wrk.get("port").unwrap_or(80);

            let method = method.unwrap_or_else(|| wrk.get("method").unwrap_or_else(|_| "GET".to_string()));
            let path = path.unwrap_or_else(|| wrk.get("path").unwrap_or_else(|_| "/".to_string()));
            let body = body.or_else(|| wrk.get("body").ok());

            let mut header_pairs: Vec<(String, String)> = Vec::new();
            if let Some(tbl) = headers {
                for pair in tbl.pairs::<String, String>() {
                    if let Ok((k, v)) = pair {
                        header_pairs.push((k, v));
                    }
                }
            } else if let Ok(tbl) = wrk.get::<LuaTable>("headers") {
                for pair in tbl.pairs::<String, String>() {
                    if let Ok((k, v)) = pair {
                        header_pairs.push((k, v));
                    }
                }
            }

            // Build Host header if not already in headers
            let has_host = header_pairs.iter().any(|(k, _)| k.eq_ignore_ascii_case("host"));
            let host_header = if (scheme == "http" && port == 80) || (scheme == "https" && port == 443) {
                host.clone()
            } else {
                format!("{}:{}", host, port)
            };

            let mut req = format!("{} {} HTTP/1.1\r\n", method, path);
            if !has_host {
                req.push_str(&format!("Host: {}\r\n", host_header));
            }

            let mut has_conn = false;
            let mut has_cl = false;
            for (k, v) in &header_pairs {
                if k.eq_ignore_ascii_case("connection") {
                    has_conn = true;
                }
                if k.eq_ignore_ascii_case("content-length") {
                    has_cl = true;
                }
                req.push_str(&format!("{}: {}\r\n", k, v));
            }

            if !has_conn {
                req.push_str("Connection: keep-alive\r\n");
            }

            if let Some(ref b) = body {
                if !has_cl {
                    req.push_str(&format!("Content-Length: {}\r\n", b.len()));
                }
                req.push_str("\r\n");
                req.push_str(b);
            } else {
                req.push_str("\r\n");
            }

            Ok(req)
        })?;
        wrk_table.set("format", format_fn)?;

        // wrk.lookup(host, service)
        let lookup_fn = lua.create_function(|lua, (host, service): (String, Option<String>)| {
            let port_str = service.unwrap_or_else(|| "80".to_string());
            let addr_str = format!("{}:{}", host, port_str);
            let tbl = lua.create_table()?;
            let mut idx = 1;
            if let Ok(iter) = addr_str.to_socket_addrs() {
                for sa in iter {
                    tbl.set(idx, sa.ip().to_string())?;
                    idx += 1;
                }
            }
            Ok(tbl)
        })?;
        wrk_table.set("lookup", lookup_fn)?;

        // wrk.connect(addr)
        let connect_fn = lua.create_function(|_, addr: String| {
            if let Ok(mut iter) = addr.to_socket_addrs() {
                if let Some(sa) = iter.next() {
                    let connected = std::net::TcpStream::connect_timeout(
                        &sa,
                        std::time::Duration::from_millis(500),
                    )
                    .is_ok();
                    return Ok(connected);
                }
            }
            Ok(false)
        })?;
        wrk_table.set("connect", connect_fn)?;

        lua.globals().set("wrk", wrk_table)?;

        // Execute user script
        lua.load(&script_content)
            .set_name(script_path.to_string_lossy())
            .exec()
            .map_err(|e| anyhow::anyhow!("Failed to execute Lua script: {}", e))?;

        let globals = lua.globals();
        let has_request_hook = globals.get::<LuaFunction>("request").is_ok();
        let has_response_hook = globals.get::<LuaFunction>("response").is_ok();
        let has_done_hook = globals.get::<LuaFunction>("done").is_ok();

        // Call init() hook if present
        if let Ok(init_fn) = globals.get::<LuaFunction>("init") {
            let empty_args = lua.create_table()?;
            let _ = init_fn.call::<()>(empty_args);
        }

        Ok(LuaEngine {
            lua,
            has_request_hook,
            has_response_hook,
            has_done_hook,
        })
    }

    pub fn has_response(&self) -> bool {
        self.has_response_hook
    }

    pub fn has_done(&self) -> bool {
        self.has_done_hook
    }

    /// Generate the HTTP request buffer for the next request
    pub fn generate_request(&self) -> Result<Vec<u8>> {
        if self.has_request_hook {
            let globals = self.lua.globals();
            let req_fn: LuaFunction = globals.get("request")?;
            let res: LuaValue = req_fn.call(())?;
            match res {
                LuaValue::String(s) => Ok(s.as_bytes().to_vec()),
                LuaValue::Nil => {
                    // Fallback to wrk.format()
                    let wrk: LuaTable = globals.get("wrk")?;
                    let format_fn: LuaFunction = wrk.get("format")?;
                    let s: String = format_fn.call((LuaValue::Nil, LuaValue::Nil, LuaValue::Nil, LuaValue::Nil))?;
                    Ok(s.into_bytes())
                }
                _ => {
                    anyhow::bail!("request() must return a string or nil");
                }
            }
        } else {
            let globals = self.lua.globals();
            let wrk: LuaTable = globals.get("wrk")?;
            let format_fn: LuaFunction = wrk.get("format")?;
            let s: String = format_fn.call((LuaValue::Nil, LuaValue::Nil, LuaValue::Nil, LuaValue::Nil))?;
            Ok(s.into_bytes())
        }
    }

    /// Call response(status, headers, body) hook
    pub fn call_response(&self, status: u16, headers: &[(String, String)], body: &[u8]) -> Result<()> {
        if !self.has_response_hook {
            return Ok(());
        }
        let globals = self.lua.globals();
        let resp_fn: LuaFunction = globals.get("response")?;

        let headers_table = self.lua.create_table()?;
        for (k, v) in headers {
            headers_table.set(k.as_str(), v.as_str())?;
        }

        let body_str = String::from_utf8_lossy(body);
        resp_fn.call::<()>((status, headers_table, body_str))?;
        Ok(())
    }

    /// Call done(summary, latency, requests) hook
    pub fn call_done(&self, summary: &BenchmarkSummary) -> Result<()> {
        if !self.has_done_hook {
            return Ok(());
        }

        let globals = self.lua.globals();
        let done_fn: LuaFunction = globals.get("done")?;

        // summary table
        let sum_tbl = self.lua.create_table()?;
        sum_tbl.set("duration", summary.duration.as_micros() as u64)?;
        sum_tbl.set("requests", summary.total_requests)?;
        sum_tbl.set("bytes", summary.total_bytes)?;

        let err_tbl = self.lua.create_table()?;
        err_tbl.set("connect", summary.connect_errors)?;
        err_tbl.set("read", summary.read_errors)?;
        err_tbl.set("write", summary.write_errors)?;
        err_tbl.set("status", summary.status_errors)?;
        err_tbl.set("timeout", summary.timeout_errors)?;
        sum_tbl.set("errors", err_tbl)?;

        // latency table with percentile(p) function and min/max/mean/stdev
        let lat_tbl = self.lua.create_table()?;
        lat_tbl.set("min", summary.raw_latency_hist.min())?;
        lat_tbl.set("max", summary.latency.max)?;
        lat_tbl.set("mean", summary.latency.avg)?;
        lat_tbl.set("stdev", summary.latency.stdev)?;

        let hist_clone = summary.raw_latency_hist.clone();
        let percentile_fn = self.lua.create_function(move |_, (_self, p): (LuaValue, f64)| {
            let val = hist_clone.value_at_percentile(p);
            Ok(val)
        })?;
        lat_tbl.set("percentile", percentile_fn)?;

        // requests table
        let req_tbl = self.lua.create_table()?;
        req_tbl.set("min", 0)?;
        req_tbl.set("max", summary.req_sec.max)?;
        req_tbl.set("mean", summary.req_sec.avg)?;
        req_tbl.set("stdev", summary.req_sec.stdev)?;

        done_fn.call::<()>((sum_tbl, lat_tbl, req_tbl))?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn test_lua_post_script() {
        let config = Config {
            target_url: url::Url::parse("http://127.0.0.1:8080/api/users").unwrap(),
            connections: 1,
            threads: 1,
            duration: Duration::from_secs(5),
            timeout: Duration::from_secs(2),
            script_path: Some(Path::new("scripts/post.lua").to_path_buf()),
            custom_headers: vec![],
            print_latency: false,
        };

        let engine = LuaEngine::new(Path::new("scripts/post.lua"), &config, 0, None)
            .expect("Failed to load scripts/post.lua");

        let req_bytes = engine.generate_request().expect("generate_request failed");
        let req_str = String::from_utf8(req_bytes).unwrap();

        assert!(req_str.starts_with("POST /api/users HTTP/1.1\r\n"));
        assert!(req_str.contains("Content-Type: application/json\r\n"));
        assert!(req_str.contains("Content-Length: 79\r\n"));
        assert!(req_str.contains("load_test"));
    }

    #[test]
    fn test_lua_counter_script() {
        let config = Config {
            target_url: url::Url::parse("http://127.0.0.1:8080/").unwrap(),
            connections: 1,
            threads: 1,
            duration: Duration::from_secs(5),
            timeout: Duration::from_secs(2),
            script_path: Some(Path::new("scripts/counter.lua").to_path_buf()),
            custom_headers: vec![],
            print_latency: false,
        };

        let engine = LuaEngine::new(Path::new("scripts/counter.lua"), &config, 0, None)
            .expect("Failed to load scripts/counter.lua");

        let req1 = String::from_utf8(engine.generate_request().unwrap()).unwrap();
        let req2 = String::from_utf8(engine.generate_request().unwrap()).unwrap();

        assert!(req1.contains("GET /items?id=1&session=test HTTP/1.1\r\n"));
        assert!(req2.contains("GET /items?id=2&session=test HTTP/1.1\r\n"));
    }
}

