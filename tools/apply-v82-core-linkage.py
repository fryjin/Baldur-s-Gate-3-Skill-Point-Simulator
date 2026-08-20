#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import subprocess
import shutil

ROOT=Path(__file__).resolve().parents[1]
V82=ROOT/"assets/v8/v82.js"
HTML=ROOT/"v8.html"
EXPECTED_GIT_BLOB="e340701c664f137bc61cec17fbeb8b714ab6de51"

def git_blob(path:Path)->str:
    try:
        return subprocess.check_output(["git","hash-object",str(path)],cwd=ROOT,text=True).strip()
    except Exception:
        return ""

def replace_between(text,start,end,replacement):
    a=text.find(start)
    if a<0:raise RuntimeError(f"missing marker: {start}")
    b=text.find(end,a)
    if b<0:raise RuntimeError(f"missing end marker: {end}")
    return text[:a]+replacement+text[b:]

def main():
    if not V82.exists() or not HTML.exists():
        print("Run this script from the full repository root.")
        return 2

    text=V82.read_text(encoding="utf-8")
    if "evaluateCandidate" in text and "v83-final-combat" in text:
        print("V8.2.2 core linkage patch already applied.")
        return 0

    blob=git_blob(V82)
    if blob and blob!=EXPECTED_GIT_BLOB:
        print("ERROR: assets/v8/v82.js differs from the checked baseline.")
        print("current git blob:",blob)
        print("expected:",EXPECTED_GIT_BLOB)
        print("No file was changed. Rebase the patch on the current main first.")
        return 3

    old_import="import{equipTransaction,evaluateEquipment,equipmentCompatibility,hasArmourProficiency,hasWeaponProficiency}from'./equipment-rules.js';"
    new_import="import{equipTransaction,evaluateEquipment,equipmentCompatibility,hasArmourProficiency,hasWeaponProficiency,evaluateCandidate}from'./equipment-rules.js';"
    if old_import not in text:
        raise RuntimeError("equipment-rules import marker not found")
    text=text.replace(old_import,new_import,1)

    gear = r'''function candidateText(item,loadout,equipped){
  if(equipped)return'当前已装备 · 点击可移除';
  const preview=evaluateCandidate(build,loadout,eq.slot,item.id);
  if(!preview.ok)return preview.errors[0]||'当前槽位无法装备';
  return preview.summary.join(' · ')||ruleText(item)||item.conditional?.[0]||'条件型装备效果';
}
function gearCard(item,loadout){const slot=eq.slot,equipped=loadout[slot]===item.id,compat=equipmentCompatibility(build,item),profArm=hasArmourProficiency(build,item),profW=hasWeaponProficiency(build,item),warnings=[!profArm&&(item.armor||item.kind==='shield'||['light','medium','heavy','shield'].includes(item.proficiency))?'未熟练护甲':'',!profW&&item.weapon?'未熟练武器':''].filter(Boolean),preview=evaluateCandidate(build,loadout,slot,item.id),delta=candidateText(item,loadout,equipped);return`<article class="v8-gear-card ${equipped?'equipped':''}"><button class="v8-gear-main" data-detail="${item.id}"><span class="v8-item-icon ${item.rarity==='传奇'?'rarity-legend':''}">${equipmentImageTag(item,'v82-gear-image')}</span><div><div class="v8-gear-title"><b>${esc(item.name)}</b><i>ACT ${item.act} · ${esc(item.rarity)}</i></div><small>${esc(item.en)} · ${esc(item.source)}</small><p>${esc(item.summary)}</p><div class="v8-tag-list mini">${item.tags.slice(0,4).map(t=>`<span>${esc(t)}</span>`).join('')}</div>${warnings.length?`<div class="v82-gear-warning">${warnings.join(' · ')}</div>`:''}</div></button><div class="v8-gear-side"><span class="v8-score">适配 ${compat.score}</span><div class="v8-delta ${!preview.ok?'v83-preview-error':''}">${esc(delta)}</div><button class="${equipped?'secondary':'primary'}" data-equip="${item.id}">${equipped?'本章移除':'装备'}</button></div></article>`}
'''
    text=replace_between(text,"function gearCard","function equipmentStage",gear)

    compare = r'''function metric(label,value,base,lower=false){const a=Number(String(value).replace('+','')),b=Number(String(base).replace('+','')),delta=Number.isFinite(a)&&Number.isFinite(b)?a-b:0,good=lower?delta<0:delta>0;return`<div><span>${label}</span><b>${esc(value)}</b><small class="${good?'up':delta?'down':''}">${delta?`${delta>0?'+':''}${delta} vs 人物`:'人物基础'}</small></div>`}
function weaponLine(profile,label){if(!profile)return`<div class="v83-combat-line"><div><b>${label}</b><small>未装备武器</small></div><strong>—</strong></div>`;return`<div class="v83-combat-line ${profile.proficient?'':'bad'}"><div><b>${label} · ${esc(profile.name)}</b><small>${profile.abilityCode} · ${profile.proficient?'熟练':'未熟练'} · 重击 ${profile.critThreshold}+</small></div><strong>命中 ${fmt(profile.attack)} · ${esc(profile.damageText)}</strong></div>`}
function comparePane(ev,loadout){const {base,result}=ev;return`<aside class="v8-compare-pane"><div class="v8-compare-sticky"><div class="v8-section-label"><span>装备后结果</span><b>实时规则</b></div><div class="v8-current-slot"><span>${slotMeta[eq.slot].name}</span><b>${slotItem(loadout,eq.slot)?.name||'未装备'}</b><small>${result.castingBlocked?'当前存在未熟练防具，施法会被阻止。':'属性变化已继续传导到生命、技能、豁免、施法与武器面板。'}</small></div><div class="v8-stat-compare">${metric('生命',result.hp,base.hp)}${metric('护甲',result.ac,base.ac)}${metric('先攻',fmt(result.initiative),fmt(base.initiative))}${metric('装备豁免',fmt(result.saveBonus),0)}${metric('法术 DC',result.spellDC||'—',base.casting?.dc||0)}${metric('法术攻击',result.spellAttack?fmt(result.spellAttack):'—',base.casting?.attack?fmt(base.casting.attack):0)}</div><div class="v83-combat-lines">${weaponLine(result.weaponProfiles.main,'近战主手')}${weaponLine(result.weaponProfiles.rangedMain,'远程主手')}</div>${result.errors.length?`<div class="v82-rule-warnings"><b>结构错误</b>${result.errors.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}${result.warnings.length?`<div class="v82-rule-warnings"><b>规则警告</b>${result.warnings.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}${result.exactEffects.length?`<details class="v82-conditional"><summary>已计入面板的精确效果 ${result.exactEffects.length}</summary>${result.exactEffects.slice(0,10).map(x=>`<p><b>${esc(x.item)}</b>${esc(x.text)}</p>`).join('')}</details>`:''}${result.conditionals.length?`<details class="v82-conditional"><summary>条件型效果 ${result.conditionals.length}</summary>${result.conditionals.slice(0,10).map(x=>`<p><b>${esc(x.item)}</b>${esc(x.text)}</p>`).join('')}</details>`:''}<div class="v8-route-progress"><span>章节路线</span>${[1,2,3].map(a=>`<div><b>${actLabel(a)}</b><small>${Object.keys(eq.chapters[a]||{}).length} 个变化</small></div>`).join('')}</div><button class="primary wide" data-stage="final">查看最终构筑</button></div></aside>`}
'''
    text=replace_between(text,"function metric","function detailSheet",compare)

    final = r'''function miniList(title,items){return`<section class="v8-summary-card"><span>${title}</span>${items.length?`<div class="v82-final-list">${items.map(x=>`<div><b>${esc(x[0])}</b><small>${esc(x[1])}</small></div>`).join('')}</div>`:'<p>暂无</p>'}</section>`}
function finalWeaponCard(r){const rows=[['近战主手',r.weaponProfiles.main],['近战副手',r.weaponProfiles.off],['远程主手',r.weaponProfiles.rangedMain],['远程副手',r.weaponProfiles.rangedOff]];return`<section class="v8-summary-card"><span>武器面板</span><div class="v83-final-combat">${rows.map(([label,p])=>weaponLine(p,label)).join('')}</div><p>主动开关型专长与触发型附伤不默认并入基础命中/伤害。</p></section>`}
function finalSaveCard(r){return`<section class="v8-summary-card"><span>最终豁免</span><div class="v83-final-saves">${r.saveProfiles.map(x=>`<div><small>${esc(x.label)}</small><b>${fmt(x.bonus)}</b><em>${x.proficient?'熟练':'未熟练'}</em></div>`).join('')}</div></section>`}
function finalCastingCard(r){return`<section class="v8-summary-card"><span>施法来源</span>${r.castingProfiles.length?`<div class="v83-casting-list">${r.castingProfiles.map(x=>`<div><div><b>${esc(x.name)}</b><small>${x.abilityCode} 施法</small></div><strong>DC ${x.dc} · ${fmt(x.attack)}</strong></div>`).join('')}</div>`:'<p>当前构筑没有施法来源。</p>'}${r.castingProfiles.length?`<p>法术攻击重击阈值：${r.spellCritThreshold}+</p>`:''}</section>`}
function finalChapterRoute(){return`<section class="v8-summary-card wide"><span>章节装备路线 · 实际数值演进</span><div class="v83-chapter-route">${[1,2,3].map(a=>{const load=chapterLoadout(eq,a),x=evaluateEquipment(build,load).result;return`<div class="v83-chapter-card"><div><b>${actLabel(a)}</b><small>${Object.keys(load).length}/${equipmentSlots.length} 槽位</small></div><div class="v83-chapter-metrics"><span>AC<b>${x.ac}</b></span><span>生命<b>${x.hp}</b></span><span>先攻<b>${fmt(x.initiative)}</b></span><span>主手<b>${x.weaponProfiles.main?fmt(x.weaponProfiles.main.attack):'—'}</b></span><span>远程<b>${x.weaponProfiles.rangedMain?fmt(x.weaponProfiles.rangedMain.attack):'—'}</b></span><span>法术DC<b>${x.spellDC||'—'}</b></span></div><p>${chapterChangesText(a)}</p></div>`}).join('')}</div></section>`}
function finalStage(){const s=characterSummary(build),scores=finalScores(build),issues=validationIssues(build),loadout=finalGear(),ev=evaluateEquipment(build,loadout),r=ev.result,resources=buildResourceModel(build),features=activeFeatureGroups(build).flatMap(g=>g.selected.map(k=>[g.title,g.options.find(o=>o[0]===k)?.[1]||k])),prof=[...proficientSkills(build)],expert=expertiseSkills(build),spells=spellSources(build).flatMap(src=>{const c=spellChoice(build,src.key);return[...c.cantrips,...c.spells,...c.prepared].map(k=>spellData.find(x=>x.key===k)).filter(Boolean)}),uniqueSpells=[...new Map(spells.map(x=>[x.key,x])).values()],mainAtk=r.weaponProfiles.main?fmt(r.weaponProfiles.main.attack):'—',rangedAtk=r.weaponProfiles.rangedMain?fmt(r.weaponProfiles.rangedMain.attack):'—';return`<main class="v8-main v8-final-stage"><section class="v8-page-head"><span>PHASE III · FINAL BUILD · V8.2.2</span><h1>最终构筑</h1><p>人物属性、职业选择、章节装备与可精确计算效果统一进入同一个最终结果；条件触发效果保持独立。</p></section><div class="v81-status-strip ${issues.length||r.warnings.length||r.errors.length?'warn':''}"><b>${issues.length?`人物还有 ${issues.length} 项待处理`:r.errors.length?`装备有 ${r.errors.length} 个结构错误`:'人物构筑完整'}</b><span>装备 ${Object.keys(loadout).length}/${equipmentSlots.length} · ${r.castingBlocked?'未熟练防具会阻止施法':r.errors.length?'需要修正装备结构':'最终规则链已计算'}</span></div><section class="v8-final-hero"><div class="v8-final-identity"><span class="v8-level">${build.targetLevel}</span><div><h2>${esc(build.name)}</h2><p>${esc(build.identity?.race||'—')} · ${esc(s.route)}</p><small>${backgrounds[build.identity?.background]?.name||'—'}</small></div></div><div class="v8-stat-row large">${stat('生命',r.hp)}${stat('护甲',r.ac)}${stat('先攻',fmt(r.initiative))}${stat('近战命中',mainAtk)}${stat('远程命中',rangedAtk)}${stat('法术DC',r.spellDC||'—')}</div></section><div class="v8-final-grid"><section class="v8-summary-card wide"><div class="v8-section-label"><span>最终装备</span><b>${Object.keys(loadout).length}/${equipmentSlots.length}</b></div><div class="v8-final-loadout">${equipmentSlots.map(slot=>{const it=equipmentById(loadout[slot]);return`<div class="${it?'filled':''}"><span>${it?equipmentImageTag(it,'v82-final-equipment-image'):slotMeta[slot].glyph}</span><div><small>${slotMeta[slot].name}</small><b>${it?esc(it.name):'未装备'}</b>${it?`<em>ACT ${it.act}</em>`:''}</div></div>`}).join('')}</div></section><section class="v8-summary-card"><span>最终属性</span><div class="v82-final-scores">${abilities.map(a=>`<div><small>${a.name}</small><b>${r.scores[a.key]}</b><em>${r.scores[a.key]!==scores[a.key]?`${scores[a.key]} → ${r.scores[a.key]} · 调整值 ${fmt(r.mods[a.key])}`:`调整值 ${fmt(r.mods[a.key])}`}</em></div>`).join('')}</div></section>${finalSaveCard(r)}${finalWeaponCard(r)}${finalCastingCard(r)}${miniList('职业资源',resources.map(x=>[x.label,x.entries?.map(e=>`${e.label}${e.value}`).join(' · ')||`${x.value} · ${x.recharge||''}`]))}${miniList('职业能力',features)}${miniList('技能熟练',prof.map(k=>[`${skillName(k)} ${fmt(r.skillBonuses[k]??0)}`,expert.has(k)?'专精':'熟练']))}<section class="v8-summary-card"><span>核心法术</span><div class="v82-final-spells">${uniqueSpells.slice(0,18).map(sp=>`<div>${spellImageTag(sp,'v82-final-spell-img')}<b>${esc(sp.name)}</b><small>${sp.level===0?'戏法':sp.level+'环'}</small></div>`).join('')||'<p>无</p>'}</div></section>${finalChapterRoute()}${r.exactEffects.length?`<section class="v8-summary-card wide"><span>已计入最终面板的精确效果</span><div class="v83-effect-grid">${r.exactEffects.map(x=>`<div><b>${esc(x.item)}</b><small>${esc(x.text)}</small></div>`).join('')}</div></section>`:''}${r.conditionals.length?`<section class="v8-summary-card wide"><span>条件型效果 · 未默认折算</span><div class="v82-final-list">${r.conditionals.map(x=>`<div><b>${esc(x.item)}</b><small>${esc(x.text)}</small></div>`).join('')}</div></section>`:''}${r.errors.length?`<section class="v8-summary-card wide v83-error-card"><span>装备结构错误</span>${r.errors.map(x=>`<p>${esc(x)}</p>`).join('')}</section>`:''}${r.warnings.length?`<section class="v8-summary-card wide v82-warning-card"><span>装备规则警告</span>${r.warnings.map(x=>`<p>${esc(x)}</p>`).join('')}</section>`:''}</div><div class="v8-final-actions"><button data-stage="character">修改人物</button><button data-stage="equipment">调整装备</button><button class="primary" data-action="export">导出 V8.2.2 构筑</button></div></main>`}
'''
    text=replace_between(text,"function miniList","function stat",final)

    old_export="function exportV82(){if(!build)return;const payload={version:'8.2',exportedAt:new Date().toISOString(),character:exportBuild(build.id),equipment:{version:2,chapters:eq.chapters,finalLoadout:finalGear()},summary:{base:characterSummary(build),equipped:evaluateEquipment(build,finalGear()).result},catalog:{schema:'8.2.0',builtInItems:catalogStats.total}};downloadJson(`${build.name||'BG3构筑'}_V8.2.json`,payload)}"
    new_export="function exportV82(){if(!build)return;const payload={version:'8.2.2',exportedAt:new Date().toISOString(),character:exportBuild(build.id),equipment:{version:2,chapters:eq.chapters,finalLoadout:finalGear()},summary:{base:characterSummary(build),equipped:evaluateEquipment(build,finalGear()).result},catalog:{schema:'8.2.0',builtInItems:catalogStats.total}};downloadJson(`${build.name||'BG3构筑'}_V8.2.2.json`,payload)}"
    if old_export not in text:raise RuntimeError("export marker not found")
    text=text.replace(old_export,new_export,1)

    html=HTML.read_text(encoding="utf-8")
    anchor='  <link rel="stylesheet" href="./assets/v8/v82.css">'
    if './assets/v8/background.css' not in html:
        html=html.replace(anchor,anchor+'\n  <link rel="stylesheet" href="./assets/v8/background.css">',1)
    if './assets/v8/v82-linkage.css' not in html:
        bg='  <link rel="stylesheet" href="./assets/v8/background.css">'
        html=html.replace(bg,bg+'\n  <link rel="stylesheet" href="./assets/v8/v82-linkage.css">',1)
    html=html.replace('构筑规划器 V8.2：','构筑规划器 V8.2.2：').replace('构筑规划器 V8.2</title>','构筑规划器 V8.2.2</title>')

    original=V82.read_text(encoding="utf-8")
    original_html=HTML.read_text(encoding="utf-8")
    try:
        V82.write_text(text,encoding="utf-8")
        HTML.write_text(html,encoding="utf-8")
        if shutil.which("node"):
            subprocess.check_call(["node","--check",str(V82)],cwd=ROOT)
            subprocess.check_call(["node","--check",str(ROOT/"assets/v8/equipment-rules.js")],cwd=ROOT)
    except Exception:
        V82.write_text(original,encoding="utf-8")
        HTML.write_text(original_html,encoding="utf-8")
        raise

    print("Applied V8.2.2 core linkage patch.")
    print("Changed: assets/v8/v82.js, v8.html")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
