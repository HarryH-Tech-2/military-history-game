// Detects gaps in assets/battles/ (missing battle-N.webp files relative to the
// IDs referenced by src/data/battles) and generates new ones via Gemini Imagen.
//
// Outputs are written as `battle-N.webp` (transcoded from PNG via ffmpeg)
// to match the existing battle-N.webp naming used by the bundler.
// Requires `ffmpeg` on PATH.
//
// Run: npm run gen:battles -- [--limit N]

import * as fs from 'fs';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { generateImage } from './geminiImage';
import { allBattles } from '../src/data/battles';

loadEnv();

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'battles');

function existingIds(): Set<number> {
  if (!fs.existsSync(ASSETS_DIR)) return new Set();
  const ids = new Set<number>();
  for (const f of fs.readdirSync(ASSETS_DIR)) {
    const m = f.match(/^battle-(\d+)\.(webp|png|jpg|jpeg)$/);
    if (m) ids.add(Number(m[1]));
  }
  return ids;
}

function promptFor(battle: { name: string; year: number; location: string; description: string }): string {
  const yearLabel = battle.year < 0 ? `${Math.abs(battle.year)} BC` : `${battle.year} AD`;
  return [
    `Painterly, cinematic illustration of the historical battle "${battle.name}" (${yearLabel}, ${battle.location}).`,
    battle.description,
    'Style: classical oil-painting / history book illustration with warm bronze and deep navy palette,',
    'painterly brushwork, subtle film grain, dramatic lighting, atmospheric perspective.',
    'Wide cinematic landscape composition. Bottom of frame darker for overlaid UI.',
    'No visible text, captions, or logos. Avoid graphic gore.',
  ].join(' ');
}

async function main() {
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : Infinity;

  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  const have = existingIds();
  const missing = allBattles.filter((b) => !have.has(b.id)).slice(0, limit);

  if (missing.length === 0) {
    console.log(`All ${allBattles.length} battle images present. Nothing to do.`);
    return;
  }

  console.log(`Generating ${missing.length} missing battle image(s)…`);
  for (const battle of missing) {
    const out = path.join(ASSETS_DIR, `battle-${battle.id}.webp`);
    console.log(`#${battle.id} ${battle.name}`);
    try {
      await generateImage({ prompt: promptFor(battle), aspectRatio: '16:9' }, out);
      console.log(`  → ${out}`);
    } catch (err) {
      console.error(`  ✗ failed:`, (err as Error).message);
      process.exitCode = 1;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
