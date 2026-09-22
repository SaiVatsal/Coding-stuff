import { spawn } from 'node:child_process';

function check(cmd: string, args: string[]): Promise<{ ok: boolean; version?: string; error?: string }> {
  return new Promise(resolve => {
    const p = spawn(cmd, args, { shell: false });
    let out = '';
    p.stdout.on('data', d => (out += d.toString()));
    p.on('error', e => resolve({ ok: false, error: e.message }));
    p.on('close', code => {
      if (code === 0) {
        const m = out.match(/(\d+\.\d+[\.\d]*)/);
        resolve({ ok: true, version: m?.[1] });
      } else {
        resolve({ ok: false, error: `exit code ${code}` });
      }
    });
  });
}

export async function checkDependencies() {
  const [ytdlp, ffmpeg, ffprobe] = await Promise.all([
    check('yt-dlp', ['--version']),
    check('ffmpeg', ['-version']),
    check('ffprobe', ['-version']),
  ]);
  return { ytdlp, ffmpeg, ffprobe };
}
s