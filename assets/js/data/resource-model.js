import{spellSources}from"../selectors.js";
import{slotProfile}from"./spell-progression.js";

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const countsFor=build=>(build.levels||[]).slice(0,build.targetLevel||0).reduce((out,key)=>{if(key)out[key]=(out[key]||0)+1;return out},{});
const slotEntries=profile=>(profile?.slots||[]).map((count,index)=>count?{label:`${index+1}环`,value:String(count)}:null).filter(Boolean);
const resource=(key,label,value,{detail="",recharge="",glyph="◆",tone="neutral",entries=null,source=""}={})=>({key,label,value:String(value??""),detail,recharge,glyph,tone,entries,source});

function rage(level){if(level<=0)return 0;if(level>=12)return 5;if(level>=6)return 4;if(level>=3)return 3;return 2}
function bardic(level){if(level<=0)return null;return{count:level>=8?5:level>=5?4:3,die:level>=10?"1d10":level>=5?"1d8":"1d6",recharge:level>=5?"短休":"长休"}}
function layOnHands(level){if(level<=0)return 0;return level>=10?5:level>=4?4:3}
function warPriest(level){if(level<=0)return 0;return level>=11?6:level>=8?5:level>=5?4:3}
function bladesong(level){if(level<2)return 0;return level>=9?4:level>=5?3:2}
function arcaneArrow(level){if(level<3)return 0;return level>=10?10:level>=7?7:4}
function superiority(level){if(level<3)return null;return{count:level>=7?5:4,die:level>=10?"1d10":"1d8"}}

export function buildResourceModel(build){
  const counts=countsFor(build),sub=build.subclasses||{},sources=spellSources(build),resources=[];
  const ordinary=sources.find(src=>src.mode!=="pact");
  if(ordinary){
    const profile=slotProfile(build,ordinary,sources),entries=slotEntries(profile);
    if(entries.length)resources.push(resource("spell-slots","法术位",entries.reduce((n,x)=>n+Number(x.value),0),{entries,recharge:"长休",glyph:"✦",tone:"arcane",detail:"普通施法资源；各环次数独立。",source:"spellcasting"}));
  }
  const pact=sources.find(src=>src.mode==="pact");
  if(pact){
    const profile=slotProfile(build,pact,sources),p=profile.pact;
    if(p)resources.push(resource("pact-slots","契约法术位",p.count,{entries:[{label:`${p.level}环`,value:`×${p.count}`}],recharge:"短休",glyph:"◈",tone:"pact",detail:"所有契约法术位均按当前最高环阶施放。",source:"warlock"}));
  }

  const barbarian=counts.barbarian||0;if(barbarian)resources.push(resource("rage","狂暴次数",rage(barbarian),{recharge:"长休",glyph:"怒",tone:"rage",detail:`野蛮人${barbarian}级`,source:"barbarian"}));
  const bard=counts.bard||0;if(bard){const b=bardic(bard);resources.push(resource("bardic","诗人激励",b.count,{recharge:b.recharge,glyph:"♪",tone:"bard",detail:`${b.die} · 吟游诗人${bard}级`,source:"bard"}))}
  const cleric=counts.cleric||0;if(cleric>=2)resources.push(resource("channel-divinity","神力引导",cleric>=6?2:1,{recharge:"短休",glyph:"☼",tone:"divine",detail:`牧师${cleric}级`,source:"cleric"}));
  if(cleric&&sub.cleric==="战争领域")resources.push(resource("war-priest","战争祭司充能",warPriest(cleric),{recharge:"长休",glyph:"⚔",tone:"martial",detail:"额外武器攻击资源",source:"cleric"}));

  const druid=counts.druid||0;if(druid>=2)resources.push(resource("wild-shape","荒野形态",2,{recharge:"短休",glyph:"◐",tone:"nature",detail:`德鲁伊${druid}级`,source:"druid"}));
  if(druid>=2&&sub.druid==="大地结社")resources.push(resource("natural-recovery","自然恢复",Math.ceil(druid/2),{recharge:"长休",glyph:"♧",tone:"nature",detail:"用于恢复已消耗法术位",source:"druid"}));

  const fighter=counts.fighter||0;
  if(fighter>=3&&sub.fighter==="战斗大师"){const d=superiority(fighter);resources.push(resource("superiority","卓越骰",d.count,{recharge:"短休",glyph:"◇",tone:"martial",detail:`${d.die} · 战斗大师`,source:"fighter"}))}
  if(fighter>=3&&sub.fighter==="奥术射手")resources.push(resource("arcane-arrow","奥术箭矢",arcaneArrow(fighter),{recharge:"短休",glyph:"➶",tone:"arcane",detail:"用于奥术射击",source:"fighter"}));

  const monk=counts.monk||0;if(monk)resources.push(resource("ki","气点",monk+1,{recharge:"短休",glyph:"气",tone:"ki",detail:`武僧${monk}级`,source:"monk"}));

  const paladin=counts.paladin||0;if(paladin){
    resources.push(resource("lay-on-hands","圣疗次数",layOnHands(paladin),{recharge:"长休",glyph:"✚",tone:"divine",detail:`圣武士${paladin}级`,source:"paladin"}));
    resources.push(resource("channel-oath","誓言引导",1,{recharge:"短休",glyph:"✧",tone:"divine",detail:"誓言职业资源",source:"paladin"}));
  }

  const sorcerer=counts.sorcerer||0;if(sorcerer>=2)resources.push(resource("sorcery","术法点",sorcerer,{recharge:"长休",glyph:"∞",tone:"sorcery",detail:"用于超魔，也可与法术位相互转换",source:"sorcerer"}));
  if(sorcerer&&sub.sorcerer==="狂野魔法")resources.push(resource("tides-chaos","混沌之潮",1,{recharge:"短休",glyph:"≈",tone:"sorcery",detail:"狂野魔法子职业资源",source:"sorcerer"}));

  const wizard=counts.wizard||0;if(wizard)resources.push(resource("arcane-recovery","奥术恢复",Math.ceil(wizard/2),{recharge:"长休",glyph:"↺",tone:"arcane",detail:"点数总和用于恢复已消耗法术位",source:"wizard"}));
  if(wizard>=2&&sub.wizard==="剑咏")resources.push(resource("bladesong","剑舞充能",bladesong(wizard),{recharge:"长休",glyph:"♫",tone:"arcane",detail:"用于启动剑舞",source:"wizard"}));

  return resources;
}

export function resourceSignature(build){return JSON.stringify(buildResourceModel(build).map(r=>[r.key,r.value,r.recharge,r.detail,r.entries]))}
export function classLevelMap(build){return countsFor(build)}
