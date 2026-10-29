/**
 * Draws the women's report style-library pictures: for each body shape, the
 * two styling-goal looks and four cards on each clothing page.
 *
 * Every picture is the same shoot: the same white cyclorama, the same model
 * for a shape (face out of frame), front view, and the same crop for its page,
 * saved at exactly 800x1200 so the cards line up in the report.
 *
 *   node --experimental-strip-types --env-file=.env.local \
 *     scripts/report-library-images.mts [--shapes apple,pear] [--ids tops-1,goal-2] [--force] [--concurrency 4]
 *
 * Originals are kept in outputs/report-library so a re-run only draws what is
 * missing; the report reads the WebP copies in public/report-library.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import OpenAI from 'openai';
import { BODY_SHAPE_KEYS, BODY_SHAPE_LIBRARY, libraryCardsFor, type BodyShapeKey, type LibraryCard } from '../src/lib/stylistStyleLibrary.ts';

const args = process.argv.slice(2);
const option = (name: string) => { const index = args.indexOf(`--${name}`); return index >= 0 ? args[index + 1] : undefined; };
const SHAPES = (option('shapes')?.split(',') ?? [...BODY_SHAPE_KEYS]) as BodyShapeKey[];
const IDS = option('ids')?.split(',');
const FORCE = args.includes('--force');
const CONCURRENCY = Math.max(1, Number(option('concurrency')) || 4);
const ORIGINALS = '/Users/navalakhaarts/playernumberone/outputs/report-library';
const PUBLIC_DIR = join(process.cwd(), 'public', 'report-library');
const WIDTH = 800;
const HEIGHT = 1200;

/**
 * Each page shows only its own garment, cropped the same way on every card of
 * that page: tops from the chin to mid-thigh, bottoms from the waist to the
 * floor, layers from the chin to the knee, shoes as a close-up. Dresses and the
 * styling goals are whole looks, so they run from the chin to the floor.
 */
type Crop = 'full' | 'top' | 'bottom' | 'layer' | 'feet';
const CROP_FOR: Record<string, Crop> = { goals: 'full', dresses: 'full', tops: 'top', bottoms: 'bottom', layers: 'layer', footwear: 'feet' };

const FRAMING: Record<Crop, string> = {
  full: 'Framing (identical for every picture of this kind): portrait 2:3. The top edge of the frame cuts across the neck just below the chin, so the face is never visible. The bottom edge sits a little below the feet, with a thin strip of floor. The figure is centred and fills the height of the frame.',
  top: 'Framing (identical for every picture of this kind): upper body only, portrait 2:3. The top edge of the frame cuts across the neck just below the chin, so the face is never visible. The bottom edge cuts across the middle of the thighs, a little below the hem of the top, so the whole top is visible and only a hint of the bottoms. Nothing below mid-thigh is visible. The torso is centred and fills the frame.',
  bottom: 'Framing (identical for every picture of this kind): lower body only, portrait 2:3. The top edge of the frame sits just above the waistband, at the natural waist, so only the very bottom of the tucked top is visible. The bottom edge sits a little below the feet, with a thin strip of floor, so the shoes are fully visible. Nothing above the waist is visible. The legs are centred and fill the height of the frame.',
  layer: 'Framing (identical for every picture of this kind): portrait 2:3. The top edge of the frame cuts across the neck just below the chin, so the face is never visible. The bottom edge cuts just above the knees. The jacket or layer is fully visible and centred; it is the focus.',
  feet: 'Framing (identical for every picture of this kind): a close-up of the lower legs and shoes only, portrait 2:3. The top edge of the frame cuts across the middle of the calves; nothing above the knee is visible. The shoes sit in the lower third of the frame, large and sharp, with a thin strip of floor below them. Feet slightly apart, toes pointing at the camera, centred.',
};

export function libraryPrompt(shape: BodyShapeKey, category: string, item: LibraryCard) {
  const model = BODY_SHAPE_LIBRARY[shape].model;
  const crop = CROP_FOR[category] ?? 'full';
  const subject = {
    feet: `Footwear: ${item.look}, worn with plain ankle-length black trousers or a plain black midi skirt so the shoes are the focus.`,
    top: `The top: ${item.look}. The top is the focus; anything below it is plain and dark.`,
    bottom: `The bottoms: ${item.look}. The bottoms and the shoes are the focus; the top is plain and tucked in.`,
    layer: `The layer: ${item.look}. Under the layer, only a plain, basic fitted top in a neutral colour (or the plain garment named). The layer is the focus.`,
    full: `Outfit: ${item.look}. Everything not named is plain and simple; nothing extra added.`,
  }[crop];
  return `Photorealistic e-commerce fashion photograph for a style guide card.

Model: ${model}. Medium-brown skin. Natural, flattering and true to this body shape, not exaggerated.
Pose: standing straight, facing the camera head-on (front view), weight even, arms relaxed by her sides or one hand lightly in a pocket, so every garment is fully visible.

${subject}

${FRAMING[crop]}

Background: seamless white cyclorama studio, bright white wall curving into a very light warm-grey floor, soft natural shadow at her feet. Soft even daylight studio lighting, true-to-life fabric texture and colour. No text, logos, labels or watermarks.`;
}

