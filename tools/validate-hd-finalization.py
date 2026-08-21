#!/usr/bin/env python3
"""Validate finalized spell catalog and HD report without assuming spells.js is pure JSON."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPELLS = ROOT / "assets/js/data/spells.js"
REPORT = ROOT / "BG3_WIKI_HD_ASSET_REPORT.json"

INVALID = {"greenFlameBlade", "wordOfRadiance"}
SPELL_PREFIX = "export const spellData="


def parse_spell_data() -> list[dict]:
    text = SPELLS.read_text(encoding="utf-8")
    start = text.find(SPELL_PREFIX)
    if start < 0:
        raise RuntimeError("spellData export not found")
    start += len(SPELL_PREFIX)
    data, _ = json.JSONDecoder().raw_decode(text[start:])
    if not isinstance(data, list):
        raise RuntimeError("spellData is not an array")
    return data


spells = parse_spell_data()
keys = {x["key"] for x in spells}

report = json.loads(REPORT.read_text(encoding="utf-8"))
items = report.get("items", [])
report_spell_keys = {x.get("key") for x in items if x.get("type") == "spell"}
report_equipment_keys = {x.get("key") for x in items if x.get("type") == "equipment"}
unresolved = [x for x in items if x.get("status") == "unresolved"]

assert len(spells) == 189, f"expected 189 BG3 spells/cantrips, got {len(spells)}"
assert not (keys & INVALID), f"invalid spell keys still present: {keys & INVALID}"
assert keys == report_spell_keys, (
    f"spellData/report mismatch: only spellData={sorted(keys-report_spell_keys)}, "
    f"only report={sorted(report_spell_keys-keys)}"
)
assert len(report_equipment_keys) == 130, (
    f"expected 130 equipment keys, got {len(report_equipment_keys)}"
)
assert not unresolved, (
    f"report still has unresolved rows: {[x.get('key') for x in unresolved]}"
)
assert report.get("parsed_rows", {}).get("spell") == 189
assert report.get("parsed_rows", {}).get("equipment") == 130
assert not (ROOT/"assets/hd/spells/BG3_WIKI_HD_ASSET_REPORT.json").exists(), (
    "duplicate report still exists"
)

print("HD asset finalization validation: PASS")
print("spell keys: 189")
print("equipment keys: 130")
print("target keys: 319")
