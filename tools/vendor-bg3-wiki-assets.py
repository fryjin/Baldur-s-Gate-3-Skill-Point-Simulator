#!/usr/bin/env python3
"""Vendor missing BG3 spell/equipment icons from bg3.wiki into this project.

Run from repository root:
  python tools/vendor-bg3-wiki-assets.py

The application works without running this script (it has a bg3.wiki online fallback),
but vendoring prevents hot-link/rate-limit failures and is recommended before release.
"""
from __future__ import annotations
import ast, json, re, time, urllib.parse, urllib.request, urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SPELLS=ROOT/'assets/js/data/spells.js'
EQUIP=ROOT/'assets/v8/equipment-catalog.js'
OUT_S=ROOT/'assets/spells'; OUT_E=ROOT/'assets/equipment'
REPORT=ROOT/'BG3_WIKI_ASSET_REPORT.json'
UA='BG3-Planner-asset-vendor/1.0 (one-time local vendoring)'
DELAY=2.5; RETRIES=4

def url(file): return 'https://bg3.wiki/wiki/Special:FilePath/'+urllib.parse.quote(file,safe="'()")
def slug(name): return re.sub(r'\s+','_',name.strip())
def valid(data): return data[:4]==b'RIFF' and data[8:12]==b'WEBP' or data.startswith(b'\x89PNG\r\n\x1a\n') or data[:3]==b'\xff\xd8\xff'
def ext(data): return '.webp' if data[:4]==b'RIFF' else '.png' if data.startswith(b'\x89PNG') else '.jpg'
def fetch(candidates):
  for candidate in candidates:
    for n in range(RETRIES):
      try:
        req=urllib.request.Request(candidate,headers={'User-Agent':UA})
        with urllib.request.urlopen(req,timeout=30) as r: data=r.read()
        if valid(data): return candidate,data
      except urllib.error.HTTPError as e:
        if e.code==404: break
        if e.code in (429,500,502,503,504): time.sleep(8*(n+1)); continue
        break
      except Exception:
        time.sleep(4*(n+1))
    time.sleep(.4)
  return None,None

def spell_rows(text):
  # spells.js records are compact object literals: {key:"...",name:"...",en:"...",...}
  pat=re.compile(r'\{key:["\']([^"\']+)["\'],name:["\']([^"\']+)["\'],en:["\']((?:\\.|[^"\'])+)["\']')
  for key,zh,en in pat.findall(text):
    yield key,zh,en.replace("\\'","'").replace('\\"','"')
def equipment_rows(text):
  pat=re.compile(r"g\('([^']+)'\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'")
  for key,zh,en in pat.findall(text): yield key,zh,en.replace("\\'","'")
def spell_candidates(en): return [url(slug(en)+'_Icon.webp')]
def equip_candidates(en):
  b=slug(en)
  return [url(b+'_Unfaded_Icon.png'),url(b+'_Unfaded_Icon.webp'),url(b+'_Item_Icon.png'),url(b+'_Icon.webp')]
def main():
  OUT_S.mkdir(parents=True,exist_ok=True);OUT_E.mkdir(parents=True,exist_ok=True)
  rows=[]
  tasks=[]
  for key,zh,en in spell_rows(SPELLS.read_text(encoding='utf-8')): tasks.append(('spell',key,zh,en,OUT_S,spell_candidates(en)))
  for key,zh,en in equipment_rows(EQUIP.read_text(encoding='utf-8')): tasks.append(('equipment',key,zh,en,OUT_E,equip_candidates(en)))
  print(f'{len(tasks)} asset entries to check')
  for i,(kind,key,zh,en,out,cands) in enumerate(tasks,1):
    existing=next((p for p in (out/(key+e) for e in ('.webp','.png','.jpg')) if p.exists() and p.stat().st_size),None)
    if existing:
      rows.append({'type':kind,'key':key,'name':en,'status':'existing','path':str(existing.relative_to(ROOT))});continue
    print(f'[{i}/{len(tasks)}] {kind}: {en}',flush=True)
    src,data=fetch(cands)
    if data:
      dest=out/(key+ext(data));dest.write_bytes(data)
      rows.append({'type':kind,'key':key,'name':en,'status':'downloaded','source':src,'path':str(dest.relative_to(ROOT))})
    else:
      rows.append({'type':kind,'key':key,'name':en,'status':'missing','candidates':cands})
    time.sleep(DELAY)
  REPORT.write_text(json.dumps({'source':'https://bg3.wiki/','items':rows},ensure_ascii=False,indent=2),encoding='utf-8')
  ok=sum(x['status']!='missing' for x in rows);miss=len(rows)-ok
  print(f'done: {ok} available, {miss} unresolved; report={REPORT}')
if __name__=='__main__': main()
