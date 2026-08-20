#!/usr/bin/env python3
from pathlib import Path
import subprocess, shutil

ROOT=Path(__file__).resolve().parents[1]
V82=ROOT/"assets/v8/v82.js"
HTML=ROOT/"v8.html"
EXPECTED_V82_BLOB="ca1267212bbb3d6bad0b4354afaa065316fe11f5"
FINAL_STAGE='function finalStage(){const s=characterSummary(build),scores=finalScores(build),issues=validationIssues(build),loadout=finalGear(),ev=evaluateEquipment(build,loadout),r=ev.result,resources=buildResourceModel(build),features=activeFeatureGroups(build).flatMap(g=>g.selected.map(k=>[g.title,g.options.find(o=>o[0]===k)?.[1]||k])),prof=[...proficientSkills(build)],expert=expertiseSkills(build),spells=spellSources(build).flatMap(src=>{const c=spellChoice(build,src.key);return[...c.cantrips,...c.spells,...c.prepared].map(k=>spellData.find(x=>x.key===k)).filter(Boolean)}),uniqueSpells=[...new Map(spells.map(x=>[x.key,x])).values()],mainAtk=r.weaponProfiles.main?fmt(r.weaponProfiles.main.attack):\'—\',rangedAtk=r.weaponProfiles.rangedMain?fmt(r.weaponProfiles.rangedMain.attack):\'—\';return`<main class="v8-main v8-final-stage"><section class="v8-page-head"><span>PHASE III · FINAL BUILD · V8.2.3</span><h1>最终构筑</h1><p>人物属性、职业选择、章节装备与可精确计算效果统一进入同一个最终结果；条件触发效果保持独立。</p></section><div class="v81-status-strip ${issues.length||r.warnings.length||r.errors.length?\'warn\':\'\'}"><b>${issues.length?`人物还有 ${issues.length} 项待处理`:r.errors.length?`装备有 ${r.errors.length} 个结构错误`:\'人物构筑完整\'}</b><span>装备 ${Object.keys(loadout).length}/${equipmentSlots.length} · ${r.castingBlocked?\'未熟练防具会阻止施法\':r.errors.length?\'需要修正装备结构\':\'最终规则链已计算\'}</span></div><section class="v8-final-hero"><div class="v8-final-identity"><span class="v8-level">${build.targetLevel}</span><div><h2>${esc(build.name)}</h2><p>${esc(build.identity?.race||\'—\')} · ${esc(s.route)}</p><small>${backgrounds[build.identity?.background]?.name||\'—\'}</small></div></div><div class="v8-stat-row large">${stat(\'生命\',r.hp)}${stat(\'护甲\',r.ac)}${stat(\'先攻\',fmt(r.initiative))}${stat(\'近战命中\',mainAtk)}${stat(\'远程命中\',rangedAtk)}${stat(\'法术DC\',r.spellDC||\'—\')}</div></section><div class="v8-final-grid v823-final-grid"><section class="v8-summary-card wide"><div class="v8-section-label"><span>最终装备</span><b>${Object.keys(loadout).length}/${equipmentSlots.length}</b></div><div class="v8-final-loadout">${equipmentSlots.map(slot=>{const it=equipmentById(loadout[slot]);return`<div class="${it?\'filled\':\'\'}"><span>${it?equipmentImageTag(it,\'v82-final-equipment-image\'):slotMeta[slot].glyph}</span><div><small>${slotMeta[slot].name}</small><b>${it?esc(it.name):\'未装备\'}</b>${it?`<em>ACT ${it.act}</em>`:\'\'}</div></div>`}).join(\'\')}</div></section><div class="v823-final-columns"><div class="v823-final-column"><section class="v8-summary-card"><span>最终属性</span><div class="v82-final-scores">${abilities.map(a=>`<div><small>${a.name}</small><b>${r.scores[a.key]}</b><em>${r.scores[a.key]!==scores[a.key]?`${scores[a.key]} → ${r.scores[a.key]} · 调整值 ${fmt(r.mods[a.key])}`:`调整值 ${fmt(r.mods[a.key])}`}</em></div>`).join(\'\')}</div></section>${finalWeaponCard(r)}${miniList(\'职业资源\',resources.map(x=>[x.label,x.entries?.map(e=>`${e.label}${e.value}`).join(\' · \')||`${x.value} · ${x.recharge||\'\'}`]))}${miniList(\'技能熟练\',prof.map(k=>[`${skillName(k)} ${fmt(r.skillBonuses[k]??0)}`,expert.has(k)?\'专精\':\'熟练\']))}</div><div class="v823-final-column">${finalSaveCard(r)}${finalCastingCard(r)}${miniList(\'职业能力\',features)}<section class="v8-summary-card"><span>核心法术</span><div class="v82-final-spells">${uniqueSpells.slice(0,18).map(sp=>`<div>${spellImageTag(sp,\'v82-final-spell-img\')}<b>${esc(sp.name)}</b><small>${sp.level===0?\'戏法\':sp.level+\'环\'}</small></div>`).join(\'\')||\'<p>无</p>\'}</div></section></div></div>${finalChapterRoute()}${r.exactEffects.length?`<section class="v8-summary-card wide"><span>已计入最终面板的精确效果</span><div class="v83-effect-grid">${r.exactEffects.map(x=>`<div><b>${esc(x.item)}</b><small>${esc(x.text)}</small></div>`).join(\'\')}</div></section>`:\'\'}${r.conditionals.length?`<section class="v8-summary-card wide"><span>条件型效果 · 未默认折算</span><div class="v82-final-list">${r.conditionals.map(x=>`<div><b>${esc(x.item)}</b><small>${esc(x.text)}</small></div>`).join(\'\')}</div></section>`:\'\'}${r.errors.length?`<section class="v8-summary-card wide v83-error-card"><span>装备结构错误</span>${r.errors.map(x=>`<p>${esc(x)}</p>`).join(\'\')}</section>`:\'\'}${r.warnings.length?`<section class="v8-summary-card wide v82-warning-card"><span>装备规则警告</span>${r.warnings.map(x=>`<p>${esc(x)}</p>`).join(\'\')}</section>`:\'\'}</div><div class="v8-final-actions"><button data-stage="character">修改人物</button><button data-stage="equipment">调整装备</button><button class="primary" data-action="export">导出 V8.2.3 构筑</button></div></main>`}\n'

