import { spawn, execFile } from 'node:child_process';
import path from 'node:path';
import type { ChildProcess } from 'node:child_process';
import type { MediaInfo, DownloadRequest, DownloadProgress, OutputFormat } from '../../../shared/types.js';
import { parseFormats, findBestVideoFormat, findBestAudioFormat, heightToLabel } from '../utils/format-utils.js';
import { isValidUrl, sanitizeOutputFilename } from '../utils/sanitize.js';
import { config } from '../config.js';
import { createError } from '../middleware/error-handler.js';

// ─── Binary Checks ──────────────────────────────────────────────────────────

async function checkBinary(name: string): Promise<boolean> {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    execFile(cmd, [name], (err) => resolve(!err));
  });
}

export async function checkDependencies(): Promise<{ ytdlp: boolean; ffmpeg: boolean }> {
  const [ytdlp, ffmpeg] = await Promise.all([checkBinary('yt-dlp'), checkBinary('ffmpeg')]);
  return { ytdlp, ffmpeg };
}

// ─── Get Media Info ──────────────────────────────────────────────────────────

export async function getMediaInfo(url: string): Promise<MediaInfo> {
  if (!isValidUrl(url)) {
    throw createError('Invalid URL. Only http and https URLs are allowed.');
  }

  return new Promise((resolve, reject) => {
    const args = [
      '--dump-single-json',
      '--no-exec',
      '--no-warnings',
      '--no-playlist',
      '--js-runtimes', 'node',
      url,
    ];

    const proc = spawn('yt-dlp', args, {
      shell: false,
      timeout: 60_000,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(createError('yt-dlp is not installed or not found in PATH.', 500));
      } else {
        reject(createError(`Failed to run yt-dlp: ${err.message}`, 500));
      }
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        const errMsg = stderr.trim() || 'Failed to fetch media information.';
        // Check for common errors
        if (errMsg.includes('Unsupported URL') || errMsg.includes('is not a valid URL')) {
          reject(createError('This URL is not supported. Please try a different URL.'));
        } else if (errMsg.includes('Video unavailable') || errMsg.includes('Private video')) {
          reject(createError('This media is unavailable or private.'));
        } else if (errMsg.includes('HTTP Error 429')) {
          reject(createError('Too many requests. Please try again later.'));
        } else {
          reject(createError(`Could not retrieve media info: ${errMsg.substring(0, 200)}`));
        }
        return;
      }

      try {
        const raw = JSON.parse(stdout);
        const formats = parseFormats(raw.formats || []);
        const subtitles: Record<string, { language: string; name: string; ext: string; url: string }[]> = {};

        if (raw.subtitles) {
          for (const [lang, tracks] of Object.entries(raw.subtitles)) {
            if (Array.isArray(tracks)) {
              subtitles[lang] = (tracks as Array<Record<string, unknown>>).map((t) => ({
                language: lang,
                name: (t.name as string) || lang,
                ext: (t.ext as string) || 'vtt',
                url: (t.url as string) || '',
              }));
            }
          }
        }

        const info: MediaInfo = {
          id: String(raw.id || ''),
          url,
          title: String(raw.title || 'Untitled'),
          thumbnail: (raw.thumbnail as string) || null,
          duration: (raw.duration as number) || null,
          durationString: (raw.duration_string as string) || null,
          uploader: (raw.uploader as string) || (raw.channel as string) || null,
          uploaderUrl: (raw.uploader_url as string) || (raw.channel_url as string) || null,
          description: (raw.description as string) || null,
          viewCount: (raw.view_count as number) || null,
          likeCount: (raw.like_count as number) || null,
          uploadDate: (raw.upload_date as string) || null,
          formats,
          subtitles,
          bestVideoFormat: findBestVideoFormat(formats, null),
          bestAudioFormat: findBestAudioFormat(formats),
        };

        resolve(info);
      } catch (parseErr) {
        reject(createError('Failed to parse media information.', 500));
      }
    });
  });
}

// ─── Download Media ──────────────────────────────────────────────────────────

export interface DownloadCallbacks {
  onProgress: (progress: Partial<DownloadProgress>) => void;
  onComplete: (filename: string, filesize: number | null) => void;
  onError: (error: string) => void;
}

