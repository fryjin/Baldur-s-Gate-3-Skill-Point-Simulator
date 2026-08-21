#!/usr/bin/env python3
"""Finalize BG3 HD assets safely against the real spells.js module format.

This version only replaces the JSON array assigned to:
    export const spellData=[...]

Any JavaScript content after that array is preserved byte-for-byte as text.
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPELLS = ROOT / "assets/js/data/spells.js"
REPORT = ROOT / "BG3_WIKI_HD_ASSET_REPORT.json"
DUPLICATE_REPORT = ROOT / "assets/hd/spells/BG3_WIKI_HD_ASSET_REPORT.json"
HD = ROOT / "assets/hd"

INVALID_SPELL_KEYS = {"greenFlameBlade", "wordOfRadiance"}
IMAGE_EXTS = (".webp", ".png", ".jpg", ".jpeg")
SPELL_PREFIX = "export const spellData="


def parse_spell_module() -> tuple[str, list[dict], int, int]:
    text = SPELLS.read_text(encoding="utf-8")
    start = text.find(SPELL_PREFIX)
    if start < 0:
        raise RuntimeError("Unexpected spells.js format: spellData export not found")
    json_start = start + len(SPELL_PREFIX)
    decoder = json.JSONDecoder()
    try:
        data, consumed = decoder.raw_decode(text[json_start:])
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Cannot parse spellData array at char {json_start + exc.pos}: {exc.msg}"
        ) from exc
    if not isinstance(data, list):
        raise RuntimeError("spellData is not an array")
    json_end = json_start + consumed
    return text, data, json_start, json_end


def write_spell_array(original: str, rows: list[dict], json_start: int, json_end: int) -> None:
    payload = json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
    # Preserve every character before and after the spellData JSON array.
    SPELLS.write_text(
        original[:json_start] + payload + original[json_end:],
        encoding="utf-8",
    )


def local_asset(kind: str, key: str) -> Path | None:
    folder = HD / ("spells" if kind == "spell" else "equipment")
    for ext in IMAGE_EXTS:
        p = folder / f"{key}{ext}"
        if p.exists() and p.is_file():
            return p
    return None


def rel_posix(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def main() -> int:
    if not SPELLS.exists() or not REPORT.exists():
        print("ERROR: run from the full repository after syncing HD assets.")
        return 2

    original, spells, json_start, json_end = parse_spell_module()
    before = len(spells)
    removed = [row for row in spells if row.get("key") in INVALID_SPELL_KEYS]
    spells = [row for row in spells if row.get("key") not in INVALID_SPELL_KEYS]

    if removed:
        write_spell_array(original, spells, json_start, json_end)

    report = json.loads(REPORT.read_text(encoding="utf-8"))
    items = report.get("items", [])
    if not isinstance(items, list):
        raise RuntimeError("Report items is not a list")

    filtered = []
    reconciled = []

    for row in items:
        kind = row.get("type")
        key = row.get("key")

        if kind == "spell" and key in INVALID_SPELL_KEYS:
            continue

        if kind in {"spell", "equipment"} and key:
            existing = local_asset(kind, key)
            if existing and (row.get("status") == "unresolved" or not row.get("path")):
                row = dict(row)
                row["status"] = "existing-hd"
                row["path"] = rel_posix(existing)
                row["reconciled_from_local_file"] = True
                reconciled.append(f"{kind}:{key}")

        filtered.append(row)

    report["items"] = filtered
    report.setdefault("parsed_rows", {})
    report["parsed_rows"]["spell"] = len(spells)
    report["parsed_rows"]["equipment"] = sum(
        1 for r in filtered if r.get("type") == "equipment"
    )
    report["vendor_version"] = "2.1+finalize-2"

    status_counts = Counter(str(r.get("status") or "unknown") for r in filtered)
    preferred = ["existing-hd", "kept-existing", "downloaded-hd", "unresolved"]
    counts = {k: int(status_counts.get(k, 0)) for k in preferred}
    for k in sorted(status_counts):
        if k not in counts:
            counts[k] = int(status_counts[k])
    report["counts"] = counts

    report["finalization"] = {
        "version": "2",
        "invalid_spell_keys_removed": sorted(INVALID_SPELL_KEYS),
        "reconciled_from_local_files": sorted(reconciled),
        "target_asset_keys": len(filtered),
        "spell_module_suffix_preserved": True,
    }

    REPORT.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    duplicate_removed = False
    if DUPLICATE_REPORT.exists():
        DUPLICATE_REPORT.unlink()
        duplicate_removed = True

    print(json.dumps({
        "spell_rows_before": before,
        "spell_rows_after": len(spells),
        "removed_spell_keys": sorted(r.get("key") for r in removed),
        "report_items_after": len(filtered),
        "reconciled_from_local_files": sorted(reconciled),
        "report_unresolved_after": counts.get("unresolved", 0),
        "duplicate_spell_report_removed": duplicate_removed,
        "spell_module_suffix_preserved": True,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
