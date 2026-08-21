#!/usr/bin/env python3
from pathlib import Path
import subprocess, shutil, sys

ROOT=Path(__file__).resolve().parents[1]
SPELL=ROOT/"assets/js/data/spell-assets.js"
EQUIP=ROOT/"assets/v8/equipment-images.js"
V82=ROOT/"assets/v8/v82.js"
HTML=ROOT/"v8.html"
GEN=ROOT/"tools/generate-hd-asset-manifest.py"

EXPECTED={
    SPELL:"d59dac49c8cff319bf65dee861d7c9b97f65cd14",
    EQUIP:"083716e6465c1dd08993a3081949450af88c8d41",
    V82:"1097476b3cc44c7848da6809f306f7f6ccbd04cb",
    HTML:"e49baf1babd9b336af7c68b2cc0682b73bb5e38c",
}

SPELL_SOURCE='import{spellImageManifest}from"./spell-image-manifest.js";\nimport{spellData}from"./spells.js";\nimport{spellHdAssets}from"./hd-asset-manifest.js";\n\nconst failureKey="bg3-v8-wiki-image-failures-v3";\nlet failures=new Set();\ntry{failures=new Set(JSON.parse(sessionStorage.getItem(failureKey)||"[]"))}catch{}\nlet observer=null;\nconst spellByKey=new Map(spellData.map(x=>[x.key,x]));\n\nfunction saveFailures(){try{sessionStorage.setItem(failureKey,JSON.stringify([...failures].slice(-1000)))}catch{}}\nfunction fallbackSvg(spell){const label=(spell?.name||"法术").slice(0,2),level=spell?.level?`${spell.level}环`:"戏法";const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4a392d"/><stop offset="1" stop-color="#17120f"/></linearGradient></defs><rect width="160" height="160" rx="24" fill="url(#g)"/><circle cx="80" cy="65" r="39" fill="none" stroke="#d5b96f" stroke-width="3" opacity=".46"/><text x="80" y="77" text-anchor="middle" fill="#efe3cc" font-size="28" font-family="serif">${label}</text><text x="80" y="131" text-anchor="middle" fill="#bbaa89" font-size="17" font-family="sans-serif">${level}</text></svg>`;return`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`}\nexport const expectedSpellImagePath=key=>spellImageManifest[key]||"";\nconst cleanName=name=>String(name||"").trim().replace(/\\//g," ").replace(/\\s+/g," ");\nconst wikiFile=file=>`https://bg3.wiki/wiki/Special:FilePath/${encodeURIComponent(file.replace(/\\s+/g,"_"))}`;\nconst iconFile=name=>cleanName(name).replace(/\\s+/g,"_")+"_Icon.webp";\nconst mirrorFile=name=>`https://raw.githubusercontent.com/kennedymindeman/bg3-item-spawner/main/icons/${encodeURIComponent(iconFile(name))}`;\nconst tooltipFiles=spell=>{const n=cleanName(spell.en||spell.name),files=[`${n}.webp`,`${n}.png`,`${n} spell.webp`,`${n} Spell.webp`];if(spell.key==="bane")files.unshift("Bane spell.webp");if(spell.key==="darkvision")files.unshift("Darkvision spell.webp");return files.map(wikiFile)};\nfunction legacyCandidates(spell){const local=expectedSpellImagePath(spell.key),vendorWebp=`./assets/spells/${spell.key}.webp`,tooltips=tooltipFiles(spell),controller=wikiFile(iconFile(spell.en||spell.name)),mirror=mirrorFile(spell.en||spell.name);return[...tooltips,local,vendorWebp,controller,mirror].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i&&!failures.has(x))}\n\nfunction tryList(img,list,placeholder){\n  let i=0;\n  const next=()=>{\n    if(i>=list.length){img.src=placeholder;img.classList.add("image-missing");return}\n    const src=list[i++];\n    const ok=()=>{cleanup();img.classList.add("is-loaded")};\n    const fail=()=>{failures.add(src);saveFailures();cleanup();next()};\n    const cleanup=()=>{img.removeEventListener("load",ok);img.removeEventListener("error",fail)};\n    img.addEventListener("load",ok,{once:true});\n    img.addEventListener("error",fail,{once:true});\n    img.src=src\n  };\n  next()\n}\nfunction bindPrimary(img){\n  if(img.dataset.primaryBound)return;\n  img.dataset.primaryBound="1";\n  img.addEventListener("load",()=>img.classList.add("is-loaded"),{once:true});\n  img.addEventListener("error",()=>{\n    const spell=spellByKey.get(img.dataset.spellKey);\n    const placeholder=img.dataset.placeholder||fallbackSvg(spell);\n    img.src=placeholder;\n    tryList(img,spell?legacyCandidates(spell):[],placeholder)\n  },{once:true})\n}\nfunction loadDeferred(img){\n  if(img.dataset.loading)return;\n  img.dataset.loading="1";\n  const spell=spellByKey.get(img.dataset.spellKey);\n  const placeholder=img.dataset.placeholder||fallbackSvg(spell);\n  tryList(img,spell?legacyCandidates(spell):[],placeholder);\n  delete img.dataset.loading\n}\n\nexport function spellImageTag(spell,className="spell-image",alt){\n  const placeholder=fallbackSvg(spell),eager=className.includes("detail"),primary=spellHdAssets[spell.key]||"";\n  const src=primary||placeholder;\n  return`<img class="${className}" src="${src}" alt="${alt||`${spell.name}图标`}" width="96" height="96" decoding="async" loading="${eager?"eager":"lazy"}" fetchpriority="${eager?"high":"low"}" referrerpolicy="no-referrer" data-spell-key="${spell.key}" data-placeholder="${placeholder}" ${primary?\'data-spell-primary="1"\':\'data-spell-pending="1"\'}>`\n}\nexport function bindImageFallbacks(root=document){\n  const primary=[...root.querySelectorAll("img[data-spell-primary]")];primary.forEach(bindPrimary);\n  const pending=[...root.querySelectorAll("img[data-spell-pending]")];\n  if(!pending.length)return;\n  if(!("IntersectionObserver"in window)){pending.forEach(loadDeferred);return}\n  observer??=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);loadDeferred(entry.target)}}),{rootMargin:"180px 0px"});\n  pending.forEach(img=>observer.observe(img))\n}\n'
EQUIP_SOURCE='import{equipmentHdAssets}from"../js/data/hd-asset-manifest.js";\nimport{equipmentById}from"./equipment-catalog.js";\n\nconst failureKey="bg3-v8-equipment-image-failures-v3";\nlet failures=new Set();try{failures=new Set(JSON.parse(sessionStorage.getItem(failureKey)||"[]"))}catch{}\nlet observer=null;\nconst save=()=>{try{sessionStorage.setItem(failureKey,JSON.stringify([...failures].slice(-1200)))}catch{}};\nconst placeholder="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";\nconst fileUrl=file=>`https://bg3.wiki/wiki/Special:FilePath/${encodeURIComponent(file)}`;\nconst baseName=item=>String(item?.en||item?.name||"").trim().replace(/\\s+/g,"_");\n\nexport function equipmentImageCandidates(item){\n  const base=baseName(item),localBase=`./assets/equipment/${item.id}`;\n  return[\n    fileUrl(`${base}_Faded.png`),fileUrl(`${base}_Faded.webp`),\n    item.image||"",`${localBase}.webp`,`${localBase}.png`,\n    fileUrl(`${base}_Icon.png`),fileUrl(`${base}_Icon.webp`),\n    fileUrl(`${base}_Unfaded_Icon.png`),fileUrl(`${base}_Unfaded_Icon.webp`),fileUrl(`${base}_Item_Icon.png`)\n  ].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i&&!failures.has(x))\n}\nfunction tryList(img,list){\n  let i=0;\n  const next=()=>{\n    if(i>=list.length){img.src=placeholder;img.classList.add("image-missing");return}\n    const src=list[i++];\n    const ok=()=>{cleanup();img.classList.add("is-loaded")};\n    const fail=()=>{failures.add(src);save();cleanup();next()};\n    const cleanup=()=>{img.removeEventListener("load",ok);img.removeEventListener("error",fail)};\n    img.addEventListener("load",ok,{once:true});\n    img.addEventListener("error",fail,{once:true});\n    img.src=src\n  };\n  next()\n}\nfunction bindPrimary(img){\n  if(img.dataset.primaryBound)return;\n  img.dataset.primaryBound="1";\n  img.addEventListener("load",()=>img.classList.add("is-loaded"),{once:true});\n  img.addEventListener("error",()=>{\n    const item=equipmentById(img.dataset.equipmentKey);\n    img.src=placeholder;\n    tryList(img,item?equipmentImageCandidates(item):[])\n  },{once:true})\n}\nfunction loadDeferred(img){\n  if(img.dataset.loading)return;\n  img.dataset.loading="1";\n  const item=equipmentById(img.dataset.equipmentKey);\n  tryList(img,item?equipmentImageCandidates(item):[]);\n  delete img.dataset.loading\n}\nexport function equipmentImageTag(item,className="v82-equipment-image",alt=""){\n  const primary=equipmentHdAssets[item.id]||"",eager=className.includes("detail"),src=primary||placeholder;\n  return`<img class="${className}" src="${src}" alt="${alt||item.name+"图标"}" width="96" height="96" decoding="async" loading="${eager?"eager":"lazy"}" fetchpriority="${eager?"high":"low"}" referrerpolicy="no-referrer" data-equipment-key="${item.id}" ${primary?\'data-equipment-primary="1"\':\'data-equipment-pending="1"\'}>`\n}\nexport function bindEquipmentImageFallbacks(root=document){\n  const primary=[...root.querySelectorAll("img[data-equipment-primary]")];primary.forEach(bindPrimary);\n  const pending=[...root.querySelectorAll("img[data-equipment-pending]")];\n  if(!pending.length)return;\n  if(!("IntersectionObserver"in window)){pending.forEach(loadDeferred);return}\n  observer??=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){observer.unobserve(e.target);loadDeferred(e.target)}}),{rootMargin:"180px 0px"});\n  pending.forEach(img=>observer.observe(img))\n}\n'