export function startDownload(
  id: string,
  request: DownloadRequest,
  info: MediaInfo,
  callbacks: DownloadCallbacks,
): ChildProcess {
  if (!isValidUrl(request.url)) {
    throw createError('Invalid URL.');
  }

  const args = buildYtdlpArgs(request, info);
  const title = sanitizeOutputFilename(info.title);
  const ext = getOutputExtension(request);
  const outputTemplate = path.join(config.downloadDir, `${title}.${ext}`);

  args.push('-o', outputTemplate);

  const proc = spawn('yt-dlp', args, {
    shell: false,
    windowsHide: true,
  });

  let lastFilename = `${title}.${ext}`;
  let lastFilesize: number | null = null;

  proc.stdout.on('data', (chunk: Buffer) => {
    const lines = chunk.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      const progress = parseProgressLine(line);
      if (progress) {
        if (progress.filesizeBytes) lastFilesize = progress.filesizeBytes;
        callbacks.onProgress(progress);
      }

      // Detect merge status
      if (line.includes('Merging formats') || line.includes('[Merger]')) {
        callbacks.onProgress({ status: 'merging' });
      }
      if (line.includes('Converting') || line.includes('[ExtractAudio]')) {
        callbacks.onProgress({ status: 'converting' });
      }

      // Detect final filename
      const destMatch = line.match(/\[(?:Merger|ffmpeg|ExtractAudio)\] Destination: (.+)/);
      if (destMatch) {
        lastFilename = path.basename(destMatch[1].trim());
      }
      const alreadyMatch = line.match(/\[download\] (.+) has already been downloaded/);
      if (alreadyMatch) {
        lastFilename = path.basename(alreadyMatch[1].trim());
      }
    }
  });

  proc.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString().trim();
    if (text && !text.startsWith('WARNING')) {
      console.error(`[yt-dlp stderr] ${text}`);
    }
  });

  proc.on('error', (err) => {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      callbacks.onError('yt-dlp is not installed or not found in PATH.');
    } else {
      callbacks.onError(`Download failed: ${err.message}`);
    }
  });

  proc.on('close', (code) => {
    if (code === 0) {
      callbacks.onComplete(lastFilename, lastFilesize);
    } else if (code !== null) {
      // code is null when killed (cancelled)
      callbacks.onError('Download failed. Please check the URL and try again.');
    }
  });

  return proc;
}

// ─── Argument Builder ────────────────────────────────────────────────────────

function buildYtdlpArgs(request: DownloadRequest, info: MediaInfo): string[] {
  const args: string[] = [
    '--no-exec',
    '--no-playlist',
    '--newline',
    '--js-runtimes', 'node',
    '--progress-template', 'download:%(progress._percent_str)s %(progress._speed_str)s %(progress._eta_str)s %(progress._total_bytes_str)s',
  ];

  const { mode, outputFormat, qualityLabel, height } = request;

  if (mode === 'audio_only') {
    args.push('-x'); // Extract audio
    if (outputFormat === 'mp3') {
      args.push('--audio-format', 'mp3', '--audio-quality', '0');
    } else {
      args.push('--audio-format', 'best');
    }
  } else if (mode === 'video_only') {
    // Video only, no audio
    if (height) {
      args.push('-f', `bestvideo[height<=${height}]`);
    } else {
      args.push('-f', 'bestvideo');
    }
    addMergeFormat(args, outputFormat);
  } else {
    // video_audio (default)
    if (height) {
      args.push('-f', `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`);
    } else {
      args.push('-f', 'bestvideo+bestaudio/best');
    }
    addMergeFormat(args, outputFormat);
  }

  // Subtitles
  if (request.downloadSubtitles) {
    args.push('--write-subs');
    if (request.subtitleLanguages && request.subtitleLanguages.length > 0) {
      args.push('--sub-langs', request.subtitleLanguages.join(','));
    } else {
      args.push('--sub-langs', 'en');
    }
  }

  args.push(request.url);

  return args;
}

function addMergeFormat(args: string[], format: OutputFormat): void {
  if (format === 'mp4') {
    args.push('--merge-output-format', 'mp4');
  } else if (format === 'mkv') {
    args.push('--merge-output-format', 'mkv');
  } else if (format === 'webm') {
    args.push('--merge-output-format', 'webm');
  }
  // 'original' — let yt-dlp decide
}

function getOutputExtension(request: DownloadRequest): string {
  if (request.mode === 'audio_only') {
    return request.outputFormat === 'mp3' ? 'mp3' : 'opus';
  }
  switch (request.outputFormat) {
    case 'mp4': return 'mp4';
    case 'mkv': return 'mkv';
    case 'webm': return 'webm';
    default: return '%(ext)s';
  }
}

// ─── Progress Parser ─────────────────────────────────────────────────────────

function parseProgressLine(line: string): Partial<DownloadProgress> | null {
  // Match our custom progress template:
  // download: 45.2%  1.5MiB/s  00:30  150.0MiB
  const templateMatch = line.match(
    /download:\s*([\d.]+)%\s+([\S]+)\s+([\S]+)\s+([\S]+)/,
  );
  if (templateMatch) {
    const percentStr = templateMatch[1];
    const speedStr = templateMatch[2];
    const etaStr = templateMatch[3];
    const sizeStr = templateMatch[4];

    return {
      percent: parseFloat(percentStr) || 0,
      speed: speedStr !== 'N/A' ? speedStr : null,
      eta: etaStr !== 'N/A' ? etaStr : null,
      filesize: sizeStr !== 'N/A' ? sizeStr : null,
      status: 'downloading',
    };
  }

  // Fallback: parse standard yt-dlp output
  const stdMatch = line.match(
    /\[download\]\s+([\d.]+)%\s+of\s+~?\s*([\d.]+\S+)\s+at\s+([\d.]+\S+)\s+ETA\s+(\S+)/,
  );
  if (stdMatch) {
    return {
      percent: parseFloat(stdMatch[1]) || 0,
      filesize: stdMatch[2],
      speed: stdMatch[3],
      eta: stdMatch[4],
      status: 'downloading',
    };
  }

  // 100% completion line
  if (line.includes('[download] 100%')) {
    return { percent: 100, status: 'downloading' };
  }

  return null;
}
