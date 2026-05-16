const allGames = (window.CROWN_GAMES || []).filter(
  (game) => game.playable && (game.embedPath || game.embedUrl)
);
const FAVORITES_KEY = "crownFavoritesV1";
const THUMB_VERSION = "20260516-cover-icons";

const categoryPriority = [
  "All",
  "Favorites",
  "2 Player",
  "3D",
  "Action",
  "Adventure",
  "Roblox-Style",
  "Racing",
  "Puzzle",
  "Shooting",
  "Sports",
  "Skill",
  "Multiplayer",
  "Bonus Games",
  "Games",
];
let activeCategory = "All";
const MIN_CATEGORY_SECTION_SIZE = 10;
let favoriteIds = loadFavorites();

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value = "") {
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

function versionedAsset(url = "") {
  if (!url || /^(?:https?:|data:|blob:)/i.test(url)) return url;
  return url + (url.includes("?") ? "&" : "?") + "v=" + THUMB_VERSION;
}

function sourceLabel() {
  return "Crown";
}

function displayCategory(category = "") {
  return category;
}

function loadFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"));
  } catch (error) {
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteIds]));
  } catch (error) {}
}

function favoriteCount() {
  return allGames.filter((game) => favoriteIds.has(game.id)).length;
}

function updateFavoriteNavCount() {
  const badge = document.querySelector('[data-cat="Favorites"] small');
  if (badge) badge.textContent = favoriteCount();
}

function toggleFavorite(id) {
  if (favoriteIds.has(id)) {
    favoriteIds.delete(id);
  } else {
    favoriteIds.add(id);
  }
  saveFavorites();
  render();
}

function logoFallback(title = "") {
  const initial = escapeHtml(title.slice(0, 1).toUpperCase() || "C");
  return (
    '<span class="thumb-fallback" aria-hidden="true">' +
    "<b>" +
    initial +
    "</b></span>"
  );
}

function favoriteButton(game) {
  const pressed = favoriteIds.has(game.id);
  return (
    '<button class="favorite-button" type="button" data-fav-id="' +
    escapeHtml(game.id) +
    '" aria-pressed="' +
    (pressed ? "true" : "false") +
    '" aria-label="' +
    escapeHtml((pressed ? "Remove " : "Add ") + game.title + (pressed ? " from favorites" : " to favorites")) +
    '"><span>&#9733;</span></button>'
  );
}

function card(game) {
  const href = "play.html?id=" + encodeURIComponent(game.id);
  const title = escapeHtml(game.title);
  const thumb = game.thumbnail || "";
  const thumbSrc = versionedAsset(thumb);
  const img = thumb
    ? '<img class="thumb" loading="lazy" decoding="async" src="' +
      escapeHtml(thumbSrc) +
      '" alt="' +
      title +
      ' cover">'
    : "";

  return (
    '<article class="card' +
    (favoriteIds.has(game.id) ? " is-favorite" : "") +
    '" data-category="' +
    escapeHtml(displayCategory(game.category)) +
    '">' +
    favoriteButton(game) +
    '<a class="card-link" href="' +
    href +
    '" data-game-id="' +
    escapeHtml(game.id) +
    '" data-game-title="' +
    title +
    '" data-game-thumbnail="' +
    escapeHtml(thumbSrc) +
    '">' +
    '<span class="thumb-wrap">' +
    img +
    logoFallback(game.title) +
    "</span>" +
    '<span class="card-title">' +
    title +
    "</span>" +
    '<span class="card-meta"><span>' +
    escapeHtml(displayCategory(game.category)) +
    '</span><b>' +
    sourceLabel(game) +
    "</b></span></a></article>"
  );
}

function showLaunchLoader(link) {
  const loader = document.getElementById("launchLoader");
  if (!loader) return false;
  const icon = document.getElementById("launchLoaderIcon");
  const title = document.getElementById("launchLoaderTitle");
  const fallback = versionedAsset("assets/crown-logo.svg");
  const thumbnail = link.dataset.gameThumbnail || fallback;
  if (icon) icon.src = thumbnail || fallback;
  if (title) title.textContent = link.dataset.gameTitle || "Loading Crown Game";
  loader.removeAttribute("hidden");
  requestAnimationFrame(() => loader.classList.add("is-active"));
  return true;
}

