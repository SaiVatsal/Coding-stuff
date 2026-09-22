mod cli;
mod client;
mod lua;
mod printer;
mod stats;

use anyhow::{Context, Result};
use clap::Parser;
use cli::{Cli, Config};
use client::BenchmarkClient;
use lua::{LuaEngine, ThreadData};
use stats::{BenchmarkSummary, ThreadStats};
use std::collections::HashMap;
use std::net::ToSocketAddrs;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

fn main() -> Result<()> {
    let cli = Cli::parse();
    let config = Config::from_cli(cli)?;

    // Resolve DNS
    let host = config
        .target_url
        .host_str()
        .context("URL must contain host")?;
    let port = config
        .target_url
        .port_or_known_default()
        .unwrap_or(80);

    let addrs: Vec<std::net::SocketAddr> = format!("{}:{}", host, port)
        .to_socket_addrs()
        .with_context(|| format!("Could not resolve host: {}:{}", host, port))?
        .collect();

    if addrs.is_empty() {
        anyhow::bail!("No IP addresses resolved for {}", host);
    }

    // Print initial wrk banner
    printer::print_banner(&config);

    // Prepare cancellation flag (for duration timer or Ctrl+C)
    let stop_flag = Arc::new(AtomicBool::new(false));
    let stop_clone = stop_flag.clone();

    // Set up Ctrl+C handler
    let _ = ctrlc_handler(stop_clone);

    // If script is provided, we can run setup(thread) in the master Lua environment
    let mut thread_datas = Vec::new();
    for thread_id in 0..config.threads {
        let td = ThreadData {
            id: thread_id,
            addr: addrs[0].to_string(),
            storage: Arc::new(Mutex::new(HashMap::new())),
        };
        thread_datas.push(td);
    }

    if let Some(ref script_path) = config.script_path {
        // Run setup phase
        for td in &thread_datas {
            if let Ok(master_lua) = LuaEngine::new(script_path, &config, td.id, Some(td.clone())) {
                // If master script defines setup(thread), it ran during engine initialization
                let _ = master_lua;
            }
        }
    }

    // Distribute connections across threads
    let total_conns = config.connections;
    let num_threads = config.threads;
    let base_conns = total_conns / num_threads;
    let rem_conns = total_conns % num_threads;

    let start_instant = Instant::now();
    let mut thread_handles = Vec::with_capacity(num_threads);

    for thread_id in 0..num_threads {
        let conns_count = base_conns + if thread_id < rem_conns { 1 } else { 0 };
        let thread_config = config.clone();
        let thread_addrs = addrs.clone();
        let thread_stop = stop_flag.clone();
        let thread_data = thread_datas[thread_id].clone();

        let handle = std::thread::Builder::new()
            .name(format!("wrk-worker-{}", thread_id))
            .spawn(move || -> Result<ThreadStats> {
                let rt = tokio::runtime::Builder::new_current_thread()
                    .enable_all()
                    .build()
                    .context("Failed to build Tokio current_thread runtime")?;

                let local_set = tokio::task::LocalSet::new();
                local_set.block_on(&rt, async move {
                    let client = Arc::new(BenchmarkClient::new(thread_config.clone(), thread_addrs)?);
                    let requests_counter = Arc::new(AtomicU64::new(0));

                    // Background 1-second ticker for req/sec sampling
                    let ticker_stop = thread_stop.clone();
                    let ticker_counter = requests_counter.clone();
                    let req_sec_samples = Arc::new(Mutex::new(Vec::new()));
                    let req_sec_writer = req_sec_samples.clone();

                    tokio::task::spawn_local(async move {
                        let mut prev_requests = 0u64;
                        let mut interval = tokio::time::interval(Duration::from_secs(1));
                        interval.tick().await; // skip initial tick
                        while !ticker_stop.load(Ordering::Relaxed) {
                            interval.tick().await;
                            let current = ticker_counter.load(Ordering::Relaxed);
                            let delta = current.saturating_sub(prev_requests);
                            prev_requests = current;
                            if let Ok(mut samples) = req_sec_writer.lock() {
                                samples.push(delta);
                            }
                        }
                    });

                    // Spawn connection tasks
                    let mut conn_handles = Vec::with_capacity(conns_count);
                    for _conn_id in 0..conns_count {
                        let conn_client = client.clone();
                        let conn_stop = thread_stop.clone();
                        let conn_counter = requests_counter.clone();
                        let conn_timeout = thread_config.timeout;

                        // Create Lua engine for this connection if script is enabled
                        let conn_lua = if let Some(ref script_path) = thread_config.script_path {
                            LuaEngine::new(
                                script_path,
                                &thread_config,
                                thread_id,
                                Some(thread_data.clone()),
                            ).ok()
                        } else {
                            None
                        };

                        let conn_handle = tokio::task::spawn_local(client::run_connection_loop(
                            conn_client,
                            conn_stop,
                            conn_counter,
                            conn_lua,
                            conn_timeout,
                        ));

                        conn_handles.push(conn_handle);
                    }

                    // Collect all connection stats for this thread
                    let mut aggregated_thread_stats = ThreadStats::new();
                    for h in conn_handles {
                        if let Ok(s) = h.await {
                            aggregated_thread_stats.requests += s.requests;
                            aggregated_thread_stats.bytes_read += s.bytes_read;
                            aggregated_thread_stats.connect_errors += s.connect_errors;
                            aggregated_thread_stats.read_errors += s.read_errors;
                            aggregated_thread_stats.write_errors += s.write_errors;
                            aggregated_thread_stats.timeout_errors += s.timeout_errors;
                            aggregated_thread_stats.status_errors += s.status_errors;
                            let _ = aggregated_thread_stats.latency_hist.add(&s.latency_hist);
                        }
                    }

                    // Add req_sec samples
                    if let Ok(samples) = req_sec_samples.lock() {
                        for &rps in samples.iter() {
                            aggregated_thread_stats.record_req_sec(rps);
                        }
                    }

                    Ok(aggregated_thread_stats)
                })
            })
            .context("Failed to spawn OS thread")?;

        thread_handles.push(handle);
    }

    // Main thread timer: sleeps for duration then signals stop
    let test_duration = config.duration;
    let sleep_step = Duration::from_millis(100);
    let mut elapsed = Duration::ZERO;
    while elapsed < test_duration {
        if stop_flag.load(Ordering::Relaxed) {
            break;
        }
        std::thread::sleep(sleep_step);
        elapsed += sleep_step;
    }
    stop_flag.store(true, Ordering::SeqCst);

    // Wait for all threads to join
    let mut thread_stats_list = Vec::with_capacity(num_threads);
    for h in thread_handles {
        match h.join() {
            Ok(Ok(stats)) => thread_stats_list.push(stats),
            Ok(Err(e)) => eprintln!("Thread error: {:#}", e),
            Err(_) => eprintln!("Thread panicked"),
        }
    }

    let actual_duration = start_instant.elapsed();
    let summary = BenchmarkSummary::aggregate(thread_stats_list, actual_duration);

    // If Lua script defines done(), run it
    if let Some(ref script_path) = config.script_path {
        if let Ok(master_lua) = LuaEngine::new(script_path, &config, 0, None) {
            if master_lua.has_done() {
                let _ = master_lua.call_done(&summary);
            }
        }
    }

    // Print summary to terminal
    printer::print_summary(&summary, &config);

    Ok(())
}

fn ctrlc_handler(stop: Arc<AtomicBool>) -> Result<()> {
    std::thread::spawn(move || {
        if let Ok(rt) = tokio::runtime::Builder::new_current_thread().enable_all().build() {
            rt.block_on(async move {
                if tokio::signal::ctrl_c().await.is_ok() {
                    stop.store(true, Ordering::SeqCst);
                }
            });
        }
    });
    Ok(())
}
