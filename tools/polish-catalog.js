const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const catalogPath = path.join(root, "data", "games.js");

function loadGames() {
  const raw = fs
    .readFileSync(catalogPath, "utf8")
    .replace(/^\s*window\.CROWN_GAMES\s*=\s*/, "")
    .replace(/;\s*$/, "");
  return JSON.parse(raw);
}

function writeGames(games) {
  fs.writeFileSync(catalogPath, "window.CROWN_GAMES = " + JSON.stringify(games, null, 2) + ";\n");
}

function normalizeTitle(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|game|games|html|probably|glitchy|chance|of|loading)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceScore(game) {
  const target = String(game.embedUrl || game.embedPath || "");
  let score = 0;
  if (target.includes("pizzaedition.win/assets/mainstorage/")) score += 100;
  if (target.includes("class6x.gitlab.io/")) score += 80;
  if (game.driveFolderId || target.includes("embeds/drive/")) score += 60;
  if (game.embedType === "html") score += 20;
  if (game.sourceHadEmbed) score += 5;
  if (String(game.thumbnail || "").endsWith(".svg")) score -= 3;
  return score;
}

function isBlockedTarget(game) {
  const target = String(game.embedUrl || game.embedPath || "");
  return /(^|\/\/)(?:www\.)?playhop\.com\//i.test(target);
}

function dedupe(games) {
  const chosen = new Map();
  const removed = [];
  for (const game of games) {
    if (isBlockedTarget(game)) {
      removed.push(game);
      continue;
    }
    const key = normalizeTitle(game.title);
    if (!key) continue;
    const current = chosen.get(key);
    if (!current || sourceScore(game) > sourceScore(current)) {
      if (current) removed.push(current);
      chosen.set(key, game);
    } else {
      removed.push(game);
    }
  }
  return {
    games: [...chosen.values()].sort((a, b) => String(a.title).localeCompare(String(b.title))),
    removed,
  };
}

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hash(value = "") {
  let out = 2166136261;
  for (const char of String(value)) {
    out ^= char.charCodeAt(0);
    out = Math.imul(out, 16777619);
  }
  return out >>> 0;
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "game";
}

