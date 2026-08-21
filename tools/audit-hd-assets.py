#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json
from collections import defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
REPORT=ROOT/"BG3_WIKI_HD_ASSET_REPORT.json"
OUT=ROOT/"BG3_WIKI_HD_ASSET_AUDIT.json"
HD=ROOT/"assets/hd"
IMAGE_EXTS={".png",".webp",".jpg",".jpeg"}

def sha256_file(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            h.update(chunk)
    return h.hexdigest()

def kind_for(path):
    rel=path.relative_to(ROOT).as_posix()
    if rel.startswith("assets/hd/spells/"):
        return "spell"
    if rel.startswith("assets/hd/equipment/"):
        return "equipment"
    return "other"

def main():
    report_items=[]
    if REPORT.exists():
        payload=json.loads(REPORT.read_text(encoding="utf-8"))
        report_items=payload.get("items",[]) if isinstance(payload,dict) else []

    files=sorted(p for p in HD.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_EXTS) if HD.exists() else []
    raw_by_kind=defaultdict(int)
    files_by_key=defaultdict(list)
    by_sha=defaultdict(list)

    for p in files:
        kind=kind_for(p)
        raw_by_kind[kind]+=1
        files_by_key[(kind,p.stem)].append(p)
        by_sha[sha256_file(p)].append(p)

    targets=defaultdict(set)
    for row in report_items:
        kind,key=row.get("type"),row.get("key")
        if kind in {"spell","equipment"} and key:
            targets[kind].add(key)

    coverage={}
    missing=[]
    for kind in ("spell","equipment"):
        target_keys=sorted(targets.get(kind,set()))
        present=[k for k in target_keys if files_by_key.get((kind,k))]
        absent=[k for k in target_keys if not files_by_key.get((kind,k))]
        coverage[kind]={
            "target_keys":len(target_keys),
            "present_keys":len(present),
            "missing_keys":len(absent),
            "coverage_pct":round(len(present)/len(target_keys)*100,2) if target_keys else 0.0,
        }
        missing.extend({"type":kind,"key":k} for k in absent)

    multi_variant=[]
    for (kind,key),paths in sorted(files_by_key.items()):
        if kind in {"spell","equipment"} and len(paths)>1:
            multi_variant.append({
                "type":kind,"key":key,"file_count":len(paths),
                "paths":[p.relative_to(ROOT).as_posix() for p in paths],
            })

    duplicate_sha=[]
    for digest,paths in sorted(by_sha.items()):
        asset_keys={(kind_for(p),p.stem) for p in paths if kind_for(p) in {"spell","equipment"}}
        if len(asset_keys)>1:
            duplicate_sha.append({
                "sha256":digest,"different_asset_keys":len(asset_keys),"review":True,
                "files":[{"path":p.relative_to(ROOT).as_posix(),"type":kind_for(p),"key":p.stem} for p in paths],
            })

    stale_unresolved=[
        {k:row.get(k) for k in ("type","key","zh","name","path")}
        for row in report_items if row.get("status")=="unresolved"
    ]

    result={
        "audit_version":"2.0",
        "root":str(ROOT),
        "summary":{
            "raw_image_files":len(files),
            "raw_image_files_by_kind":dict(raw_by_kind),
            "unique_local_asset_keys":sum(1 for (kind,_) in files_by_key if kind in {"spell","equipment"}),
            "target_asset_keys":sum(len(v) for v in targets.values()),
            "missing_target_keys":len(missing),
            "stale_report_unresolved_rows":len(stale_unresolved),
            "keys_with_multiple_file_variants":len(multi_variant),
            "duplicate_sha_groups_requiring_review":len(duplicate_sha),
        },
        "coverage":coverage,
        "missing_target_keys":missing,
        "stale_report_unresolved_rows":stale_unresolved,
        "keys_with_multiple_file_variants":multi_variant,
        "duplicate_sha_groups_requiring_review":duplicate_sha,
    }
    OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result["summary"],ensure_ascii=False,indent=2))
    print("coverage:",json.dumps(coverage,ensure_ascii=False))
    if missing:
        print("missing keys:",", ".join(f'{x["type"]}:{x["key"]}' for x in missing))
    if stale_unresolved:
        print("WARNING: report still contains unresolved rows")
    print("audit:",OUT)
    return 1 if missing or stale_unresolved else 0

if __name__=="__main__":
    raise SystemExit(main())
