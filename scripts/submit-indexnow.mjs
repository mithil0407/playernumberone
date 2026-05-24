#!/usr/bin/env node

const DEFAULT_SITE_URL = "https://www.iconik.pro";
const DEFAULT_ENDPOINT = "https://api.indexnow.org/indexnow";
const DEFAULT_KEY = "57eeefa763f74162b49a3024ee31d814";

const args = process.argv.slice(2);

function usage() {
  console.log(`Usage:
  npm run indexnow -- --url /
  npm run indexnow -- --url /style-guides/capsule-wardrobe-india
  npm run indexnow -- --urls /,/blog,/style-guides
  npm run indexnow -- --all
  npm run indexnow -- --all --dry-run

Options:
  --url <url-or-path>       Submit one URL or site-relative path
  --urls <items>            Submit comma-separated URLs or site-relative paths
  --all                     Submit every URL currently listed in sitemap.xml
  --dry-run                 Print payload without submitting
  --site <origin>           Override site origin. Default: ${DEFAULT_SITE_URL}
  --endpoint <url>          Override IndexNow endpoint. Default: ${DEFAULT_ENDPOINT}
  --key <key>               Override IndexNow key. Default: ${DEFAULT_KEY}
`);
}

function optionValue(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

function hasFlag(name) {
  return args.includes(name);
}

function normalizeOrigin(value) {
  const url = new URL(value);
  url.pathname = "";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function normalizeUrl(input, siteUrl) {
  if (!input) throw new Error("URL cannot be empty.");
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return new URL(input).toString();
  }
  return new URL(input.startsWith("/") ? input : `/${input}`, siteUrl).toString();
}

function unique(values) {
  return Array.from(new Set(values));
}

function decodeXmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

async function loadSitemapUrls(siteUrl) {
  const sitemapUrl = `${siteUrl}/sitemap.xml`;
  const response = await fetch(sitemapUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch ${sitemapUrl}: HTTP ${response.status}`);
  }

  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
    decodeXmlEntities(match[1].trim()),
  );

  if (urls.length === 0) {
    throw new Error(`No <loc> entries found in ${sitemapUrl}`);
  }

  return urls;
}

function assertUrlsBelongToHost(urls, host) {
  const mismatched = urls.filter((url) => new URL(url).host !== host);
  if (mismatched.length > 0) {
    throw new Error(
      `All submitted URLs must belong to ${host}. Mismatched URLs: ${mismatched.join(", ")}`,
    );
  }
}

async function submitBatch({ endpoint, payload, dryRun }) {
  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return { status: "dry-run" };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow rejected the request: HTTP ${response.status}${text ? ` ${text}` : ""}`);
  }

  return { status: response.status, body: text };
}

async function main() {
  if (hasFlag("--help") || hasFlag("-h")) {
    usage();
    return;
  }

  const siteUrl = normalizeOrigin(optionValue("--site") ?? process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL);
  const endpoint = optionValue("--endpoint") ?? process.env.INDEXNOW_ENDPOINT ?? DEFAULT_ENDPOINT;
  const key = optionValue("--key") ?? process.env.INDEXNOW_KEY ?? DEFAULT_KEY;
  const dryRun = hasFlag("--dry-run");
  const host = new URL(siteUrl).host;

  let urls = [];
  const oneUrl = optionValue("--url");
  const manyUrls = optionValue("--urls");

  if (oneUrl) {
    urls.push(normalizeUrl(oneUrl, siteUrl));
  }

  if (manyUrls) {
    urls.push(
      ...manyUrls
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => normalizeUrl(item, siteUrl)),
    );
  }

  if (hasFlag("--all")) {
    urls.push(...(await loadSitemapUrls(siteUrl)));
  }

  urls = unique(urls);

  if (urls.length === 0) {
    usage();
    throw new Error("Provide --url, --urls, or --all.");
  }

  if (urls.length > 10000) {
    throw new Error("IndexNow supports up to 10,000 URLs per POST request.");
  }

  assertUrlsBelongToHost(urls, host);

  const payload = {
    host,
    key,
    keyLocation: `${siteUrl}/${key}.txt`,
    urlList: urls,
  };

  const result = await submitBatch({ endpoint, payload, dryRun });
  console.log(
    dryRun
      ? `Dry run complete for ${urls.length} URL(s).`
      : `Submitted ${urls.length} URL(s) to IndexNow. HTTP ${result.status}.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
