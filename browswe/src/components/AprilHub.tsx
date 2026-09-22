// components/AprilHub.tsx — Zero-latency new tab dashboard
//
// This is what users see when they open a new tab (before navigating anywhere).
// Completely local — no network calls, no tracking. Features:
//   - Greeting with current time
//   - Quick search bar (mirrors OmniBar behavior)
//   - Speed dial grid with common sites
//   - Live stats: tabs open, ads blocked, tokens used

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Shield,
  Layers,
  Zap,
  ArrowRight,
} from "lucide-react";

interface AprilHubProps {
  onNavigate: (url: string) => void;
  tabCount: number;
  blockedCount: number;
}

const SPEED_DIALS = [
  { name: "Google", url: "https://google.com", color: "#4285F4", letter: "G" },
  { name: "YouTube", url: "https://youtube.com", color: "#FF0000", letter: "Y" },
  { name: "GitHub", url: "https://github.com", color: "#8B5CF6", letter: "G" },
  { name: "Reddit", url: "https://reddit.com", color: "#FF4500", letter: "R" },
  { name: "Wikipedia", url: "https://wikipedia.org", color: "#636363", letter: "W" },
  { name: "Stack Overflow", url: "https://stackoverflow.com", color: "#F48024", letter: "S" },
  { name: "Twitter / X", url: "https://x.com", color: "#1DA1F2", letter: "X" },
  { name: "Hacker News", url: "https://news.ycombinator.com", color: "#FF6600", letter: "H" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AprilHub({
  onNavigate,
  tabCount,
  blockedCount,
}: AprilHubProps) {
  const [search, setSearch] = useState("");
  const [time, setTime] = useState(formatTime());

  // Update clock every minute
  useEffect(() => {
    const interval = setInterval(() => setTime(formatTime()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = useCallback(() => {
    const trimmed = search.trim();
    if (!trimmed) return;

    // Detect URLs vs search queries
    if (/^https?:\/\//i.test(trimmed) || /^[\w-]+\.[\w]{2,}/i.test(trimmed)) {
      onNavigate(
        trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
      );
    } else {
      onNavigate(`https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`);
    }
  }, [search, onNavigate]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-auto">
      {/* Hero section */}
      <div className="text-center mb-10 animate-fade-in">
        {/* Branding */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-april-primary to-purple-600 flex items-center justify-center shadow-lg shadow-april-primary/20">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
        </div>

        <p className="text-3xl font-light text-april-text mb-1">{time}</p>
        <p className="text-sm text-april-muted">{getGreeting()}</p>
      </div>

      {/* Search bar */}
      <div className="w-full max-w-[520px] mb-10 animate-fade-in">
        <div
          className="flex items-center gap-3 h-12 px-4 rounded-xl
                       bg-april-surface border border-april-border
                       focus-within:border-april-primary/50 focus-within:shadow-[0_0_20px_rgba(124,58,237,0.1)]
                       transition-all duration-300"
        >
          <Search size={18} className="text-april-muted flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search the web or enter a URL..."
            className="flex-1 bg-transparent text-april-text text-sm placeholder:text-april-muted/50 outline-none"
            autoFocus
          />
          {search.trim() && (
            <button
              onClick={handleSearch}
              className="w-8 h-8 rounded-lg bg-april-primary/20 text-april-primary
                         hover:bg-april-primary/30 flex items-center justify-center transition-colors"
            >
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Speed dials */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-[520px] mb-10 animate-fade-in">
        {SPEED_DIALS.map((site) => (
          <button
            key={site.url}
            onClick={() => onNavigate(site.url)}
            className="group flex flex-col items-center gap-2 p-3 rounded-xl
                       hover:bg-april-surface transition-all duration-200"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold
                           shadow-lg transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: site.color + "CC" }}
            >
              {site.letter}
            </div>
            <span className="text-[11px] text-april-muted group-hover:text-april-text transition-colors truncate max-w-full">
              {site.name}
            </span>
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 text-[11px] text-april-muted animate-fade-in">
        <div className="flex items-center gap-1.5">
          <Layers size={12} className="text-april-primary" />
          <span>
            {tabCount} tab{tabCount !== 1 ? "s" : ""} open
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield size={12} className="text-april-success" />
          <span>{blockedCount.toLocaleString()} ads blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap size={12} className="text-april-warning" />
          <span>Zero telemetry</span>
        </div>
      </div>

      {/* Privacy notice */}
      <p className="text-[10px] text-april-muted/40 mt-6 text-center max-w-[400px]">
        April Browser — your data stays on your device. No analytics, no tracking,
        no cloud sync. Built with Tauri, Rust, and React.
      </p>
    </div>
  );
}
