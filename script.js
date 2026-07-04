const searchInput = document.querySelector("[data-search]");
const postCards = Array.from(document.querySelectorAll("[data-post-card]"));
const emptyState = document.querySelector("[data-empty-state]");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
const progressBar = document.querySelector("[data-scroll-progress]");
const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
const kineticTitles = Array.from(document.querySelectorAll(".kinetic-title"));
const countItems = Array.from(document.querySelectorAll("[data-count]"));
const tiltItems = Array.from(document.querySelectorAll("[data-tilt]"));
const magneticItems = Array.from(document.querySelectorAll("[data-magnetic]"));
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

function animateCount(item) {
  const target = Number(item.dataset.count || "0");
  if (!Number.isFinite(target)) return;

  const duration = target > 100 ? 1300 : 820;
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

function setupCursorLines() {
  if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;

  window.addEventListener(
    "pointermove",
    (event) => {
      document.body.style.setProperty("--cursor-x", `${event.clientX}px`);
      document.body.style.setProperty("--cursor-y", `${event.clientY}px`);
      document.body.style.setProperty("--cursor-active", "1");
    },
    { passive: true },
  );

  window.addEventListener("pointerleave", () => {
    document.body.style.setProperty("--cursor-active", "0");
  });
}

function setupTilt() {
  if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;

  for (const item of tiltItems) {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      item.style.setProperty("--tilt-y", `${(x - 0.5) * 6}deg`);
      item.style.setProperty("--tilt-x", `${(0.5 - y) * 6}deg`);
      item.style.setProperty("--spot-x", `${x * 100}%`);
      item.style.setProperty("--spot-y", `${y * 100}%`);
    });

    item.addEventListener("pointerleave", () => {
      item.style.setProperty("--tilt-y", "0deg");
      item.style.setProperty("--tilt-x", "0deg");
      item.style.setProperty("--spot-x", "50%");
      item.style.setProperty("--spot-y", "50%");
    });
  }
}

function setupMagneticButtons() {
  if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;

  for (const item of magneticItems) {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      item.style.setProperty("--magnet-x", `${x * 0.12}px`);
      item.style.setProperty("--magnet-y", `${y * 0.18}px`);
    });

    item.addEventListener("pointerleave", () => {
      item.style.setProperty("--magnet-x", "0px");
      item.style.setProperty("--magnet-y", "0px");
    });
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

splitKineticTitles();
setupProseMotion();
setupCounters();
setupCursorLines();
setupTilt();
setupMagneticButtons();

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
