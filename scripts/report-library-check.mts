/**
 * Checks the style-library pictures line up: every file is 800x1200, and on
 * full-length and bottoms cards the feet sit on the same floor line. Writes one
 * contact sheet per shape (a row per page) to outputs/ for a visual pass.
 *
 *   node --experimental-strip-types scripts/report-library-check.mts [--shapes apple,pear]
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { BODY_SHAPE_KEYS, GUIDE_CATEGORIES, libraryCardsFor, type BodyShapeKey } from '../src/lib/stylistStyleLibrary.ts';

const args = process.argv.slice(2);
const index = args.indexOf('--shapes');
const shapes = (index >= 0 ? args[index + 1].split(',') : [...BODY_SHAPE_KEYS]) as BodyShapeKey[];
const dir = join(process.cwd(), 'public', 'report-library');
const OUT = '/Users/navalakhaarts/playernumberone/outputs';
const FLOORED = new Set(['goals', 'dresses', 'bottoms']);

async function feetLine(file: string) {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  for (let y = info.height - 1; y >= 0; y--) {
    let dark = 0;
    for (let x = Math.floor(info.width * 0.2); x < info.width * 0.8; x++) if (data[y * info.width + x] < 150) dark++;
    if (dark > info.width * 0.01) return y / info.height;
  }
  return 1;
}

const TILE = { width: 200, height: 300, gap: 8 };
for (const shape of shapes) {
  const problems: string[] = [];
  const rows = [['goals'], ...GUIDE_CATEGORIES.map(category => [category.key])].map(([key]) => libraryCardsFor(shape).filter(item => item.category === key));
  const composites: sharp.OverlayOptions[] = [];
  for (const [row, items] of rows.entries()) {
    for (const [column, { category, card }] of items.entries()) {
      const file = join(dir, shape, `${card.id}.webp`);
      if (!existsSync(file)) { problems.push(`${card.id}: missing`); continue; }
      const meta = await sharp(file).metadata();
      if (meta.width !== 800 || meta.height !== 1200) problems.push(`${card.id}: ${meta.width}x${meta.height}`);
      if (FLOORED.has(category)) {
        const feet = await feetLine(file);
        if (feet < 0.93) problems.push(`${card.id}: feet at ${(feet * 100).toFixed(0)}%`);
      }
      composites.push({ input: await sharp(file).resize(TILE.width, TILE.height).toBuffer(), left: column * (TILE.width + TILE.gap), top: row * (TILE.height + TILE.gap) });
    }
  }
  const sheet = join(OUT, `report-library-${shape}-sheet.jpg`);
  await sharp({ create: { width: 4 * (TILE.width + TILE.gap), height: rows.length * (TILE.height + TILE.gap), channels: 3, background: '#ffffff' } })
    .composite(composites).jpeg({ quality: 80 }).toFile(sheet);
  console.log(`${shape}: ${problems.length ? problems.join('; ') : 'all 800x1200, floor line even'} → ${sheet}`);
}
