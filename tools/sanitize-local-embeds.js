const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const embedsDir = path.join(root, "embeds");
const reportFile = path.join(root, "data", "embed-sanitize-report.json");

const BLOCKED_SCRIPT_PATTERNS = [
  /googletagmanager\.com\/gtag\/js/i,
  /google-analytics\.com/i,
  /pagead2\.googlesyndication\.com/i,
  /static\.cloudflareinsights\.com\/beacon/i,
  /adsbygoogle/i,
];

const INLINE_BLOCK_PATTERNS = [
  /gtag\s*\(/i,
  /dataLayer/i,
  /adsbygoogle/i,
  /googletagmanager/i,
  /googlesyndication/i,
  /cloudflareinsights/i,
];

function walkHtmlFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      walkHtmlFiles(fullPath, files);
    } else if (item.isFile() && /\.html?$/i.test(item.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function removeBlockedScripts(html) {
  let removed = 0;
  const next = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (tag) => {
    const blockedBySrc = BLOCKED_SCRIPT_PATTERNS.some((pattern) => pattern.test(tag));
    const blockedInline = !/\bsrc\s*=/i.test(tag) && INLINE_BLOCK_PATTERNS.some((pattern) => pattern.test(tag));
    if (blockedBySrc || blockedInline) {
      removed += 1;
      return "";
    }
    return tag;
  });

  return { html: next, removed };
}

function main() {
  const changed = [];
  let totalRemoved = 0;

  for (const file of walkHtmlFiles(embedsDir)) {
    const before = fs.readFileSync(file, "utf8");
    const result = removeBlockedScripts(before);
    if (!result.removed) continue;
    fs.writeFileSync(file, result.html, "utf8");
    totalRemoved += result.removed;
    changed.push({
      file: path.relative(root, file).replace(/\\/g, "/"),
      scriptsRemoved: result.removed,
    });
  }

  fs.writeFileSync(
    reportFile,
    JSON.stringify(
      {
        filesChanged: changed.length,
        scriptsRemoved: totalRemoved,
        changed,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`Sanitized ${changed.length} embed files. Removed ${totalRemoved} ad/analytics scripts.`);
  console.log(`Report: ${path.relative(root, reportFile)}`);
}

main();