const hash = (text: string) => createHash('sha1').update(text).digest('hex').slice(0, 10);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const log = (...parts: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...parts);

async function draw(prompt: string) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const result = await openai.images.generate({ model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2', prompt, size: '1024x1536', quality: 'medium' } as Parameters<typeof openai.images.generate>[0]);
      const b64 = (result as { data?: Array<{ b64_json?: string }> }).data?.[0]?.b64_json;
      if (!b64) throw new Error('no image returned');
      return Buffer.from(b64, 'base64');
    } catch (error) {
      if (attempt >= 3) throw error;
      log(`retrying after: ${String(error).slice(0, 160)}`);
      await new Promise(resolve => setTimeout(resolve, 8000 * attempt));
    }
  }
}

type Job = { shape: BodyShapeKey; category: string; item: LibraryCard; prompt: string; original: string; output: string };
const jobs: Job[] = SHAPES.flatMap(shape => libraryCardsFor(shape)
  .filter(({ card }) => !IDS || IDS.includes(card.id))
  .map(({ category, card }) => {
    const prompt = libraryPrompt(shape, category, card);
    mkdirSync(join(ORIGINALS, shape), { recursive: true });
    mkdirSync(join(PUBLIC_DIR, shape), { recursive: true });
    return { shape, category, item: card, prompt, original: join(ORIGINALS, shape, `${card.id}-${hash(prompt)}.png`), output: join(PUBLIC_DIR, shape, `${card.id}.webp`) };
  }));

/** Where the feet end, as a share of the height: the lowest row with a little dark (shoe or skin) in the middle. */
async function feetLine(image: Buffer) {
  const { data, info } = await sharp(image).greyscale().raw().toBuffer({ resolveWithObject: true });
  for (let y = info.height - 1; y >= 0; y--) {
    let dark = 0;
    for (let x = Math.floor(info.width * 0.2); x < info.width * 0.8; x++) if (data[y * info.width + x] < 150) dark++;
    if (dark > info.width * 0.01) return y / info.height;
  }
  return 1;
}

/** Target feet line: body shots stand on the same floor line; shoe close-ups sit a little higher. */
const FEET_TARGET: Partial<Record<Crop, number>> = { full: 0.96, bottom: 0.96, feet: 0.9 };

async function finish(job: Job) {
  // Exactly the same size for every card (2:3), and the figure the same size in each:
  // when the feet end high, zoom in from the top so they land on the shared floor line.
  const sized = await sharp(readFileSync(job.original)).resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' }).toBuffer();
  // Tops and layers stop above the feet, so only full-length crops are lined up on the floor.
  const target = FEET_TARGET[CROP_FOR[job.category] ?? 'full'];
  const feet = target ? await feetLine(sized) : 1;
  let output = sharp(sized);
  if (target && feet < target - 0.01) {
    const height = Math.round(HEIGHT * Math.max(feet / target, 0.75));
    const width = Math.round(height * WIDTH / HEIGHT);
    output = sharp(sized).extract({ left: Math.round((WIDTH - width) / 2), top: 0, width, height }).resize(WIDTH, HEIGHT);
  }
  writeFileSync(job.output, await output.webp({ quality: 80 }).toBuffer());
}

const todo = jobs.filter(job => FORCE || !existsSync(job.original));
log(`${jobs.length} pictures; ${todo.length} to draw.`);
let done = 0;
const queue = [...jobs];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  for (let job = queue.shift(); job; job = queue.shift()) {
    try {
      if (FORCE || !existsSync(job.original)) {
        writeFileSync(job.original, await draw(job.prompt));
        done += 1;
        log(`drew ${job.shape}/${job.item.id} (${done}/${todo.length})`);
      }
      await finish(job);
    } catch (error) {
      log(`FAILED ${job.shape}/${job.item.id}: ${String(error).slice(0, 240)}`);
    }
  }
}));
log('done');
