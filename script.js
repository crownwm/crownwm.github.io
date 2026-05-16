const allGames = (window.CROWN_GAMES || []).filter(
  (game) => game.playable && (game.embedPath || game.embedUrl)
);

const categoryPriority = [
  "All",
  "2 Player",
  "3D",
  "Action",
  "Adventure",
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

function sourceLabel(game) {
  return "Crown";
}

function displayCategory(category = "") {
  return category;
}

function logoFallback(title = "") {
  const initial = escapeHtml(title.slice(0, 1).toUpperCase() || "C");
  return (
    '<span class="thumb-fallback" aria-hidden="true">' +
    '<img src="assets/crown-logo.svg" alt="">' +
    "<b>" +
    initial +
    "</b></span>"
  );
}

function card(game) {
  const href = "play.html?id=" + encodeURIComponent(game.id);
  const title = escapeHtml(game.title);
  const thumb = game.thumbnail || "";
  const img = thumb
    ? '<img class="thumb" loading="lazy" decoding="async" src="' +
      escapeHtml(thumb) +
      '" alt="' +
      title +
      ' logo">'
    : "";

  return (
    '<a class="card" href="' +
    href +
    '" data-category="' +
    escapeHtml(displayCategory(game.category)) +
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
    "</b></span></a>"
  );
}

function searchableText(game) {
  return [game.title, displayCategory(game.category), ...(game.tags || [])].join(" ").toLowerCase();
}

function filteredGames() {
  const query = $("#search").value.trim().toLowerCase();
  return allGames.filter((game) => {
    const categoryMatches = activeCategory === "All" || game.category === activeCategory;
    const searchMatches = !query || searchableText(game).includes(query);
    return categoryMatches && searchMatches;
  });
}

function currentQuery() {
  return $("#search").value.trim();
}

function renderGrid(element, list, limit = list.length) {
  const slice = list.slice(0, limit);
  element.innerHTML = slice.length
    ? slice.map(card).join("")
    : '<div class="empty">No games found. Try another search or category.</div>';
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
}

function categoryCount(category) {
  if (category === "All") return allGames.length;
  return allGames.filter((game) => game.category === category).length;
}

function buildNav() {
  const available = [...new Set(allGames.map((game) => game.category))];
  const priority = categoryPriority.filter(
    (category) => category === "All" || available.includes(category)
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

$("#search").addEventListener("input", () => {
  if (activeCategory !== "All") {
    setActiveCategory("All");
    return;
  }
  render();
});

buildNav();
render();
