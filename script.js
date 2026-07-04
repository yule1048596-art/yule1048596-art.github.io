const searchInput = document.querySelector("[data-search]");
const postCards = Array.from(document.querySelectorAll("[data-post-card]"));
const emptyState = document.querySelector("[data-empty-state]");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));

let activeFilter = "all";

function normalize(value) {
  return value.trim().toLowerCase();
}

function updatePosts() {
  const query = searchInput ? normalize(searchInput.value) : "";
  let visibleCount = 0;

  for (const card of postCards) {
    const title = card.dataset.title || "";
    const tags = card.dataset.tags || "";
    const haystack = normalize(`${title} ${tags}`);
    const matchesSearch = haystack.includes(query);
    const matchesFilter = activeFilter === "all" || tags.includes(activeFilter);
    const isVisible = matchesSearch && matchesFilter;

    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  }

  if (emptyState) {
    emptyState.hidden = visibleCount !== 0;
  }
}

if (searchInput) {
  searchInput.addEventListener("input", updatePosts);
}

for (const button of filterButtons) {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";
    if (searchInput) {
      searchInput.value = "";
    }

    for (const item of filterButtons) {
      item.classList.toggle("active", item === button);
    }

    updatePosts();
  });
}
