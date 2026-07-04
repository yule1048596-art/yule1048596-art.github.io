const searchInput = document.querySelector("[data-search]");
const postCards = Array.from(document.querySelectorAll("[data-post-card]"));
const emptyState = document.querySelector("[data-empty-state]");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
const kineticTitles = Array.from(document.querySelectorAll(".kinetic-title"));
const countItems = Array.from(document.querySelectorAll("[data-count]"));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let activeFilter = "all";

function normalize(value) {
  return value.trim().toLowerCase();
}

function splitKineticTitles() {
  if (reduceMotion) return;

  for (const title of kineticTitles) {
    if (title.querySelector(".char")) continue;

    const lines = title.dataset.kineticLines ? title.dataset.kineticLines.split("|") : null;
    const label = lines ? lines.join("") : title.textContent || "";
    title.setAttribute("aria-label", label);
    title.textContent = "";

    let charIndex = 0;
    const appendChar = (parent, char) => {
      const span = document.createElement("span");
      span.className = "char";
      span.setAttribute("aria-hidden", "true");
      span.style.setProperty("--char-index", charIndex);
      span.textContent = char === " " ? "\u00a0" : char;
      parent.append(span);
      charIndex += 1;
    };

    if (lines) {
      lines.forEach((line) => {
        const lineWrap = document.createElement("span");
        lineWrap.className = "kinetic-line";
        Array.from(line).forEach((char) => appendChar(lineWrap, char));
        title.append(lineWrap);
      });
    } else {
      Array.from(label).forEach((char) => appendChar(title, char));
    }
  }
}

function setupProseMotion() {
  if (reduceMotion) return;

  document.querySelectorAll(".article-body").forEach((body) => {
    Array.from(body.children).forEach((item, index) => {
      item.style.setProperty("--prose-index", index);
    });
  });
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

function animateCount(item) {
  const target = Number(item.dataset.count || "0");
  if (!Number.isFinite(target)) return;

  const duration = target > 100 ? 1200 : 720;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    item.textContent = String(Math.round(target * eased));

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function setupCounters() {
  if (countItems.length === 0) return;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    countItems.forEach((item) => {
      item.textContent = item.dataset.count || item.textContent;
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.65 },
  );

  countItems.forEach((item) => observer.observe(item));
}

function setupRevealAnimations() {
  if (reduceMotion || revealItems.length === 0) return;

  document.body.classList.add("animations-ready");

  revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index * 55, 360)}ms`);
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
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12,
    },
  );

  revealItems.forEach((item) => observer.observe(item));
}

splitKineticTitles();
setupProseMotion();
setupCounters();

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
