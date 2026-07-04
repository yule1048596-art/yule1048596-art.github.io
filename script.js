const searchInput = document.querySelector("[data-search]");
const postCards = Array.from(document.querySelectorAll("[data-post-card]"));
const emptyState = document.querySelector("[data-empty-state]");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
const progressBar = document.querySelector("[data-scroll-progress]");
const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let activeFilter = "all";

function normalize(value) {
  return value.trim().toLowerCase();
}

function updateScrollProgress() {
  if (!progressBar || reduceMotion) return;

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  progressBar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
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
    if (isVisible) {
      visibleCount += 1;
      card.classList.add("is-in-view");
    }
  }

  if (emptyState) {
    emptyState.hidden = visibleCount !== 0;
  }
}

function setupRevealAnimations() {
  if (reduceMotion || revealItems.length === 0) return;

  document.body.classList.add("animations-ready");

  revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index * 55, 420)}ms`);
  });

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in-view");
          observer.unobserve(entry.target);
        }
      }
    },
    {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.12,
    },
  );

  revealItems.forEach((item) => observer.observe(item));
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

setupRevealAnimations();
updateScrollProgress();
window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);