function searchableText(game) {
  return [game.title, displayCategory(game.category), ...(game.tags || [])].join(" ").toLowerCase();
}

function categoryMatches(game) {
  if (activeCategory === "All") return true;
  if (activeCategory === "Favorites") return favoriteIds.has(game.id);
  return game.category === activeCategory;
}

function filteredGames() {
  const query = $("#search").value.trim().toLowerCase();
  return allGames.filter((game) => {
    const searchMatches = !query || searchableText(game).includes(query);
    return categoryMatches(game) && searchMatches;
  });
}

function currentQuery() {
  return $("#search").value.trim();
}

function emptyMessage() {
  if (activeCategory === "Favorites" && !currentQuery()) {
    return "No favorites yet. Hit the star on games you want to save.";
  }
  return "No games found. Try another search or category.";
}

function renderGrid(element, list, limit = list.length) {
  const slice = list.slice(0, limit);
  element.innerHTML = slice.length
    ? slice.map(card).join("")
    : '<div class="empty">' + escapeHtml(emptyMessage()) + "</div>";
}

function render() {
  const query = currentQuery();
  const list = filteredGames();
  const isFiltering = Boolean(query) || activeCategory !== "All";
  const featured = list.slice(0, 24);
  const fresh = [...list].reverse().slice(0, 24);

  document.body.classList.toggle("is-filtering", isFiltering);
  if (!isFiltering) {
    renderGrid($("#trendingGrid"), featured);
    renderGrid($("#latestGrid"), fresh);
  }
  renderGrid($("#allGrid"), list);

  $("#resultsTitle").textContent = isFiltering
    ? query
      ? 'Search Results for "' + query + '"'
      : displayCategory(activeCategory)
    : "All Games";
  $("#gameCount").textContent = allGames.length;
  updateFavoriteNavCount();
}

function categoryCount(category) {
  if (category === "All") return allGames.length;
  if (category === "Favorites") return favoriteCount();
  return allGames.filter((game) => game.category === category).length;
}

function buildNav() {
  const available = [...new Set(allGames.map((game) => game.category))].filter(
    (category) => categoryCount(category) >= MIN_CATEGORY_SECTION_SIZE
  );
  const priority = categoryPriority.filter(
    (category) => category === "All" || category === "Favorites" || available.includes(category)
  );
  const remaining = available
    .filter((category) => !priority.includes(category))
    .sort((a, b) => a.localeCompare(b));
  const categories = [...priority, ...remaining];

  $("#categoryNav").innerHTML = categories
    .map((category) => {
      return (
        '<button type="button" data-cat="' +
        escapeHtml(category) +
        '"><span>' +
        escapeHtml(displayCategory(category).replace(/ Games$/, "")) +
        "</span><small>" +
        categoryCount(category) +
        "</small></button>"
      );
    })
    .join("");

  $("#categoryNav").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    setActiveCategory(button.dataset.cat, true);
  });

  $("#categoryNav button")?.classList.add("active");
}

function setActiveCategory(category, shouldScroll = false) {
  activeCategory = category;
  document
    .querySelectorAll(".nav button")
    .forEach((item) => item.classList.toggle("active", item.dataset.cat === activeCategory));
  render();
  if (shouldScroll) {
    document.getElementById("allGamesSection")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

document.addEventListener(
  "error",
  (event) => {
    if (!event.target.matches?.(".thumb")) return;
    event.target.closest(".thumb-wrap")?.classList.add("thumb-missing");
    event.target.remove();
  },
  true
);

document.addEventListener("click", (event) => {
  const button = event.target.closest(".favorite-button");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  toggleFavorite(button.dataset.favId);
});

document.addEventListener("click", (event) => {
  const link = event.target.closest(".card-link");
  if (!link || event.defaultPrevented) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  showLaunchLoader(link);
  window.setTimeout(() => {
    window.location.href = link.href;
  }, 260);
});

$("#search").addEventListener("input", () => {
  if (activeCategory !== "All") {
    setActiveCategory("All");
    return;
  }
  render();
});

buildNav();
render();
