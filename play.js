const games = (window.CROWN_GAMES || []).filter(
  (entry) => entry.playable && (entry.embedPath || entry.embedUrl)
);
const params = new URLSearchParams(location.search);
const id = params.get("id");
const game = games.find((entry) => entry.id === id);
const player = document.getElementById("player");
const fitToggle = document.getElementById("fitToggle");

document.getElementById("playTitle").textContent = game ? game.title : "Game not found";
document.getElementById("playMeta").textContent = game
  ? displayCategory(game.category) + " | " + sourceLabel(game)
  : "Pick a game from the main page";

function sourceLabel(entry) {
  return "Crown Player";
}

function displayCategory(category = "") {
  return category;
}

function escapeAttr(value = "") {
  return String(value).replace(/[&<>"']/g, (ch) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[ch];
  });
}

function notice(message) {
  player.innerHTML = '<div class="notice">' + message + "</div>";
}

function frame(src) {
  player.innerHTML =
    '<iframe sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-downloads allow-presentation allow-modals" allow="autoplay; fullscreen; gamepad; clipboard-read; clipboard-write; pointer-lock" allowfullscreen referrerpolicy="no-referrer-when-downgrade" src="' +
    escapeAttr(src) +
    '"></iframe>';
}

fitToggle.addEventListener("click", () => {
  const fill = player.classList.toggle("fill-mode");
  player.classList.toggle("fit-mode", !fill);
  fitToggle.textContent = fill ? "Fill" : "Fit";
});

try {
  if (!game) {
    notice('Game not found. <a href="index.html">Back to Crown Games</a>');
  } else if (game.embedType === "html" && game.embedPath) {
    frame(game.embedPath);
  } else if (game.embedType === "swf" && game.embedUrl) {
    const ruffle = window.RufflePlayer?.newest?.();
    if (!ruffle) {
      notice("Ruffle did not load yet. Refresh once, or try another game.");
    } else {
      const rufflePlayer = ruffle.createPlayer();
      player.innerHTML = "";
      player.appendChild(rufflePlayer);
      rufflePlayer.load(game.embedUrl).catch(() => {
        notice("This Flash game failed to load in Ruffle. The rest of Crown is still fine.");
      });
    }
  } else if (game.embedUrl) {
    frame(game.embedUrl);
  } else {
    notice('This game does not have a usable embed. <a href="index.html">Back to Crown Games</a>');
  }
} catch (error) {
  notice('The game hit a load error. <a href="index.html">Back to Crown Games</a>');
}
