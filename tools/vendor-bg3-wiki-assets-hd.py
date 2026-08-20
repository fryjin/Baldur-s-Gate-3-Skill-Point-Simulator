#!/usr/bin/env python3
"""Vendor the highest native BG3 tooltip images available from bg3.wiki.

Run from repository root:
    python tools/vendor-bg3-wiki-assets-hd.py

Optional:
    python tools/vendor-bg3-wiki-assets-hd.py --kind spell
    python tools/vendor-bg3-wiki-assets-hd.py --kind equipment
    python tools/vendor-bg3-wiki-assets-hd.py --replace-lower-res
    python tools/vendor-bg3-wiki-assets-hd.py --dry-run

Design rule:
- Prefer 380x380 tooltip artwork (spell tooltip / item Faded artwork).
- Keep the original file bytes and native dimensions. Never AI-upscale or resize a
  64/144px icon and label it HD.
- Fall back to Controller UI icons only when no tooltip image can be resolved.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import struct
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPELLS = ROOT / "assets/js/data/spells.js"
EQUIP = ROOT / "assets/v8/equipment-catalog.js"
OVERRIDES = ROOT / "tools/bg3-wiki-hd-overrides.json"
OUT_S = ROOT / "assets/hd/spells"
OUT_E = ROOT / "assets/hd/equipment"
REPORT = ROOT / "BG3_WIKI_HD_ASSET_REPORT.json"
UA = "BG3-Planner-HD-asset-vendor/2.0 (one-time local vendoring; contact via project repo)"
RETRIES = 4
DEFAULT_DELAY = 3.0
IMAGE_EXTS = (".png", ".webp", ".jpg", ".jpeg")


def wiki_file(file_name: str) -> str:
    return "https://bg3.wiki/wiki/Special:FilePath/" + urllib.parse.quote(file_name, safe="'()")


def wiki_page(title: str) -> str:
    return "https://bg3.wiki/wiki/" + urllib.parse.quote(title.replace(" ", "_"), safe="'()")


def original_from_mediawiki_thumb(url: str) -> str:
    """Turn /w/images/thumb/a/b/File.png/300px-File.png.webp into /w/images/a/b/File.png."""
    p = urllib.parse.urlsplit(html.unescape(url))
    path = p.path
    marker = "/w/images/thumb/"
    if marker not in path:
        return urllib.parse.urlunsplit((p.scheme, p.netloc, path, "", ""))
    tail = path.split(marker, 1)[1]
    parts = tail.split("/")
    if len(parts) >= 4:
        original_path = "/w/images/" + "/".join(parts[:3])
        return urllib.parse.urlunsplit((p.scheme, p.netloc, original_path, "", ""))
    return url


def absolute_bg3_url(url: str) -> str:
    url = html.unescape(url).strip()
    if url.startswith("//"):
        url = "https:" + url
    elif url.startswith("/"):
        url = "https://bg3.wiki" + url
    return original_from_mediawiki_thumb(url)


def valid_image(data: bytes) -> bool:
    return (
        (len(data) > 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP")
        or data.startswith(b"\x89PNG\r\n\x1a\n")
        or data[:3] == b"\xff\xd8\xff"
    )


def extension(data: bytes) -> str:
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    if data.startswith(b"\x89PNG"):
        return ".png"
    return ".jpg"


def image_size(data: bytes) -> tuple[int, int] | None:
    try:
        if data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) >= 24:
            return struct.unpack(">II", data[16:24])
        if len(data) > 30 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
            kind = data[12:16]
            if kind == b"VP8X" and len(data) >= 30:
                w = 1 + int.from_bytes(data[24:27], "little")
                h = 1 + int.from_bytes(data[27:30], "little")
                return w, h
            if kind == b"VP8L" and len(data) >= 25 and data[20] == 0x2F:
                b1, b2, b3, b4 = data[21:25]
                w = 1 + (b1 | ((b2 & 0x3F) << 8))
                h = 1 + ((b2 >> 6) | (b3 << 2) | ((b4 & 0x0F) << 10))
                return w, h
            sig = data.find(b"\x9d\x01\x2a", 20, min(len(data), 80))
            if sig >= 0 and sig + 7 <= len(data):
                w = int.from_bytes(data[sig + 3:sig + 5], "little") & 0x3FFF
                h = int.from_bytes(data[sig + 5:sig + 7], "little") & 0x3FFF
                return w, h
        if data[:3] == b"\xff\xd8\xff":
            i = 2
            while i + 9 < len(data):
                if data[i] != 0xFF:
                    i += 1
                    continue
                marker = data[i + 1]
                if marker in (0xD8, 0xD9):
                    i += 2
                    continue
                n = int.from_bytes(data[i + 2:i + 4], "big")
                if marker in tuple(range(0xC0, 0xC4)) + tuple(range(0xC5, 0xC8)) + tuple(range(0xC9, 0xCC)) + tuple(range(0xCD, 0xD0)):
                    return int.from_bytes(data[i + 7:i + 9], "big"), int.from_bytes(data[i + 5:i + 7], "big")
                i += 2 + n
    except Exception:
        return None
    return None


def fetch_bytes(url: str) -> tuple[str | None, bytes | None]:
    for attempt in range(1, RETRIES + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/avif,image/webp,image/png,image/*,*/*;q=0.8"})
            with urllib.request.urlopen(req, timeout=35) as r:
                final = r.geturl()
                data = r.read()
            if valid_image(data):
                return original_from_mediawiki_thumb(final), data
            return None, None
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None, None
            if e.code in (429, 500, 502, 503, 504) and attempt < RETRIES:
                time.sleep(8 * attempt)
                continue
            return None, None
        except Exception:
            if attempt < RETRIES:
                time.sleep(4 * attempt)
                continue
            return None, None
    return None, None


def fetch_text(url: str) -> str:
    for attempt in range(1, RETRIES + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml"})
            with urllib.request.urlopen(req, timeout=35) as r:
                return r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return ""
            if e.code in (429, 500, 502, 503, 504) and attempt < RETRIES:
                time.sleep(8 * attempt)
                continue
            return ""
        except Exception:
            if attempt < RETRIES:
                time.sleep(4 * attempt)
                continue
            return ""
    return ""


def norm_words(s: str) -> list[str]:
    s = urllib.parse.unquote(s).lower().replace("_", " ")
    return [x for x in re.findall(r"[a-z0-9]+", s) if len(x) > 1]


def page_image_candidates(page_html: str, name: str, kind: str) -> list[str]:
    # Collect src/href/srcset URLs from bg3.wiki page HTML.
    raw = re.findall(r'''(?:src|href)=["']([^"']+)["']''', page_html, flags=re.I)
    for srcset in re.findall(r'''srcset=["']([^"']+)["']''', page_html, flags=re.I):
        raw.extend(part.strip().split(" ", 1)[0] for part in srcset.split(","))
    target = set(norm_words(name))
    blocked = {
        "action", "bonus", "reaction", "range", "saving", "throw", "duration", "recharge",
        "rarity", "weight", "gold", "dice", "concentration", "ritual", "ico", "stats", "logo",
        "damage", "condition", "spellslot", "spell", "school"
    }
    scored: list[tuple[int, str]] = []
    seen = set()
    for u in raw:
        u = absolute_bg3_url(u)
        path = urllib.parse.urlsplit(u).path
        lower = urllib.parse.unquote(path).lower()
        if not any(lower.endswith(e) for e in IMAGE_EXTS):
            continue
        if "/w/images/" not in path:
            continue
        if u in seen:
            continue
        seen.add(u)
        base = urllib.parse.unquote(path.rsplit("/", 1)[-1])
        words = set(norm_words(base))
        score = 0
        overlap = len(target & words)
        score += overlap * 22
        if target and overlap >= max(1, min(2, len(target))):
            score += 35
        if kind == "spell":
            if "icon" not in words:
                score += 70
            if "faded" in words or "tooltip" in words:
                score += 20
            if "icon" in words:
                score -= 20
        else:
            if "faded" in words:
                score += 100
            if "tooltip" in words:
                score += 70
            if "unfaded" in words:
                score -= 25
        score -= 55 * len(words & blocked)
        if score > 0:
            scored.append((score, u))
    scored.sort(key=lambda t: t[0], reverse=True)
    return [u for _, u in scored[:12]]


def spell_rows(text: str):
    pat = re.compile(r'\{key:["\']([^"\']+)["\'],name:["\']([^"\']+)["\'],en:["\']((?:\\.|[^"\'])+)["\']')
    for key, zh, en in pat.findall(text):
        yield key, zh, en.replace("\\'", "'").replace('\\"', '"')


def equipment_rows(text: str):
    pat = re.compile(r"g\('([^']+)'\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'")
    for key, zh, en in pat.findall(text):
        yield key, zh, en.replace("\\'", "'")


def spell_guesses(en: str) -> list[str]:
    base = en.strip().replace("/", " ")
    names = [
        base + ".webp",
        base + ".png",
        base + " spell.webp",
        base + " Spell.webp",
        base + "_Icon.webp",
    ]
    return [wiki_file(x.replace(" ", "_")) for x in names]


def equipment_guesses(en: str) -> list[str]:
    base = en.strip()
    names = [
        base + " Faded.png",
        base + " Faded.webp",
        base + "_Faded.png",
        base + "_Faded.webp",
        base + " Icon.png",
        base + " Icon.webp",
        base + "_Unfaded_Icon.png",
        base + "_Unfaded_Icon.webp",
    ]
    return [wiki_file(x.replace(" ", "_")) for x in names]


def load_overrides() -> dict:
    if not OVERRIDES.exists():
        return {"spell": {}, "equipment": {}}
    return json.loads(OVERRIDES.read_text(encoding="utf-8"))


def local_variants(folder: Path, key: str) -> list[Path]:
    return [folder / (key + e) for e in IMAGE_EXTS]


def existing_best(folder: Path, key: str) -> tuple[Path | None, tuple[int, int] | None]:
    best_p = None
    best_s = None
    for p in local_variants(folder, key):
        if not p.exists() or not p.stat().st_size:
            continue
        data = p.read_bytes()
        size = image_size(data)
        if best_p is None or (size and (not best_s or size[0] * size[1] > best_s[0] * best_s[1])):
            best_p, best_s = p, size
    return best_p, best_s


def unique(seq):
    out, seen = [], set()
    for x in seq:
        x = original_from_mediawiki_thumb(x)
        if x and x not in seen:
            seen.add(x)
            out.append(x)
    return out


def choose_best(candidates: list[str], delay: float, min_edge: int) -> tuple[str | None, bytes | None, tuple[int, int] | None, list[dict]]:
    probes = []
    best = (None, None, None)
    best_area = -1
    for url in unique(candidates):
        final, data = fetch_bytes(url)
        if not data:
            probes.append({"url": url, "status": "failed"})
            time.sleep(delay)
            continue
        size = image_size(data)
        probes.append({"url": url, "final": final, "status": "ok", "size": list(size) if size else None, "bytes": len(data)})
        area = size[0] * size[1] if size else len(data)
        # Prefer an actual 380-ish tooltip. Once found, avoid hammering every fallback.
        if area > best_area:
            best = (final or url, data, size)
            best_area = area
        if size and min(size) >= max(380, min_edge):
            break
        time.sleep(delay)
    return (*best, probes)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kind", choices=("all", "spell", "equipment"), default="all")
    ap.add_argument("--delay", type=float, default=DEFAULT_DELAY)
    ap.add_argument("--min-edge", type=int, default=300, help="report target; native 380 tooltip is preferred")
    ap.add_argument("--replace-lower-res", action="store_true", help="re-check even an existing >=380px HD file and replace it only if a larger native source is found")
    ap.add_argument("--dry-run", action="store_true", help="resolve/report sources without writing image bytes")
    args = ap.parse_args()

    if not SPELLS.exists() or not EQUIP.exists():
        print("Run this script from the full BG3 Planner repository root.")
        return 2

    OUT_S.mkdir(parents=True, exist_ok=True)
    OUT_E.mkdir(parents=True, exist_ok=True)
    overrides = load_overrides()
    tasks = []
    if args.kind in ("all", "spell"):
        for key, zh, en in spell_rows(SPELLS.read_text(encoding="utf-8")):
            tasks.append(("spell", key, zh, en, OUT_S))
    if args.kind in ("all", "equipment"):
        for key, zh, en in equipment_rows(EQUIP.read_text(encoding="utf-8")):
            tasks.append(("equipment", key, zh, en, OUT_E))

    report = []
    print(f"{len(tasks)} HD asset entries to inspect")
    for idx, (kind, key, zh, en, out) in enumerate(tasks, 1):
        local, local_size = existing_best(out, key)
        # A prior run may have stored a 144/300px fallback in assets/hd. Treat only
        # native >=380px files as complete by default; smaller/unknown files are
        # automatically re-resolved so a true tooltip original can replace them.
        if local and local_size and min(local_size) >= 380 and not args.replace_lower_res:
            report.append({"type": kind, "key": key, "zh": zh, "name": en, "status": "existing-hd", "path": str(local.relative_to(ROOT)), "size": list(local_size)})
            continue

        print(f"[{idx}/{len(tasks)}] {kind}: {en}", flush=True)
        explicit = overrides.get(kind, {}).get(key, [])
        guesses = spell_guesses(en) if kind == "spell" else equipment_guesses(en)
        page = wiki_page(en)
        page_html = fetch_text(page)
        discovered = page_image_candidates(page_html, en, kind) if page_html else []
        # Page-discovered tooltip/Faded images are usually the most accurate source;
        # explicit user-verified overrides come first when present.
        candidates = unique(explicit + discovered + guesses)
        src, data, size, probes = choose_best(candidates, args.delay, args.min_edge)
        if not data:
            report.append({"type": kind, "key": key, "zh": zh, "name": en, "status": "unresolved", "page": page, "candidates": candidates, "probes": probes})
            continue

        old_area = local_size[0] * local_size[1] if local_size else -1
        new_area = size[0] * size[1] if size else len(data)
        if local and old_area >= new_area:
            report.append({"type": kind, "key": key, "zh": zh, "name": en, "status": "kept-existing", "path": str(local.relative_to(ROOT)), "size": list(local_size) if local_size else None, "candidate_size": list(size) if size else None, "source": src})
            continue

        dest = out / (key + extension(data))
        if not args.dry_run:
            for p in local_variants(out, key):
                if p != dest and p.exists():
                    p.unlink()
            dest.write_bytes(data)
        status = "dry-run" if args.dry_run else "downloaded-hd"
        report.append({"type": kind, "key": key, "zh": zh, "name": en, "status": status, "source": src, "path": str(dest.relative_to(ROOT)), "size": list(size) if size else None, "bytes": len(data), "page": page, "probes": probes})
        time.sleep(args.delay)

    summary = {
        "source": "https://bg3.wiki/",
        "policy": "prefer native 380x380 tooltip/Faded artwork; do not upscale smaller UI icons",
        "items": report,
    }
    REPORT.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    counts = {}
    for row in report:
        counts[row["status"]] = counts.get(row["status"], 0) + 1
    print("done:", counts)
    print("report:", REPORT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