def git_blob(path):
    try:
        return subprocess.check_output(["git","hash-object",str(path)],cwd=ROOT,text=True).strip()
    except Exception:
        return ""

def main():
    if not V82.exists() or not HTML.exists():
        print("Run from repository root.")
        return 2
    text=V82.read_text(encoding="utf-8")
    html=HTML.read_text(encoding="utf-8")
    if "v823-final-columns" in text and "v823.css" in html:
        print("V8.2.3 UI acceptance patch already applied.")
        return 0
    blob=git_blob(V82)
    if blob and blob!=EXPECTED_V82_BLOB:
        print("ERROR: v82.js is not the checked V8.2.2 baseline.")
        print("current:",blob)
        print("expected:",EXPECTED_V82_BLOB)
        print("No file changed.")
        return 3
    a=text.find("function finalStage(){")
    b=text.find("function stat(label,value)",a)
    if a<0 or b<0:
        raise RuntimeError("finalStage markers not found")
    text=text[:a]+FINAL_STAGE+"\n"+text[b:]
    text=text.replace("构筑规划器 V8.2.2</small>","构筑规划器 V8.2.3</small>")
    text=text.replace("V8.2.2 RULE ENGINE","V8.2.3 RULE ENGINE")
    text=text.replace("version:'8.2.2'","version:'8.2.3'")
    text=text.replace("_V8.2.2.json","_V8.2.3.json")
    text=text.replace("V8.2.2 构筑","V8.2.3 构筑")
    text=text.replace('<span class="v81-source-badge">V8.2</span>','<span class="v81-source-badge">V8.2.3</span>')
    if './assets/v8/v823.css' not in html:
        anchor='  <link rel="stylesheet" href="./assets/v8/v82-linkage.css">'
        if anchor not in html:
            raise RuntimeError("v82-linkage.css marker not found")
        html=html.replace(anchor,anchor+'\n  <link rel="stylesheet" href="./assets/v8/v823.css">',1)
    html=html.replace("构筑规划器 V8.2.2：","构筑规划器 V8.2.3：")
    html=html.replace("构筑规划器 V8.2.2</title>","构筑规划器 V8.2.3</title>")
    old_js=V82.read_text(encoding="utf-8")
    old_html=HTML.read_text(encoding="utf-8")
    try:
        V82.write_text(text,encoding="utf-8")
        HTML.write_text(html,encoding="utf-8")
        if shutil.which("node"):
            subprocess.check_call(["node","--check",str(V82)],cwd=ROOT)
    except Exception:
        V82.write_text(old_js,encoding="utf-8")
        HTML.write_text(old_html,encoding="utf-8")
        raise
    print("Applied V8.2.3 UI acceptance patch.")
    print("Changed: assets/v8/v82.js, v8.html")
    print("Added/updated: assets/v8/v823.css")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
