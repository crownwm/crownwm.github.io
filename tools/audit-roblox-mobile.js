const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "data", "games.js"), "utf8"), sandbox);

const games = Array.isArray(sandbox.window.CROWN_GAMES) ? sandbox.window.CROWN_GAMES : [];

function isClass6xGame(game) {
  return Boolean(game.class6xPage || /^https:\/\/class6x\.gitlab\.io\//i.test(game.embedUrl || ""));
}

function isRobloxStyleGame(game) {
  return /roblox|obby|minecraft|eagler|noob|block|parkour|monster school|herobrine|mine/i.test(
    [game.title, game.category, ...(game.tags || [])].join(" ")
  );
}

function isMobileFriendlyExternalGame(game) {
  if (!isRobloxStyleGame(game)) return false;
  let host = "";
  try {
    host = new URL(game.embedUrl).hostname.toLowerCase();
  } catch (error) {
    return false;
  }

  return (
    host === "html5.gamedistribution.com" ||
    host === "cdn.freegames.com" ||
    host === "www.kidsgame.com" ||
    host === "pizzaedition.win"
  );
}

function isVisibleGame(game) {
  return Boolean(
    game.playable &&
      game.mobileReady !== false &&
      !game.unsupportedReason &&
      ((game.embedType === "html" && game.embedPath) ||
        (game.embedType === "iframe" &&
          game.embedUrl &&
          (isClass6xGame(game) || isMobileFriendlyExternalGame(game))))
  );
}

const robloxStyle = games.filter(isRobloxStyleGame);
const visible = robloxStyle.filter(isVisibleGame);
const hidden = robloxStyle.filter((game) => !isVisibleGame(game));

const hiddenByHost = hidden.reduce((counts, game) => {
  let host = "local-missing";
  if (game.embedUrl) {
    try {
      host = new URL(game.embedUrl).hostname.toLowerCase();
    } catch (error) {
      host = "local-or-invalid";
    }
  }
  counts[host] = (counts[host] || 0) + 1;
  return counts;
}, {});

console.log(
  JSON.stringify(
    {
      robloxStyleTotal: robloxStyle.length,
      visibleRobloxStyle: visible.length,
      hiddenRobloxStyle: hidden.length,
      hiddenByHost,
      hiddenTitles: hidden.map((game) => game.title),
    },
    null,
    2,
  ),
);
