export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center shadow-lg shadow-brand-500/30"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="none" width={size * 0.6} height={size * 0.6}>
          <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="font-semibold tracking-tight">Downloader</span>
    </div>
  );
}
