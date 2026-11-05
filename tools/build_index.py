#!/usr/bin/env python3
"""Rebuild articles.json from the Markdown files in articles/ and the collections below.

Usage:  python3 tools/build_index.py

- COLLECTIONS are folders of multi-chapter works (e.g. an Obsidian export):
  every sub-folder "N.名称" becomes a series, files "NN-标题.md" become its chapters
  ("00-…" is treated as the folder's own index and skipped).

- Category is kept from the existing articles.json (matched by filename);
  new files get "未分类" until you edit the category in articles.json.
- Title, author, source link, duration and tags come from YAML front matter
  when present, otherwise from the first "# " heading and the header block.
- The excerpt is the first real paragraph of the body.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "articles"
OUT = ROOT / "articles.json"

SERIES_RULES = [
    (re.compile(r"不哭不哭.*?读后感\s*[（(](一|二|三|四)[)）]"), "不哭不哭，痛痛飞走吧 · 读后感"),
    (re.compile(r"任天堂：世界的主宰\s*[（(](一|二|三)[)）]"), "任天堂：世界的主宰"),
]
CN_NUM = {"一": 1, "二": 2, "三": 3, "四": 4}

# (folder relative to the repo root, category shown on the site)
COLLECTIONS = [
    ("杂文短文(数学类)", "📐 数学杂文"),
]
GENERIC_TAGS = {"数学", "杂文短文", "LaTeX-import", "split-note"}


def parse_front_matter(text):
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---", 4)
    if end < 0:
        return {}, text
    block, rest = text[4:end], text[end + 4:].lstrip("\n")
    meta, key = {}, None
    for line in block.splitlines():
        m = re.match(r"^([A-Za-z_]+):\s*(.*)$", line)
        if m:
            key, val = m.group(1), m.group(2).strip().strip('"').strip("'")
            meta[key] = val if val else []
        elif key and re.match(r"^\s*-\s+", line):
            if not isinstance(meta.get(key), list):
                meta[key] = []
            meta[key].append(re.sub(r"^\s*-\s+", "", line).strip().strip('"'))
    return meta, rest


def strip_md(s):
    s = re.sub(r"\$\$[\s\S]*?\$\$", "", s)
    s = re.sub(r"!\[\[[^\]]*\]\]", "", s)
    s = re.sub(r"\[\[([^\]|]*\|)?([^\]]*)\]\]", r"\2", s)
    s = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", s)
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)
    s = re.sub(r"[*_`#>]+", "", s)
    s = re.sub(r"\$[^$]*\$", "", s)
    return re.sub(r"\s+", " ", s).strip()


TEX_SYMBOLS = {
    "pm": "±", "to": "→", "le": "≤", "leq": "≤", "ge": "≥", "geq": "≥", "ne": "≠", "neq": "≠",
    "times": "×", "cdot": "·", "in": "∈", "sigma": "σ", "pi": "π", "lambda": "λ", "alpha": "α",
    "beta": "β", "delta": "δ", "varepsilon": "ε", "ldots": "…", "cdots": "…", "dots": "…",
    "sum": "Σ", "prod": "Π", "infty": "∞", "approx": "≈", "equiv": "≡", "subseteq": "⊆",
}


def tex_plain(tex):
    """Very small TeX -> text conversion, good enough for one-line excerpts."""
    t = re.sub(r"\\(operatorname|mathbb|mathrm|mathbf|mathsf|mathcal|text|boxed)\{([^{}]*)\}", r"\2", tex)
    t = re.sub(r"\\([a-zA-Z]+)", lambda m: TEX_SYMBOLS.get(m.group(1), ""), t)
    t = re.sub(r"[{}^_\\]", "", t)
    return re.sub(r"\s+", " ", t).strip()


def plain_excerpt_text(block):
    block = re.sub(r"^>\s*\[![a-zA-Z]+\][+-]?[^\n]*\n?", "", block)       # callout title line
    block = re.sub(r"^\s*>\s?", "", block, flags=re.M)
    block = re.sub(r"\$\$[\s\S]*?\$\$", "", block)
    block = re.sub(r"\$([^$\n]+)\$", lambda m: tex_plain(m.group(1)), block)
    return strip_md(block)


def header_value(text, label):
    m = re.search(r"\*\*" + label + r"\*\*[：:]\s*(.+)", text)
    return strip_md(m.group(1)) if m else ""


def body_without_header(body):
    """Drop the leading H1, an optional '——subtitle' line, and a meta block before the first ---."""
    lines = body.splitlines()
    i = 0
    while i < len(lines) and not lines[i].strip():
        i += 1
    if i < len(lines) and lines[i].startswith("# "):
        i += 1
    rest = "\n".join(lines[i:])
    head, sep, tail = rest.partition("\n---")
    if sep and re.search(r"UP\s*主|原作者|调研样本", head) and len(head) < 1500:
        rest = tail
    return rest


def first_paragraph(body, skip_quotes=False, avoid_math=False):
    blocks = [b.strip() for b in re.split(r"\n\s*\n", body)]
    if avoid_math:
        plain = [b for b in blocks if "$" not in b]
        blocks = plain + [b for b in blocks if "$" in b]
    for b in blocks:
        if not b or b.startswith(("#", "---", "|", "![", "```", "- [", "1. [")):
            continue
        if skip_quotes and b.startswith(">"):
            continue
        if b.startswith(("——", "—")):
            continue
        t = strip_md(b)
        if len(t) >= 20:
            return t[:140] + ("…" if len(t) > 140 else "")
    return ""


def count_chars(body):
    # Characters of readable text: CJK chars + latin words counted per letter.
    t = strip_md(re.sub(r"^\|.*$", "", body, flags=re.M))
    return len(re.sub(r"\s", "", t))


def main():
    old = {}
    if OUT.exists():
        for item in json.loads(OUT.read_text("utf-8")):
            old[item.get("filename") or item.get("file")] = item

    items = []
    for path in sorted(ART.glob("*.md")):
        raw = path.read_text("utf-8")
        meta, body = parse_front_matter(raw)
        h1 = re.search(r"^# (.+)$", body, flags=re.M)
        title = meta.get("title") or (h1.group(1).strip() if h1 else path.stem)
        series_tag = "围炉夜话" if "围炉夜话" in title else ""
        display = re.sub(r"【[^】]*】", "", title).strip()
        display = re.sub(r"[。．]$", "", display)

        subtitle = ""
        if " —— " in display:
            display, subtitle = [s.strip() for s in display.split(" —— ", 1)]
        else:
            m = re.search(r"^# .+\n(——.+)$", body, flags=re.M)
            if m:
                subtitle = m.group(1).lstrip("—").strip()

        author = meta.get("author") or header_value(body, "UP 主") or header_value(body, "原作者")
        author = re.sub(r"[（(]UID.*$", "", author).strip()
        source = meta.get("url", "")
        if not source:
            m = re.search(r"\]\((https?://[^)]+)\)", body[:1500])
            source = m.group(1) if m else ""
        duration = meta.get("duration", "")
        kind = ""
        if "报告" in display:
            kind = "研究报告"
        elif series_tag:
            kind = "视频文案"
        elif header_value(body, "原作者"):
            kind = "译文"

        series, part = "", 0
        for rx, name in SERIES_RULES:
            m = rx.search(title)
            if m:
                series, part = name, CN_NUM[m.group(1)]

        prev = old.get(path.name, {})
        tags = [t for t in (meta.get("tags") or prev.get("tags") or []) if t != "围炉夜话"][:4]
        main_body = body_without_header(body)
        chars = count_chars(main_body)

        items.append({
            "filename": path.name,
            "title": display,
            "subtitle": subtitle,
            "category": prev.get("category", "未分类"),
            "kind": kind,
            "series": series or series_tag,
            "part": part,
            "author": author,
            "source": source,
            "duration": duration,
            "pdf": path.with_suffix(".pdf").name if path.with_suffix(".pdf").exists() else "",
            "tags": tags,
            "char_count": chars,
            "read_time": f"{max(2, round(chars / 500))} min",
            "excerpt": first_paragraph(main_body),
        })

    items.extend(scan_collections())
    OUT.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(f"wrote {len(items)} articles to {OUT.relative_to(ROOT)}")


def chapter_excerpt(body):
    blocks = [b.strip() for b in re.split(r"\n\s*\n", body) if b.strip()]
    def ok(b):
        return (not b.startswith(("#", "---", "|", "![", "```", "- [")) and "[!info] 导航" not in b
                and not re.search(r"^\s*>?\s*\|", b, flags=re.M))
    # Prefer ordinary paragraphs, then callout bodies; within each, prefer ones without formulas.
    for allow_quote in (False, True):
        pool = [b for b in blocks if ok(b) and (allow_quote or not b.startswith(">"))]
        for b in sorted(pool, key=lambda b: ("$$" in b, "$" in b)):
            t = plain_excerpt_text(b)
            if len(t) >= 24:
                return t[:140] + ("…" if len(t) > 140 else "")
    return ""


def scan_collections():
    items = []
    for folder, category in COLLECTIONS:
        base = ROOT / folder
        if not base.is_dir():
            continue
        for sub in sorted(p for p in base.iterdir() if p.is_dir() and not p.name.startswith(".")):
            series = re.sub(r"^\d+[.、]\s*", "", sub.name)
            for path in sorted(sub.glob("*.md")):
                m = re.match(r"^(\d+)-(.+)\.md$", path.name)
                if not m or int(m.group(1)) == 0:
                    continue
                meta, body = parse_front_matter(path.read_text("utf-8"))
                main_body = body_without_header(body)
                chars = count_chars(main_body)
                rel = path.relative_to(ROOT).as_posix()
                items.append({
                    "filename": rel,
                    "path": rel,
                    "title": meta.get("title") or m.group(2),
                    "subtitle": "",
                    "category": category,
                    "kind": "专著章节",
                    "series": series,
                    "part": int(m.group(1)),
                    "author": "",
                    "source": "",
                    "duration": "",
                    "pdf": "",
                    "tags": [t for t in (meta.get("tags") or []) if t not in GENERIC_TAGS][:4],
                    "char_count": chars,
                    "read_time": f"{max(2, round(chars / 450))} min",
                    "excerpt": chapter_excerpt(main_body),
                })
    return items


if __name__ == "__main__":
    main()
