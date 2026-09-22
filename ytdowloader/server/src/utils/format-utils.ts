import type { FormatOption } from '../../../shared/types.js';

/** Map a pixel height to a human-readable label. */
export function heightToLabel(height: number | null): string {
  if (!height) return 'Unknown';
  if (height >= 2160) return '2160p (4K)';
  if (height >= 1440) return '1440p';
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p';
  if (height >= 480) return '480p';
  if (height >= 360) return '360p';
  if (height >= 240) return '240p';
  if (height >= 144) return '144p';
  return `${height}p`;
}

/** Check if a format has HDR content. */
export function isHdr(vcodec: string | null): boolean {
  if (!vcodec) return false;
  const hdrCodecs = ['vp9.2', 'av01', 'hev1', 'hvc1'];
  return hdrCodecs.some((c) => vcodec.toLowerCase().includes(c));
}

/**
 * Parse yt-dlp's raw format list into our typed FormatOption[].
 */
export function parseFormats(rawFormats: Record<string, unknown>[]): FormatOption[] {
  return rawFormats.map((f) => {
    const vcodec = (f.vcodec as string) || null;
    const acodec = (f.acodec as string) || null;
    const hasVideo = !!vcodec && vcodec !== 'none';
    const hasAudio = !!acodec && acodec !== 'none';
    const height = (f.height as number) || null;

    return {
      formatId: String(f.format_id ?? ''),
      ext: String(f.ext ?? 'unknown'),
      resolution: f.resolution as string | null,
      width: (f.width as number) || null,
      height,
      fps: (f.fps as number) || null,
      vcodec: hasVideo ? vcodec : null,
      acodec: hasAudio ? acodec : null,
      filesize: (f.filesize as number) || null,
      filesizeApprox: (f.filesize_approx as number) || null,
      tbr: (f.tbr as number) || null,
      hasVideo,
      hasAudio,
      hdr: isHdr(vcodec),
      qualityLabel: hasVideo ? heightToLabel(height) : hasAudio ? 'Audio' : 'Unknown',
    };
  });
}

/**
 * Find the best matching format for a desired height.
 * If exact match not found, picks the closest smaller resolution.
 */
export function findBestVideoFormat(
  formats: FormatOption[],
  desiredHeight: number | null,
): FormatOption | null {
  const videoFormats = formats
    .filter((f) => f.hasVideo && f.height)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

  if (videoFormats.length === 0) return null;
  if (!desiredHeight) return videoFormats[0]; // Highest available

  // Exact match
  const exact = videoFormats.find((f) => f.height === desiredHeight);
  if (exact) return exact;

  // Next best (closest smaller)
  const smaller = videoFormats.filter((f) => (f.height ?? 0) <= desiredHeight);
  return smaller.length > 0 ? smaller[0] : videoFormats[videoFormats.length - 1];
}

/**
 * Find the best audio-only format.
 */
export function findBestAudioFormat(formats: FormatOption[]): FormatOption | null {
  const audioFormats = formats
    .filter((f) => f.hasAudio && !f.hasVideo)
    .sort((a, b) => (b.tbr ?? 0) - (a.tbr ?? 0));

  return audioFormats.length > 0 ? audioFormats[0] : null;
}

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}
