const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "data", "games.js"), "utf8"), sandbox);

const games = sandbox.window.CROWN_GAMES;
const missing = [];
const placeholders = [];
const dirs = {};
const sources = {};

for (const game of games) {
  const thumbnail = game.thumbnail || "";
  sources[game.thumbnailSource || "none"] = (sources[game.thumbnailSource || "none"] || 0) + 1;

  const dirMatch = thumbnail.match(/^assets\/thumbs\/([^/]+)/);
  const dir = dirMatch ? dirMatch[1] : "root/remote/other";
  dirs[dir] = (dirs[dir] || 0) + 1;

  if (!thumbnail) {
    missing.push({ title: game.title, reason: "empty" });
  } else if (!/^https?:/i.test(thumbnail) && !fs.existsSync(path.join(root, thumbnail))) {
    missing.push({ title: game.title, thumbnail, reason: "file missing" });
  }

  if (
    /crown-covers|assets\/thumbs\/generated|title-covers/.test(thumbnail) ||
    game.thumbnailSource === "crown" ||
    game.thumbnailSource === "generated"
  ) {
    placeholders.push({ title: game.title, thumbnail, source: game.thumbnailSource });
  }
}

console.log(
  JSON.stringify(
    {
      total: games.length,
      missing: missing.length,
      placeholders: placeholders.length,
      sources,
      dirs,
      missingSamples: missing.slice(0, 20),
      placeholderSamples: placeholders.slice(0, 20),
    },
    null,
    2,
  ),
);