function localFileExists(relativePath = "") {
  return Boolean(relativePath) && fs.existsSync(path.join(root, relativePath.replace(/\//g, path.sep)));
}

function hasUsableThumbnail(game) {
  const thumbnail = String(game.thumbnail || "");
  return (
    thumbnail &&
    !/assets\/thumbs\/logos\//i.test(thumbnail) &&
    !/assets\/thumbs\/crown-covers\//i.test(thumbnail) &&
    !/^https?:/i.test(thumbnail) &&
    localFileExists(thumbnail)
  );
}

const palettes = [
  ["#6d28d9", "#f97316", "#facc15"],
  ["#0f766e", "#38bdf8", "#a3e635"],
  ["#7c2d12", "#f59e0b", "#fde68a"],
  ["#1d4ed8", "#22d3ee", "#fef08a"],
  ["#be185d", "#fb7185", "#fef3c7"],
  ["#14532d", "#22c55e", "#fef08a"],
  ["#111827", "#64748b", "#ffffff"],
  ["#312e81", "#a855f7", "#f0abfc"],
];

function wrapTitle(title) {
  const words = String(title).replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (next.length > 14 && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function categoryIcon(category = "", title = "") {
  const text = (category + " " + title).toLowerCase();
  if (/roblox|obby|simulator|blox|brookhaven|steal|brainrot|tycoon/.test(text)) {
    return '<rect x="110" y="82" width="108" height="108" rx="22" fill="#f8fafc" opacity=".95" transform="rotate(-10 164 136)"/><rect x="144" y="115" width="40" height="40" rx="7" fill="#111827" opacity=".78" transform="rotate(-10 164 136)"/><rect x="268" y="92" width="110" height="110" rx="24" fill="#facc15" opacity=".95" transform="rotate(12 323 147)"/><rect x="304" y="128" width="40" height="40" rx="7" fill="#111827" opacity=".78" transform="rotate(12 323 147)"/><path d="M138 256c40-36 79-53 118-50 42 3 78 23 118 50" fill="none" stroke="#f8fafc" stroke-width="22" stroke-linecap="round" opacity=".8"/>';
  }
  if (/racing|driving|car|kart|moto|bike|truck/.test(text)) {
    return '<path d="M135 187h242l38 44v44h-34a45 45 0 0 0-88 0h-74a45 45 0 0 0-88 0H96v-50l39-38z" fill="#111827" opacity=".82"/><circle cx="175" cy="278" r="29" fill="#f8fafc"/><circle cx="337" cy="278" r="29" fill="#f8fafc"/><path d="M171 204h129l30 31H138l33-31z" fill="#38bdf8"/>';
  }
  if (/shoot|gun|sniper|doom|war|battle|combat/.test(text)) {
    return '<circle cx="374" cy="126" r="54" fill="none" stroke="#f8fafc" stroke-width="14" opacity=".75"/><path d="M374 52v148M300 126h148" stroke="#f8fafc" stroke-width="11" opacity=".75"/><path d="M83 244h245l47 34-47 34H83z" fill="#111827" opacity=".82"/><path d="M293 244l42-54h67l-38 72z" fill="#facc15"/>';
  }
  if (/sport|soccer|basket|ball|pool|football|golf/.test(text)) {
    return '<circle cx="350" cy="155" r="72" fill="#f8fafc" opacity=".92"/><path d="M282 155h136M350 87v136M302 108c35 32 61 65 96 93M398 108c-35 32-61 65-96 93" stroke="#111827" stroke-width="10" opacity=".75"/>';
  }
  if (/puzzle|word|trivia|2048|mahjong|tetris|chess/.test(text)) {
    return '<path d="M304 82h70v64h64v70h-64v64h-70v-64h-64v-70h64z" fill="#f8fafc" opacity=".9"/><rect x="88" y="178" width="162" height="118" rx="22" fill="#111827" opacity=".78"/><path d="M110 228h118M110 262h76" stroke="#facc15" stroke-width="13" stroke-linecap="round"/>';
  }
  if (/click|idle|miner|merge/.test(text)) {
    return '<path d="M331 77c48 28 72 77 62 134-10 58-50 94-107 101-58 7-106-18-132-69l61-22c15 28 37 40 67 36 31-4 50-22 56-52 6-31-7-56-36-73z" fill="#f8fafc" opacity=".88"/><path d="M187 282l-55-154 152 58-61 31 54 54-36 36-54-54z" fill="#facc15" stroke="#111827" stroke-width="8" stroke-linejoin="round"/>';
  }
  return '<path d="M158 96l64 64 58-91 53 91 74-58-28 150H129z" fill="#facc15" stroke="#111827" stroke-width="13" stroke-linejoin="round"/><rect x="124" y="249" width="260" height="38" rx="12" fill="#f8fafc" stroke="#111827" stroke-width="10"/>';
}

function svgFor(game) {
  const id = "g" + hash(game.id || game.title);
  const palette = palettes[hash(game.title) % palettes.length];
  const lines = wrapTitle(game.title);
  const baseSize = lines.length === 1 ? 58 : lines.length === 2 ? 45 : 34;
  const lineSvg = lines
    .map((line, index) => {
      const y = 188 + index * (baseSize + 3);
      return `<text x="34" y="${y}" font-size="${baseSize}" font-family="Impact, Arial Black, sans-serif" fill="#fff" stroke="#111827" stroke-width="7" paint-order="stroke" letter-spacing=".5">${escapeXml(line.toUpperCase())}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="288" viewBox="0 0 512 288" role="img" aria-label="${escapeXml(game.title)}">
  <defs>
    <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette[0]}"/>
      <stop offset=".58" stop-color="${palette[1]}"/>
      <stop offset="1" stop-color="${palette[2]}"/>
    </linearGradient>
    <filter id="${id}shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="9" flood-color="#000" flood-opacity=".38"/>
    </filter>
    <pattern id="${id}dots" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="2" fill="#fff" opacity=".2"/>
    </pattern>
  </defs>
  <rect width="512" height="288" rx="28" fill="url(#${id}bg)"/>
  <rect width="512" height="288" rx="28" fill="url(#${id}dots)" opacity=".7"/>
  <circle cx="430" cy="12" r="138" fill="#fff" opacity=".16"/>
  <circle cx="64" cy="298" r="166" fill="#000" opacity=".2"/>
  <g filter="url(#${id}shadow)" transform="translate(18 -6) scale(.9)">
    ${categoryIcon(game.category, game.title)}
  </g>
  <rect x="25" y="26" width="151" height="34" rx="17" fill="#111827" opacity=".82"/>
  <text x="43" y="49" font-size="18" font-family="Arial Black, Arial, sans-serif" fill="#fef3c7" letter-spacing="1.5">CROWN GAMES</text>
  ${lineSvg}
</svg>
`;
}

function refreshAllCovers(games) {
  let updated = 0;
  for (const game of games) {
    if (hasUsableThumbnail(game)) continue;
    const coverPath = path
      .join(
        "assets",
        "thumbs",
        "crown-covers",
        `${slugify(game.title || game.id)}-${hash(game.id || game.title).toString(16)}.svg`
      )
      .replace(/\\/g, "/");
    const file = path.join(root, coverPath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, svgFor(game));
    game.thumbnail = coverPath;
    game.thumbnailSource = "crown";
    updated++;
  }
  return updated;
}

const games = loadGames();
const { games: deduped, removed } = dedupe(games);
const updatedCovers = refreshAllCovers(deduped);
writeGames(deduped);
console.log(JSON.stringify({ before: games.length, after: deduped.length, removed: removed.length, updatedCovers }, null, 2));