def blob(path):
    try:return subprocess.check_output(["git","hash-object",str(path)],cwd=ROOT,text=True).strip()
    except Exception:return ""

def main():
    for path,expected in EXPECTED.items():
        if not path.exists():
            print("ERROR missing",path);return 2
        current=blob(path)
        if current and current!=expected:
            # Idempotent success if V8.2.5 is already present.
            if path in (V82,HTML) and "V8.2.5" in path.read_text(encoding="utf-8"):continue
            if path==SPELL and "spellHdAssets" in path.read_text(encoding="utf-8"):continue
            if path==EQUIP and "equipmentHdAssets" in path.read_text(encoding="utf-8"):continue
            print("ERROR baseline mismatch:",path)
            print("current:",current)
            print("expected:",expected)
            return 3

    subprocess.check_call([sys.executable,str(GEN)],cwd=ROOT)

    old={p:p.read_text(encoding="utf-8") for p in (SPELL,EQUIP,V82,HTML)}
    try:
        SPELL.write_text(SPELL_SOURCE,encoding="utf-8")
        EQUIP.write_text(EQUIP_SOURCE,encoding="utf-8")
        v=old[V82].replace("V8.2.4","V8.2.5").replace("version:'8.2.4'","version:'8.2.5'")
        h=old[HTML].replace("V8.2.4","V8.2.5")
        V82.write_text(v,encoding="utf-8")
        HTML.write_text(h,encoding="utf-8")
        if shutil.which("node"):
            for p in (SPELL,EQUIP,V82,ROOT/"assets/js/data/hd-asset-manifest.js"):
                subprocess.check_call(["node","--check",str(p)],cwd=ROOT)
    except Exception:
        for p,text in old.items():p.write_text(text,encoding="utf-8")
        raise

    print("Applied V8.2.5 local HD asset fast path.")
    print("Generated: assets/js/data/hd-asset-manifest.js, IMAGE_FAST_PATH_REPORT.json")
    print("Changed: spell-assets.js, equipment-images.js, v82.js, v8.html")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
