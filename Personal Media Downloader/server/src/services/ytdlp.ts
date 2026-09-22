import { spawn } from 'node:child_process';
import type { MediaInfo, FormatInfo, SubtitleInfo } from '@pmd/shared';

export function getInfo(url: string): Promise<MediaInfo> {
  return new Promise((resolve, reject) => {
    const args = [
      '--dump-json',
      '--no-download',
      '--no-playlist',
      '--no-warnings',
      '--no-color',
      url,
    ];
    const p = spawn('yt-dlp', args, { shell: false });
    let out = '';
    let err = '';
    p.stdout.on('data', d => (out += d.toString()));
    p.stderr.on('data', d => (err += d.toString()));
    p.on('error', e => reject(new Error(`yt-dlp error: ${e.message}`)));
    p.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`yt-dlp failed: ${err.trim() || `exit ${code}`}`));
      }
      try {
        const data = JSON.parse(out);
        resolve(parseInfo(data, url));
      } catch (e) {
        reject(new Error('Failed to parse yt-dlp output'));
      }
    });
  });
}

function parseInfo(d: any, url: string): MediaInfo {
  const formats: FormatInfo[] = (d.formats || []).map((f: any) => ({
    formatId: String(f.format_id || ''),
    ext: f.ext || 'unknown',
    resolution: f.resolution || (f.height ? `${f.height}p` : undefined),
    fps: f.fps,
    vcodec: f.vcodec && f.vcodec !== 'none' ? f.vcodec : undefined,
    acodec: f.acodec && f.acodec !== 'none' ? f.acodec : undefined,
    filesize: typeof f.filesize === 'number' ? f.filesize : undefined,
    filesizeApprox: typeof f.filesize_approx === 'number' ? f.filesize_approx : undefined,
    tbr: f.tbr,
    abr: f.abr,
    vbr: f.vbr,
    hdr: !!(f.dynamic_range && /hdr/i.test(f.dynamic_range)),
    hasVideo: !!f.vcodec && f.vcodec !== 'none',
    hasAudio: !!f.acodec && f.acodec !== 'none',
    note: f.format_note,
  }));

  const subtitles: SubtitleInfo[] = [];
  const subs = d.subtitles || {};
  for (const [lang, items] of Object.entries(subs) as [string, any][]) {
    if (Array.isArray(items) && items[0]) {
      subtitles.push({ language: lang, name: items[0].name, ext: items[0].ext || 'vtt' });
    }
  }

  const hasHdr = formats.some(f => f.hdr);
  const type = formats.some(f => f.hasVideo) ? 'video' : formats.some(f => f.hasAudio) ? 'audio' : 'unknown';

  return {
    id: String(d.id || d.extractor || 'media'),
    url,
    title: d.title || 'Untitled',
    uploader: d.uploader || d.channel,
    duration: typeof d.duration === 'number' ? d.duration : undefined,
    thumbnail: d.thumbnail,
    description: d.description,
    type,
    formats,
    subtitles,
    hasHdr,
    webpageUrl: d.webpage_url || url,
  };
}
