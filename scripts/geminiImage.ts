// Wrapper around the Gemini image-generation REST API.
// Uses the `generateContent` endpoint with image-capable models
// (e.g. `gemini-2.5-flash-image`).
//
// Reads GEMINI_API_KEY from process.env.

import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { spawnSync } from 'child_process';

const DEFAULT_MODEL = 'gemini-2.5-flash-image';

export interface GenerateOptions {
  prompt: string;
  /** Defaults to "gemini-2.5-flash-image". */
  model?: string;
  /** Aspect ratio hint included in the prompt (the API does not accept it as a structured field). */
  aspectRatio?: '1:1' | '9:16' | '16:9' | '4:3' | '3:4';
}

interface GenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: { mimeType?: string; data?: string };
      }>;
    };
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { code: number; message: string; status: string };
}

function postJson(url: string, body: object): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(text);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${text}`));
          }
        });
      },
    );
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Generates one image and writes it to disk.
 * Returns the local path on success.
 */
export async function generateImage(opts: GenerateOptions, outPath: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const model = opts.model ?? DEFAULT_MODEL;
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // The image models do not take aspect ratio as a structured field, so we add
  // a strong hint in the prompt.
  const ratio = opts.aspectRatio ?? '9:16';
  const promptWithRatio =
    `${opts.prompt}\n\nProduce a single image with aspect ratio ${ratio}. ` +
    `Do not include any text in the image.`;

  const body = {
    contents: [{ parts: [{ text: promptWithRatio }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
    },
  };

  const raw = await postJson(url, body);
  const parsed: GenerateContentResponse = JSON.parse(raw);
  if (parsed.error) throw new Error(`${parsed.error.status}: ${parsed.error.message}`);

  const blockReason = parsed.promptFeedback?.blockReason;
  if (blockReason) throw new Error(`Blocked by safety filter: ${blockReason}`);

  const parts = parsed.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  const b64 = imagePart?.inlineData?.data;
  if (!b64) {
    const txt = parts.find((p) => p.text)?.text ?? '';
    throw new Error(`No image returned. Response text: ${txt.slice(0, 200)}`);
  }

  const buf = Buffer.from(b64, 'base64');
  const wantsWebp = path.extname(outPath).toLowerCase() === '.webp';
  // Gemini returns PNG bytes. If the caller wants .webp, transcode via ffmpeg.
  if (wantsWebp) {
    const tmp = outPath + '.tmp.png';
    fs.writeFileSync(tmp, buf);
    try {
      const r = spawnSync(
        'ffmpeg',
        ['-y', '-i', tmp, '-c:v', 'libwebp', '-quality', '85', outPath],
        { encoding: 'utf8' },
      );
      if (r.status !== 0) {
        throw new Error(
          `ffmpeg failed (status ${r.status}). Install ffmpeg or change the output extension to .png.\n` +
            (r.stderr || ''),
        );
      }
    } finally {
      try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    }
  } else {
    fs.writeFileSync(outPath, buf);
  }
  return outPath;
}
