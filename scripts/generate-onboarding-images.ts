// Generates the four onboarding background images via Gemini Imagen.
// Outputs to assets/onboarding/slide-{1..4}.webp.
//
// Run: npx ts-node --project tsconfig.scripts.json scripts/generate-onboarding-images.ts
// Or:  npm run gen:onboarding

import * as path from 'path';
import * as fs from 'fs';
import { config as loadEnv } from 'dotenv';
import { generateImage } from './geminiImage';

loadEnv();

interface SlidePrompt {
  slug: string;
  prompt: string;
}

const SLIDES: SlidePrompt[] = [
  {
    slug: 'slide-1',
    prompt:
      'Painterly, cinematic illustration of a sweeping ancient battlefield at golden hour — ' +
      'rolling hills, distant smoke, ranks of legionaries silhouetted against a warm parchment-colored sky. ' +
      'Moody but not gory. Inspired by classical history book illustrations and oil paintings. ' +
      'Warm bronze and deep navy palette, painterly brushwork, subtle film grain, ' +
      'deep shadows in foreground for legibility of overlaid text. No visible text or logos.',
  },
  {
    slug: 'slide-2',
    prompt:
      'Painterly illustration of a single dramatic moment from antiquity — a lone hoplite raising a torch, ' +
      'silhouetted against billowing smoke and a parchment sky. Mysterious, contemplative, cinematic. ' +
      'Warm bronze and deep navy palette, painterly brushwork, subtle film grain. ' +
      'Composition leaves the bottom half darker for overlaid text. No visible text or logos.',
  },
  {
    slug: 'slide-3',
    prompt:
      'Painterly illustration of an ancient scroll and quill on a weathered wooden table, ' +
      'lit by a single candle in a darkened scriptorium. Stacks of leather-bound books in shadow. ' +
      'Warm bronze and deep navy palette, painterly brushwork, parchment tones. ' +
      'Composition leaves room above and below for overlaid text. No visible text or logos.',
  },
  {
    slug: 'slide-4',
    prompt:
      'Painterly, cinematic illustration of a tall stone tower at dusk with banners flying — ' +
      'a single figure climbing winding steps under a parchment sky streaked with bronze clouds. ' +
      'Symbolic of progress through ages. Warm bronze and deep navy palette, painterly brushwork, ' +
      'subtle film grain. Bottom-third darker for overlaid text. No visible text or logos.',
  },
];

async function main() {
  const outDir = path.join(__dirname, '..', 'assets', 'onboarding');
  fs.mkdirSync(outDir, { recursive: true });

  for (const slide of SLIDES) {
    const out = path.join(outDir, `${slide.slug}.webp`);
    if (fs.existsSync(out) && !process.argv.includes('--force')) {
      console.log(`Skipping existing ${slide.slug} (pass --force to regenerate)`);
      continue;
    }
    console.log(`Generating ${slide.slug}…`);
    try {
      await generateImage({ prompt: slide.prompt, aspectRatio: '9:16' }, out);
      console.log(`  → ${out}`);
    } catch (err) {
      console.error(`  ✗ ${slide.slug}:`, (err as Error).message);
      process.exitCode = 1;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
