import { spawn } from 'node:child_process';
import fs from 'node:fs';

export function mergeStreams(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', videoPath,
      '-i', audioPath,
      '-c', 'copy',
      outputPath,
    ];
    const p = spawn('ffmpeg', args, { shell: false });
    let err = '';
    p.stderr.on('data', d => (err += d.toString()));
    p.on('error', e => reject(new Error(`ffmpeg error: ${e.message}`)));
    p.on('close', code => {
      try {
        if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      } catch {}
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg failed (code ${code}): ${err.slice(-500)}`));
    });
  });
}

export function convertToMp3(input: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['-y', '-i', input, '-vn', '-ab', '192k', '-ar', '44100', output];
    const p = spawn('ffmpeg', args, { shell: false });
    let err = '';
    p.stderr.on('data', d => (err += d.toString()));
    p.on('error', e => reject(new Error(`ffmpeg error: ${e.message}`)));
    p.on('close', code => {
      try { fs.unlinkSync(input); } catch {}
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg convert failed: ${err.slice(-300)}`));
    });
  });
}
