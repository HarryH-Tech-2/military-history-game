// Generates the app icon, sign-in background, and per-era path backgrounds
// via Gemini Imagen. Skips files that already exist unless --force is passed.
//
// Run: npm run gen:appimages [-- --force]

import * as fs from 'fs';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { generateImage } from './geminiImage';
import { ERAS } from '../src/data/eras';

loadEnv();

interface Job {
  out: string;
  prompt: string;
  aspectRatio: '1:1' | '9:16' | '16:9' | '4:3' | '3:4';
}

const ROOT = path.join(__dirname, '..');

const jobs: Job[] = [];

// 1) App icon — square, simple iconic mark.
jobs.push({
  out: path.join(ROOT, 'assets', 'icon.png'),
  aspectRatio: '1:1',
  prompt: [
    'A bold app icon design: crossed antique sword and spear forming an X behind a circular bronze laurel wreath,',
    'centered on a deep navy background. Stylised, flat illustration with subtle bronze gradient.',
    'Strong silhouette readable at small sizes. No text, no logos, no border.',
    'Square composition with generous padding. Style: modern emblem, clean vector look.',
  ].join(' '),
});
jobs.push({
  out: path.join(ROOT, 'assets', 'adaptive-icon.png'),
  aspectRatio: '1:1',
  prompt: [
    'A bold app icon foreground: crossed antique sword and spear behind a bronze laurel wreath, centered.',
    'Transparent-style flat illustration on plain navy background. Strong silhouette, large central padding',
    'so it works inside an Android adaptive-icon mask. No text, no border. Square composition.',
  ].join(' '),
});

// 2) Sign-in background — atmospheric portrait.
jobs.push({
  out: path.join(ROOT, 'assets', 'auth-bg.webp'),
  aspectRatio: '9:16',
  prompt: [
    'Painterly cinematic illustration: panoramic ancient battlefield at dusk seen from a high vantage,',
    'silhouettes of soldiers and banners against a parchment-colored sky streaked with bronze clouds.',
    'Deep navy foreground gradient at top and bottom for overlaid UI legibility.',
    'Warm bronze and deep navy palette, painterly brushwork, subtle film grain. No visible text or logos.',
  ].join(' '),
});

// 3) Path tab — one background per era, scrolling reveals the next age.
const ERA_PROMPTS: Record<string, string> = {
  ancient:
    'Painterly illustration of a sun-bleached ancient world: marble columns, distant pyramids, bronze-armoured ' +
    'phalanxes on a dusty plain under a parchment sky. Warm desert ochre and deep navy palette, painterly brushwork.',
  'dark-ages':
    'Painterly illustration of a misty post-Roman landscape: ruined arches, drifting fog, a lone Anglo-Saxon ' +
    'warrior with a round shield watching distant longships on a grey-blue horizon. Moody parchment and slate palette.',
  medieval:
    'Painterly illustration of a high-medieval battlefield: stone castle on a rocky hill, knights with banners ' +
    'crossing a meadow under heavy clouds. Heraldic colour accents on warm bronze and deep navy palette.',
  'early-modern':
    'Painterly illustration of an early-modern battlefield: pikes and arquebuses, a Renaissance fortress in ' +
    'the distance, smoke from cannon mixing with golden afternoon light. Bronze and navy palette, oil-painting feel.',
  napoleonic:
    'Painterly illustration of a Napoleonic battlefield: lines of infantry in tricorne and shako under a ' +
    'cannon-smoke sky, distant cavalry charging across rolling fields. Dramatic bronze sunlight, deep navy shadows.',
  industrial:
    'Painterly illustration of a late-19th-century industrial battlefield: telegraph wires, distant ironclads, ' +
    'soldiers in dark blue uniforms among earthworks under a bronze-streaked sky. Smoky atmosphere.',
  'world-wars':
    'Painterly illustration of a WWI/WWII landscape: shattered trees, distant tanks crossing fields of mud ' +
    'under a stormy parchment sky, silhouettes of soldiers in greatcoats. Sombre navy and bronze palette.',
  modern:
    'Painterly illustration of a modern conflict landscape: a desert horizon at dusk, helicopters silhouetted ' +
    'against bronze clouds, distant ridge lines. Restrained, cinematic, navy and bronze palette.',
};
for (const era of ERAS) {
  jobs.push({
    out: path.join(ROOT, 'assets', 'era-backgrounds', `${era.id}.webp`),
    aspectRatio: '9:16',
    prompt:
      `${ERA_PROMPTS[era.id] ?? ''} Composition leaves the centre slightly darker for overlaid UI. ` +
      'Subtle film grain. No visible text, captions, or logos. Avoid graphic gore.',
  });
}

async function main() {
  const force = process.argv.includes('--force');
  for (const job of jobs) {
    fs.mkdirSync(path.dirname(job.out), { recursive: true });
    if (fs.existsSync(job.out) && !force) {
      console.log(`Skip existing ${path.relative(ROOT, job.out)} (pass --force to regenerate)`);
      continue;
    }
    console.log(`Generating ${path.relative(ROOT, job.out)}…`);
    try {
      await generateImage({ prompt: job.prompt, aspectRatio: job.aspectRatio }, job.out);
      console.log(`  → ${path.relative(ROOT, job.out)}`);
    } catch (err) {
      console.error(`  ✗ ${path.relative(ROOT, job.out)}:`, (err as Error).message);
      process.exitCode = 1;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
