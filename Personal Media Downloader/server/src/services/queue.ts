import { EventEmitter } from 'node:events';
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { config } from '../config.js';
import type { DownloadOptions, DownloadProgress, HistoryItem } from '@pmd/shared';
import { newId, safeFilename, safePath } from './sanitizer.js';
import { mergeStreams, convertToMp3 } from './ffmpeg.js';
import { addHistory } from './history.js';

interface Job {
  id: string;
  options: DownloadOptions;
  progress: DownloadProgress;
  child?: ChildProcessWithoutNullStreams;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  waiters: Promise<void>[];
}

class DownloadQueue extends EventEmitter {
  private jobs = new Map<string, Job>();
  private running = 0;

  constructor(private maxConcurrent: number) {
    super();
  }

  setMaxConcurrent(n: number) {
    this.maxConcurrent = Math.max(1, Math.min(10, n));
  }

  list(): DownloadProgress[] {
    return Array.from(this.jobs.values()).map(j => j.progress);
  }

  get(id: string): DownloadProgress | undefined {
    return this.jobs.get(id)?.progress;
  }

  add(options: DownloadOptions): DownloadProgress {
    const id = newId();
    const progress: DownloadProgress = {
      id,
      status: 'queued',
      percent: 0,
      startedAt: Date.now(),
    };
    const job: Job = {
      id,
      options,
      progress,
      waiters: [],
      cancel: () => {},
      pause: () => {},
      resume: () => {},
    };
    this.jobs.set(id, job);
    this.emit('added', progress);
    this.tick();
    return progress;
  }

  cancel(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;
    job.cancel();
    return true;
  }

  pause(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;
    job.pause();
    return true;
  }

  resume(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;
    job.resume();
    return true;
  }

  retry(id: string): DownloadProgress | null {
    const job = this.jobs.get(id);
    if (!job) return null;
    if (['downloading', 'merging', 'converting', 'paused'].includes(job.progress.status)) return null;
    return this.add(job.options);
  }

  remove(id: string) {
    const job = this.jobs.get(id);
    if (job) job.cancel();
    this.jobs.delete(id);
    this.emit('removed', id);
    this.tick();
  }

  private tick() {
    while (this.running < this.maxConcurrent) {
      const next = Array.from(this.jobs.values()).find(j => j.progress.status === 'queued');
      if (!next) break;
      this.running++;
      this.runJob(next).finally(() => {
        this.running--;
        this.tick();
      });
    }
  }

