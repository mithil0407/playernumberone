#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const ARTICLE_WIDTH = 1600;
const ARTICLE_HEIGHT = 2000;
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

function parseArgs(argv) {
  const result = { overwrite: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--overwrite") {
      result.overwrite = true;
      continue;
    }
    if (!argument.startsWith("--")) continue;
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${argument}`);
    result[argument.slice(2)] = value;
    index += 1;
  }
  return result;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapTitle(title, maxCharacters = 25) {
  const words = title.trim().split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharacters && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function titleSvg({ title, eyebrow }) {
  const lines = wrapTitle(title);
  const tspans = lines
    .map((line, index) => `<tspan x="74" dy="${index === 0 ? 0 : 62}">${escapeXml(line)}</tspan>`)
    .join("");
  return Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="panel" x1="0" x2="1">
          <stop offset="0" stop-color="#7E9098" />
          <stop offset="0.58" stop-color="#84979F" />
          <stop offset="1" stop-color="#84979F" stop-opacity="0" />
        </linearGradient>
        <pattern id="grain" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill="#F4EFE5" fill-opacity="0.10" />
        </pattern>
      </defs>
      <rect width="1200" height="630" fill="url(#panel)" />
      <rect width="1200" height="630" fill="url(#grain)" />
      <text x="74" y="78" fill="#F4EFE5" font-family="Georgia, serif" font-size="27" letter-spacing="9">ICONIK</text>
      <text x="74" y="125" fill="#F4EFE5" fill-opacity="0.65" font-family="Arial, sans-serif" font-size="12" font-weight="600" letter-spacing="4">${escapeXml(eyebrow.toUpperCase())}</text>
      <text x="74" y="236" fill="#FFFFFF" font-family="Georgia, serif" font-size="50" font-weight="400">${tspans}</text>
      <line x1="74" y1="546" x2="420" y2="546" stroke="#F4EFE5" stroke-opacity="0.4" />
      <text x="74" y="580" fill="#F4EFE5" fill-opacity="0.72" font-family="Arial, sans-serif" font-size="13" letter-spacing="2">FASHION INTELLIGENCE FOR INDIAN WOMEN</text>
    </svg>
  `);
}

async function assertWritable(outputs, overwrite) {
  if (overwrite) return;
  const existing = [];
  for (const output of outputs) {
    try {
      await fs.access(output);
      existing.push(output);
    } catch {
      // The output does not exist yet.
    }
  }
  if (existing.length) {
    throw new Error(`Refusing to overwrite existing assets:\n${existing.join("\n")}\nUse --overwrite to replace them.`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const required = ["input", "cluster", "slug", "title"];
  const missing = required.filter((key) => !args[key]);
  if (missing.length) {
    throw new Error(
      `Missing required arguments: ${missing.map((key) => `--${key}`).join(", ")}\n` +
      "Usage: npm run seo:images -- --input <image> --cluster <cluster> --slug <slug> --title <title> [--eyebrow <label>] [--overwrite]",
    );
  }

  if (!/^[a-z0-9-]+$/.test(args.cluster) || !/^[a-z0-9-]+$/.test(args.slug)) {
    throw new Error("Cluster and slug may contain only lowercase letters, numbers, and hyphens.");
  }

  const inputPath = path.resolve(args.input);
  const outputDirectory = path.resolve("public", "seo", args.cluster);
  const articleOutput = path.join(outputDirectory, `${args.slug}.webp`);
  const ogOutput = path.join(outputDirectory, `${args.slug}-og.webp`);
  await assertWritable([articleOutput, ogOutput], args.overwrite);
  await fs.mkdir(outputDirectory, { recursive: true });

  const source = sharp(inputPath, { failOn: "error" }).rotate();
  const metadata = await source.metadata();
  if (!metadata.width || !metadata.height) throw new Error("Unable to read source image dimensions.");
  if (metadata.width < 1024 || metadata.height < 1024) {
    throw new Error(`Source image is too small (${metadata.width}×${metadata.height}). Use an image at least 1024px on both axes.`);
  }

  await source
    .clone()
    .resize(ARTICLE_WIDTH, ARTICLE_HEIGHT, { fit: "cover", position: "attention" })
    .webp({ quality: 84, effort: 6, smartSubsample: true })
    .toFile(articleOutput);

  const ogPortrait = await source
    .clone()
    .resize(600, OG_HEIGHT, { fit: "cover", position: "attention" })
    .webp({ quality: 86, effort: 5 })
    .toBuffer();

  await sharp({
    create: {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      channels: 4,
      background: "#84979F",
    },
  })
    .composite([
      { input: ogPortrait, left: 600, top: 0 },
      { input: titleSvg({ title: args.title, eyebrow: args.eyebrow ?? args.cluster }), left: 0, top: 0 },
    ])
    .webp({ quality: 86, effort: 6, smartSubsample: true })
    .toFile(ogOutput);

  const articleStats = await fs.stat(articleOutput);
  const ogStats = await fs.stat(ogOutput);
  process.stdout.write(JSON.stringify({
    source: inputPath,
    article: { path: articleOutput, width: ARTICLE_WIDTH, height: ARTICLE_HEIGHT, bytes: articleStats.size },
    openGraph: { path: ogOutput, width: OG_WIDTH, height: OG_HEIGHT, bytes: ogStats.size },
  }, null, 2));
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
