#!/usr/bin/env python3
"""Audit locally vendored BG3 HD assets.

Checks:
- actual local HD file count by kind
- unresolved rows in BG3_WIKI_HD_ASSET_REPORT.json
- report paths that are missing on disk
- byte-identical images shared by different asset keys

Duplicate bytes are a REVIEW signal, not automatically an error: BG3 can legitimately
reuse artwork for multiple items.
"""
from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "BG3_WIKI_HD_ASSET_REPORT.json"
OUT = ROOT / "BG3_WIKI_HD_ASSET_AUDIT.json"
HD = ROOT / "assets/hd"
IMAGE_EXTS = {".png", ".webp", ".jpg", ".jpeg"}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    report_items = []
    if REPORT.exists():
        try:
            payload = json.loads(REPORT.read_text(encoding="utf-8"))
            report_items = payload.get("items", []) if isinstance(payload, dict) else []
        except Exception as e:
            print("WARNING: cannot parse report:", e)

    path_to_rows: dict[str, list[dict]] = defaultdict(list)
    unresolved = []
    missing_report_paths = []

    for row in report_items:
        if row.get("status") == "unresolved":
            unresolved.append({k: row.get(k) for k in ("type", "key", "zh", "name", "page")})
        rel = row.get("path")
        if rel:
            path_to_rows[rel].append(row)
            if not (ROOT / rel).exists() and row.get("status") != "dry-run":
                missing_report_paths.append(rel)

    files = sorted(
        p for p in HD.rglob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS
    ) if HD.exists() else []

    by_sha: dict[str, list[Path]] = defaultdict(list)
    by_kind = defaultdict(int)
    for p in files:
        rel = str(p.relative_to(ROOT))
        kind = "spell" if "/spells/" in "/" + rel else "equipment" if "/equipment/" in "/" + rel else "other"
        by_kind[kind] += 1
        by_sha[sha256_file(p)].append(p)

    duplicate_groups = []
    for digest, paths in sorted(by_sha.items()):
        if len(paths) < 2:
            continue
        rows = []
        keys = set()
        for p in paths:
            rel = str(p.relative_to(ROOT))
            matched = path_to_rows.get(rel, [])
            if matched:
                for row in matched:
                    keys.add((row.get("type"), row.get("key")))
                    rows.append({
                        "path": rel,
                        "type": row.get("type"),
                        "key": row.get("key"),
                        "zh": row.get("zh"),
                        "name": row.get("name"),
                    })
            else:
                rows.append({"path": rel})
        duplicate_groups.append({
            "sha256": digest,
            "file_count": len(paths),
            "different_asset_keys": len(keys),
            "review": len(keys) > 1,
            "files": rows,
        })

    result = {
        "audit_version": "1.0",
        "root": str(ROOT),
        "summary": {
            "local_hd_files": len(files),
            "local_hd_by_kind": dict(by_kind),
            "report_items": len(report_items),
            "unresolved": len(unresolved),
            "missing_report_paths": len(set(missing_report_paths)),
            "duplicate_sha_groups": len(duplicate_groups),
            "duplicate_groups_requiring_review": sum(1 for g in duplicate_groups if g["review"]),
        },
        "unresolved": unresolved,
        "missing_report_paths": sorted(set(missing_report_paths)),
        "duplicate_sha_groups": duplicate_groups,
    }
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps(result["summary"], ensure_ascii=False, indent=2))
    if unresolved:
        print("unresolved keys:", ", ".join(x.get("key") or "?" for x in unresolved))
    print("audit:", OUT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