  private updateProgress(id: string, patch: Partial<DownloadProgress>) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.progress = { ...job.progress, ...patch };
    this.emit('progress', job.progress);
  }

  private async runJob(job: Job) {
    const { id, options } = job;
    const settings = JSON.parse(fs.readFileSync(config.settingsFile, 'utf-8').toString() || '{}');

    this.updateProgress(id, { status: 'fetching_info' });

    const outputDir = settings.downloadFolder || config.root;
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const formatString = buildFormatString(options);
    const mergeOutputFormat = options.container === 'original' ? undefined : options.container;

    const args = [
      '--no-playlist',
      '--no-mtime',
      '--no-part',
      '--newline',
      '--no-color',
      '--no-warnings',
      '--progress',
      '--progress-template', 'download:%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress._downloaded_bytes_str)s|%(progress._total_bytes_str)s',
      '-f', formatString,
      '-o', path.join(outputDir, '%(title)s.%(ext)s'),
    ];

    if (mergeOutputFormat) {
      args.push('--merge-output-format', mergeOutputFormat);
    }

    if (options.downloadSubs && options.subLangs) {
      args.push('--write-subs', '--sub-langs', options.subLangs, '--embed-subs');
    }

    args.push(options.url);

    if (options.mode === 'audio_only' && options.audioFormat === 'mp3') {
      args.push('-x', '--audio-format', 'mp3');
    } else if (options.mode === 'audio_only') {
      args.push('-x');
    } else if (options.mode === 'video_only') {
      args.push('-S', 'res,ext:mp4:m4a');
    }

    let child: ChildProcessWithoutNullStreams;
    try {
      child = spawn('yt-dlp', args, { shell: false });
    } catch (e: any) {
      this.updateProgress(id, { status: 'error', error: e.message, finishedAt: Date.now() });
      return;
    }
    job.child = child;

    let cancelled = false;
    let paused = false;
    let killed = false;
    let outputPath: string | null = null;
    let detectedTitle: string | null = null;
    let detectedSize: number | undefined;

    job.cancel = () => {
      cancelled = true;
      try { child.kill('SIGTERM'); } catch {}
    };
    job.pause = () => {
      if (paused) return;
      paused = true;
      this.updateProgress(id, { status: 'paused' });
      try { child.kill('SIGSTOP'); } catch {}
    };
    job.resume = () => {
      if (!paused) return;
      paused = false;
      this.updateProgress(id, { status: 'downloading' });
      try { child.kill('SIGCONT'); } catch {}
    };

    this.updateProgress(id, { status: 'downloading' });

    await new Promise<void>((resolve) => {
      let buf = '';
      child.stdout.on('data', (chunk: Buffer) => {
        buf += chunk.toString();
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('download:')) {
            const parts = line.slice(9).split('|');
            const pct = parseFloat(parts[0]?.replace('%', '') || '0');
            const speedStr = parts[1] || '';
            const etaStr = parts[2] || '';
            this.updateProgress(id, {
              percent: isNaN(pct) ? 0 : pct,
              speed: parseRate(speedStr),
              eta: parseEta(etaStr),
            });
          } else if (line.startsWith('[Merger]') || line.includes('Merging')) {
            this.updateProgress(id, { status: 'merging', stage: 'Merging streams' });
          } else if (line.startsWith('[ExtractAudio]') || line.includes('Extracting audio')) {
            this.updateProgress(id, { status: 'converting', stage: 'Converting audio' });
          } else if (line.startsWith('[ffmpeg]')) {
            this.updateProgress(id, { status: 'converting', stage: 'Post-processing' });
          } else if (line.includes('Destination:')) {
            const m = line.match(/Destination:\s*(.+)$/);
            if (m) {
              outputPath = m[1].trim();
              this.updateProgress(id, { filename: path.basename(outputPath), filepath: outputPath });
              detectedTitle = path.basename(outputPath);
            }
          } else if (line.includes('[download]') && line.includes('100%')) {
            this.updateProgress(id, { percent: 100 });
          }
        }
      });
      child.stderr.on('data', () => {});
      child.on('error', (e) => {
        if (cancelled) {
          this.updateProgress(id, { status: 'cancelled', finishedAt: Date.now() });
        } else {
          this.updateProgress(id, { status: 'error', error: e.message, finishedAt: Date.now() });
        }
        resolve();
      });
      child.on('close', async (code) => {
        if (killed) {
          this.updateProgress(id, { status: 'cancelled', finishedAt: Date.now() });
          return resolve();
        }
        if (cancelled) {
          this.updateProgress(id, { status: 'cancelled', finishedAt: Date.now() });
          return resolve();
        }
        if (code !== 0) {
          this.updateProgress(id, {
            status: 'error',
            error: `yt-dlp exited with code ${code}`,
            finishedAt: Date.now(),
          });
          return resolve();
        }

        let finalPath = outputPath;
        if (!finalPath) {
          try {
            const files = fs.readdirSync(outputDir);
            const recent = files
              .map(f => ({ f, m: fs.statSync(path.join(outputDir, f)).mtimeMs }))
              .sort((a, b) => b.m - a.m);
            if (recent[0]) finalPath = path.join(outputDir, recent[0].f);
          } catch {}
        }

        if (finalPath && fs.existsSync(finalPath)) {
          try {
            const stat = fs.statSync(finalPath);
            detectedSize = stat.size;
          } catch {}
          this.updateProgress(id, {
            status: 'finished',
            percent: 100,
            filename: path.basename(finalPath),
            filepath: finalPath,
            downloadedBytes: detectedSize,
            totalBytes: detectedSize,
            finishedAt: Date.now(),
          });
          const historyItem: HistoryItem = {
            id,
            url: options.url,
            title: path.basename(finalPath, path.extname(finalPath)),
            quality: options.quality,
            format: options.container,
            mode: options.mode,
            container: options.container,
            filesize: detectedSize,
            filename: path.basename(finalPath),
            filepath: finalPath,
            completedAt: Date.now(),
            status: 'finished',
          };
          addHistory(historyItem);
        } else {
          this.updateProgress(id, {
            status: 'finished',
            percent: 100,
            finishedAt: Date.now(),
          });
        }
        resolve();
      });
    });
  }
}

function buildFormatString(o: DownloadOptions): string {
  const q = o.quality;
  const heightFilter = q === 'highest' ? '' : `[height<=${q}]`;
  if (o.mode === 'audio_only') {
    return 'bestaudio/best';
  }
  if (o.mode === 'video_only') {
    return q === 'highest'
      ? 'bestvideo'
      : `bestvideo${heightFilter}/bestvideo`;
  }
  // video + audio
  return q === 'highest'
    ? 'bestvideo+bestaudio/best'
    : `bestvideo${heightFilter}+bestaudio/bestvideo${heightFilter}+bestaudio/best`;
}

function parseRate(s: string): number {
  const m = s.match(/([\d.]+)\s*([KMG]?B)/i);
  if (!m) return 0;
  const v = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  const mult = unit.startsWith('K') ? 1024 : unit.startsWith('M') ? 1024 ** 2 : unit.startsWith('G') ? 1024 ** 3 : 1;
  return v * mult;
}

function parseEta(s: string): number {
  if (!s) return 0;
  if (s === 'Unknown' || s === '--:--') return 0;
  const parts = s.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

export const queue = new DownloadQueue(config.maxConcurrent);
