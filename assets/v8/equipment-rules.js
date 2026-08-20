import{abilities,skills}from'../js/data/core.js';
import{characterSummary,finalScores,mod,classCounts,proficiencyBonus,spellSources,proficientSkills,expertiseSkills}from'../js/selectors.js';
import{equipmentById,slotsForItem,slotMeta}from'./equipment-catalog.js';

const SIMPLE_TYPES=new Set(['club','dagger','greatclub','handaxe','javelin','light-hammer','mace','quarterstaff','sickle','spear','light-crossbow','shortbow']);
const MARTIAL_TYPES=new Set(['battleaxe','flail','glaive','greataxe','greatsword','halberd','hand-crossbow','heavy-crossbow','longbow','longsword','maul','morningstar','pike','rapier','scimitar','shortsword','trident','war-pick','warhammer']);
const ARMOUR_REQ=new Set(['light','medium','heavy','shield']);

const startingArmour={
  barbarian:{light:true,medium:true,shield:true},bard:{light:true},cleric:{light:true,medium:true,shield:true},druid:{light:true,medium:true,shield:true},
  fighter:{light:true,medium:true,heavy:true,shield:true},monk:{},paladin:{light:true,medium:true,heavy:true,shield:true},ranger:{light:true,medium:true,shield:true},
  rogue:{light:true},sorcerer:{},warlock:{light:true},wizard:{}
};
const multiclassArmour={
  barbarian:{shield:true},bard:{light:true},cleric:{light:true,medium:true,shield:true},druid:{light:true,medium:true,shield:true},
  fighter:{light:true,medium:true,shield:true},monk:{},paladin:{light:true,medium:true,shield:true},ranger:{light:true,medium:true,shield:true},
  rogue:{light:true},sorcerer:{},warlock:{light:true},wizard:{}
};
const subclassArmour={
  '勇气学院':{medium:true,shield:true},'剑刃学院':{medium:true},'生命领域':{heavy:true},'自然领域':{heavy:true},'风暴领域':{heavy:true},'战争领域':{heavy:true},
  '咒刃':{medium:true,shield:true},'剑咏':{light:true}
};
const startingWeapons={
  barbarian:['simple','martial'],fighter:['simple','martial'],paladin:['simple','martial'],ranger:['simple','martial'],
  bard:['simple','hand-crossbow','longsword','rapier','shortsword'],rogue:['simple','hand-crossbow','longsword','rapier','shortsword'],
  cleric:['simple','flail','morningstar'],druid:['club','dagger','javelin','mace','quarterstaff','scimitar','sickle','spear'],
  monk:['simple','shortsword'],sorcerer:['dagger','light-crossbow','quarterstaff'],wizard:['dagger','light-crossbow','quarterstaff'],warlock:['simple']
};
const multiclassWeapons={
  barbarian:['simple','martial'],bard:[],cleric:['flail','morningstar'],druid:[],fighter:['simple','martial'],monk:['simple','shortsword'],
  paladin:['simple','martial'],ranger:['simple','martial'],rogue:[],sorcerer:[],warlock:['simple'],wizard:[]
};
const subclassWeapons={'勇气学院':['martial'],'剑刃学院':['scimitar'],'战争领域':['martial'],'风暴领域':['martial'],'咒刃':['martial']};
const raceArmour={'人类':{light:true,shield:true},'半精灵':{light:true,shield:true},'吉斯洋基人':{light:true,medium:true}};
const raceWeapons={
  '卓尔':['rapier','shortsword','hand-crossbow'],'精灵':['longsword','shortsword','longbow','shortbow'],'吉斯洋基人':['greatsword','longsword','shortsword'],
  '矮人':['battleaxe','handaxe','light-hammer','warhammer'],'人类':['pike','spear','halberd','glaive'],'半精灵':['pike','spear','halberd','glaive']
};
const startingSaves={
  barbarian:['str','con'],bard:['dex','cha'],cleric:['wis','cha'],druid:['int','wis'],fighter:['str','con'],monk:['str','dex'],
  paladin:['wis','cha'],ranger:['str','dex'],rogue:['dex','int'],sorcerer:['con','cha'],warlock:['wis','cha'],wizard:['int','wis']
};

const hasFeat=(build,key)=>(build.feats||[]).some(x=>x?.type===key);
const hasChoice=(build,group,key)=>(build.classChoices?.[group]||[]).includes(key);
const hasProp=(item,p)=>item?.weapon?.properties?.includes(p);
const isMeleeWeapon=item=>item?.kind==='weapon'&&item.slotType==='melee';
const isRangedWeapon=item=>item?.kind==='weapon'&&item.slotType==='ranged';
const slotName=slot=>slotMeta[slot]?.name||slot;

function selectedFightingStyles(build){return new Set(['fighter-style','paladin-style','ranger-style'].flatMap(id=>build.classChoices?.[id]||[]))}
function armourRequirement(item){
  if(!item)return null;
  if(item.kind==='shield')return'shield';
  const req=item.armor?.proficiency||item.proficiency;
  return ARMOUR_REQ.has(req)?req:null;
}
function requiresArmourProficiency(item){return Boolean(armourRequirement(item))}
function isArmouredItem(item){return Boolean(item?.armor&&['light','medium','heavy'].includes(item.armor.type))}
function uniqueItems(entries){return[...new Map(entries.map(x=>[x.item.id,x.item])).values()]}

export function equipmentProficiencies(build){
  const armour={light:false,medium:false,heavy:false,shield:false},weapons=new Set(),counts=classCounts(build),start=build.levels?.[0];
  const mergeArm=o=>Object.entries(o||{}).forEach(([k,v])=>{if(v)armour[k]=true});
  mergeArm(raceArmour[build.identity?.race]);
  if(start){mergeArm(startingArmour[start]);for(const p of startingWeapons[start]||[])weapons.add(p)}
  for(const key of Object.keys(counts)){
    if(key!==start){mergeArm(multiclassArmour[key]);for(const p of multiclassWeapons[key]||[])weapons.add(p)}
    const sub=build.subclasses?.[key];mergeArm(subclassArmour[sub]);for(const p of subclassWeapons[sub]||[])weapons.add(p)
  }
  if(hasChoice(build,'ranger-enemy','ranger-knight'))armour.heavy=true;
  if(armour.heavy){armour.medium=true;armour.light=true}else if(armour.medium)armour.light=true;
  return{armour,weapons};
}
export function hasWeaponProficiency(build,item){
  if(!item?.weapon)return true;
  const p=equipmentProficiencies(build).weapons,type=item.weapon.type,cat=item.weapon.category;
  return p.has(type)||p.has(cat)||(cat==='simple'&&p.has('simple'))||(cat==='martial'&&p.has('martial'))||(SIMPLE_TYPES.has(type)&&p.has('simple'))||(MARTIAL_TYPES.has(type)&&p.has('martial'));
}
export function hasArmourProficiency(build,item){
  if(!item)return true;if(item.armor?.selfProficient)return true;
  const req=armourRequirement(item);if(!req)return true;
  return Boolean(equipmentProficiencies(build).armour[req]);
}
function dualLegal(build,main,off){
  if(!isMeleeWeapon(main)||!isMeleeWeapon(off))return false;
  if(hasProp(main,'two-handed')||hasProp(off,'two-handed'))return false;
  return hasFeat(build,'dual')||(hasProp(main,'light')&&hasProp(off,'light'));
}

export function validateLoadout(build,loadout={}){
  const errors=[],warnings=[],seen=new Map();
  for(const[slot,id]of Object.entries(loadout)){
    const item=equipmentById(id);
    if(!item){errors.push(`${slotName(slot)}引用了不存在的装备：${id}`);continue}
    if(!slotsForItem(item).includes(slot))errors.push(`${item.name}不能装备到${slotName(slot)}。`);
    if(seen.has(id))errors.push(`${item.name}是唯一装备，不能同时占用${slotName(seen.get(id))}和${slotName(slot)}。`);else seen.set(id,slot);
    if(requiresArmourProficiency(item)&&!hasArmourProficiency(build,item))warnings.push(`${item.name}：缺少${armourRequirement(item)==='shield'?'盾牌':armourRequirement(item)}熟练`);
    if(item.weapon&&!hasWeaponProficiency(build,item))warnings.push(`${item.name}：缺少武器熟练`);
  }
  const main=equipmentById(loadout.main),off=equipmentById(loadout.off);
  if(main&&hasProp(main,'two-handed')&&off)errors.push(`${main.name}是双手武器，不能同时使用${off.name}。`);
  if(off&&isMeleeWeapon(off)&&!dualLegal(build,main,off))errors.push('近战副手不满足双持条件：默认需要两把轻型武器，双持客可扩大到非双手单手武器。');
  const rMain=equipmentById(loadout.rangedMain),rOff=equipmentById(loadout.rangedOff);
  if(rOff&&(rOff.weapon?.type!=='hand-crossbow'||rMain?.weapon?.type!=='hand-crossbow'))errors.push('远程副手仅允许手弩，并且远程主手也必须是手弩。');
  return{errors:[...new Set(errors)],warnings:[...new Set(warnings)]};
}

export function equipTransaction(build,loadout,slot,itemId){
  const next={...loadout},item=equipmentById(itemId),cleared=[],errors=[],warnings=[];
  if(!item){delete next[slot];return{ok:true,loadout:next,cleared,errors,warnings}}
  if(!slotsForItem(item).includes(slot))return{ok:false,loadout:{...loadout},cleared,errors:[`${item.name}不能装备到${slotName(slot)}。`],warnings};

  for(const[s,id]of Object.entries(next))if(s!==slot&&id===item.id){cleared.push(id);delete next[s];warnings.push(`${item.name}已从${slotName(s)}移动到${slotName(slot)}。`)}
  next[slot]=item.id;

  if(slot==='main'&&hasProp(item,'two-handed')&&next.off){cleared.push(next.off);delete next.off;warnings.push('双手主手会占用副手，原副手已自动卸下。')}
  if(slot==='off'){
    const main=equipmentById(next.main);
    if(main&&hasProp(main,'two-handed'))return{ok:false,loadout:{...loadout},cleared:[],errors:[`${main.name}是双手武器，无法同时装备副手。`],warnings:[]};
    if(isMeleeWeapon(item)){
      if(!main||!isMeleeWeapon(main))return{ok:false,loadout:{...loadout},cleared:[],errors:['副手武器需要同时装备一把可双持的近战主手武器。'],warnings:[]};
      if(!dualLegal(build,main,item))return{ok:false,loadout:{...loadout},cleared:[],errors:[hasFeat(build,'dual')?'双持客仍不能双持双手武器。':'默认只能双持两把轻型武器；选择“双持客”后可扩大范围。'],warnings:[]};
    }
  }
  if(slot==='main'&&isMeleeWeapon(item)&&next.off){
    const off=equipmentById(next.off);
    if(isMeleeWeapon(off)&&!dualLegal(build,item,off)){cleared.push(next.off);delete next.off;warnings.push('新主手与原副手不满足双持条件，已自动卸下副手。')}
  }
  if(slot==='rangedOff'){
    const main=equipmentById(next.rangedMain);
    if(item.weapon?.type!=='hand-crossbow'||main?.weapon?.type!=='hand-crossbow')return{ok:false,loadout:{...loadout},cleared:[],errors:['远程副手仅用于双持手弩，远程主手也必须是手弩。'],warnings:[]};
  }
  if(slot==='rangedMain'&&item.weapon?.type!=='hand-crossbow'&&next.rangedOff){cleared.push(next.rangedOff);delete next.rangedOff;warnings.push('非手弩远程武器会占用远程双手位，已卸下远程副手。')}

  if(requiresArmourProficiency(item)&&!hasArmourProficiency(build,item))warnings.push(`${item.name}需要${armourRequirement(item)==='shield'?'盾牌':armourRequirement(item)}熟练；未熟练会阻止施法并使相关检定受罚。`);
  if(!hasWeaponProficiency(build,item))warnings.push(`${item.name}不在当前人物的武器熟练范围内。`);
  const structural=validateLoadout(build,next);
  if(structural.errors.length)return{ok:false,loadout:{...loadout},cleared:[],errors:structural.errors,warnings:[]};
  warnings.push(...structural.warnings);
  return{ok:true,loadout:next,cleared,errors,warnings:[...new Set(warnings)]};
}

function ruleSum(items,type,filter=()=>true){let n=0;for(const item of items)for(const r of item.rules||[])if(r.type===type&&filter(r,item))n+=Number(r.value)||0;return n}
function applyAbilities(base,items){
  const scores={...base};
  for(const ability of Object.keys(scores)){
    const floors=items.flatMap(i=>(i.rules||[]).filter(r=>r.type==='ability_floor'&&r.ability===ability).map(r=>Number(r.value)||0));
    if(floors.length)scores[ability]=Math.max(scores[ability],...floors);
    for(const r of items.flatMap(i=>i.rules||[]).filter(r=>r.type==='ability_bonus'&&r.ability===ability)){
      scores[ability]+=Number(r.value)||0;if(r.cap)scores[ability]=Math.min(scores[ability],Number(r.cap))
    }
  }
  return scores;
}
function armourAC(build,scores,loadout,items){
  const armor=equipmentById(loadout.armor),shield=equipmentById(loadout.off)?.kind==='shield'?equipmentById(loadout.off):null;
  const dex=mod(scores.dex),wis=mod(scores.wis),con=mod(scores.con),counts=classCounts(build),styles=selectedFightingStyles(build);
  let ac;
  if(isArmouredItem(armor)){
    const a=armor.armor;
    if(a.type==='heavy')ac=a.baseAC;
    else if(a.type==='medium')ac=a.baseAC+(a.uncappedDex?dex:Math.min(a.dexCap??2,dex));
    else ac=a.baseAC+dex;
  }else{
    const clothingBase=armor?.armor?.type==='clothing'?(Number(armor.armor.baseAC)||10):10;
    ac=clothingBase+dex;
    if((counts.monk||0)>0&&!shield)ac=Math.max(ac,10+dex+wis);
    if((counts.barbarian||0)>0)ac=Math.max(ac,10+dex+con);
  }
  if(styles.has('defense')&&isArmouredItem(armor))ac+=1;
  ac+=ruleSum(items,'ac_bonus');
  const main=equipmentById(loadout.main),off=equipmentById(loadout.off);
  if(hasFeat(build,'dual')&&isMeleeWeapon(main)&&isMeleeWeapon(off)&&dualLegal(build,main,off))ac+=1;
  return ac;
}
function abilityCode(key){return abilities.find(a=>a.key===key)?.code||String(key||'').toUpperCase()}
function pactBladeActive(build){return hasChoice(build,'warlock-pact','blade')}
function monkWeaponEligible(build,item){return(classCounts(build).monk||0)>0&&item?.weapon&&!hasProp(item,'two-handed')&&(item.weapon.category==='simple'||item.weapon.type==='shortsword')}
function weaponAbility(build,item,slot,scores){
  if(!item?.weapon)return null;
  if(slot==='rangedMain'||slot==='rangedOff')return'dex';
  if(slot==='main'&&pactBladeActive(build))return'cha';
  if(hasProp(item,'finesse')||monkWeaponEligible(build,item))return scores.dex>=scores.str?'dex':'str';
  return'str';
}
function duelingApplies(build,item,loadout,styles){
  if(!styles.has('dueling')||!isMeleeWeapon(item)||hasProp(item,'two-handed'))return false;
  const off=equipmentById(loadout.off);
  if(isMeleeWeapon(off))return false;
  if(hasProp(item,'versatile')&&!off)return false;
  return true;
}
function characterCritAdjustment(build){return(build.subclasses?.fighter==='勇士'&&(classCounts(build).fighter||0)>=3)?-1:0}
function equipmentCritAdjustment(items,hand='main'){return ruleSum(items,'crit_threshold',r=>!r.hand||r.hand===hand)}
function weaponProfile(build,scores,items,loadout,slot){
  const item=equipmentById(loadout[slot]);if(!item?.weapon)return null;
  const styles=selectedFightingStyles(build),ability=weaponAbility(build,item,slot,scores),abilityMod=mod(scores[ability]),pb=proficiencyBonus(build),proficient=hasWeaponProficiency(build,item);
  const archery=(slot==='rangedMain'||slot==='rangedOff')&&styles.has('archery')?2:0;
  const attack=abilityMod+(proficient?pb:0)+archery+ruleSum(items,'attack_bonus');
  const includeAbilityDamage=slot!=='off'||styles.has('two-weapon');
  const dueling=slot==='main'&&duelingApplies(build,item,loadout,styles)?2:0;
  const damageModifier=(includeAbilityDamage?abilityMod:0)+dueling+ruleSum(items,'weapon_damage_bonus');
  const crit=Math.max(1,20+characterCritAdjustment(build)+equipmentCritAdjustment(items,slot==='off'?'off':'main'));
  return{slot,itemId:item.id,name:item.name,ability,abilityCode:abilityCode(ability),proficient,attack,damageBase:item.weapon.damage,damageType:item.weapon.damageType,
    damageModifier,damageText:`${item.weapon.damage}${damageModifier?`${damageModifier>0?'+':''}${damageModifier}`:''} ${item.weapon.damageType}`,
    critThreshold:crit,archeryBonus:archery,duelingBonus:dueling,offhandAbilityIncluded:includeAbilityDamage};
}
function buildSkillBonuses(build,scores,items){
  const pb=proficiencyBonus(build),prof=proficientSkills(build),expert=expertiseSkills(build),jack=(classCounts(build).bard||0)>=2?Math.floor(pb/2):0,out={};
  for(const skill of skills)out[skill.key]=mod(scores[skill.ability])+(expert.has(skill.key)?pb*2:prof.has(skill.key)?pb:jack)+ruleSum(items,'skill_bonus',r=>!r.skill||r.skill===skill.key);
  return out;
}
function buildSaveProfiles(build,scores,items){
  const pb=proficiencyBonus(build),start=build.levels?.[0],profs=new Set(startingSaves[start]||[]);
  return abilities.map(a=>({ability:a.key,label:a.name,proficient:profs.has(a.key),bonus:mod(scores[a.key])+(profs.has(a.key)?pb:0)+ruleSum(items,'save_bonus',r=>!r.ability||r.ability===a.key)}));
}
function buildCastingProfiles(build,scores,items){
  const pb=proficiencyBonus(build),dcBonus=ruleSum(items,'spell_dc_bonus'),attackBonus=ruleSum(items,'spell_attack_bonus');
  return spellSources(build).map(src=>({key:src.key,name:src.name,ability:src.ability,abilityCode:abilityCode(src.ability),dc:8+pb+mod(scores[src.ability])+dcBonus,attack:pb+mod(scores[src.ability])+attackBonus}));
}
function exactEffects(build,items,loadout){
  const rows=[],labelForRule=r=>{
    if(r.type==='ability_floor')return`${abilityCode(r.ability)} 至少 ${r.value}`;
    if(r.type==='ability_bonus')return`${abilityCode(r.ability)} +${r.value}${r.cap?`（上限 ${r.cap}）`:''}`;
    if(r.type==='ac_bonus')return`AC +${r.value}`;
    if(r.type==='initiative_bonus')return`先攻 +${r.value}`;
    if(r.type==='spell_dc_bonus')return`法术 DC +${r.value}`;
    if(r.type==='spell_attack_bonus')return`法术攻击 +${r.value}`;
    if(r.type==='attack_bonus')return`攻击检定 +${r.value}`;
    if(r.type==='weapon_damage_bonus')return`武器伤害 +${r.value}`;
    if(r.type==='save_bonus')return`豁免检定 +${r.value}`;
    if(r.type==='crit_threshold')return`重击阈值 ${Number(r.value)<0?'降低':'调整'} ${Math.abs(Number(r.value)||0)}`;
    return null;
  };
  for(const item of items)for(const r of item.rules||[]){const text=labelForRule(r);if(text)rows.push({item:item.name,text,type:r.type})}
  const styles=selectedFightingStyles(build),armor=equipmentById(loadout.armor),main=equipmentById(loadout.main),off=equipmentById(loadout.off),ranged=equipmentById(loadout.rangedMain);
  if(styles.has('defense')&&isArmouredItem(armor))rows.push({item:'战斗风格',text:'防御：穿甲时 AC +1',type:'class_equipment'});
  if(styles.has('archery')&&isRangedWeapon(ranged))rows.push({item:'战斗风格',text:'箭术：远程武器攻击 +2',type:'class_equipment'});
  if(duelingApplies(build,main,loadout,styles))rows.push({item:'战斗风格',text:'决斗：主手武器伤害 +2',type:'class_equipment'});
  if(styles.has('two-weapon')&&isMeleeWeapon(off))rows.push({item:'战斗风格',text:'双武器战斗：副手伤害计入属性调整值',type:'class_equipment'});
  if(hasFeat(build,'dual')&&isMeleeWeapon(main)&&isMeleeWeapon(off)&&dualLegal(build,main,off))rows.push({item:'专长',text:'双持客：双持时 AC +1',type:'class_equipment'});
  if(pactBladeActive(build)&&isMeleeWeapon(main))rows.push({item:'契约恩赐',text:'魔刃契约：主手近战按魅力计算命中与伤害',type:'class_equipment'});
  return rows;
}
function buildConditionalEffects(build,items,loadout){
  const rows=items.flatMap(item=>(item.conditional||[]).map(text=>({item:item.name,text})));
  const styles=selectedFightingStyles(build),main=equipmentById(loadout.main),off=equipmentById(loadout.off),ranged=equipmentById(loadout.rangedMain);
  if(styles.has('great-weapon')&&main?.weapon&&(hasProp(main,'two-handed')||hasProp(main,'versatile')))rows.push({item:'战斗风格',text:'巨武器战斗：重掷武器伤害骰中的低点数；不折算为固定面板值'});
  if(styles.has('protection')&&off?.kind==='shield')rows.push({item:'战斗风格',text:'保护：持盾时可干扰针对附近盟友的攻击；属于反应条件效果'});
  if(hasFeat(build,'gwm')&&main?.weapon&&(hasProp(main,'two-handed')||hasProp(main,'versatile')))rows.push({item:'专长',text:'巨武器大师：可主动用命中惩罚换取额外伤害；默认不计入基础命中/伤害'});
  if(hasFeat(build,'sharpshooter')&&ranged?.weapon)rows.push({item:'专长',text:'神射手：可主动用命中惩罚换取额外伤害；默认不计入基础命中/伤害'});
  return rows;
}

export function evaluateEquipment(build,loadout={}){
  const base=characterSummary(build),baseScores=finalScores(build),entries=Object.entries(loadout).map(([slot,id])=>({slot,item:equipmentById(id)})).filter(x=>x.item),items=uniqueItems(entries),scores=applyAbilities(baseScores,items);
  const conDelta=mod(scores.con)-mod(baseScores.con),dexDelta=mod(scores.dex)-mod(baseScores.dex),loadoutIssues=validateLoadout(build,loadout);
  const castingBlocked=entries.some(({item})=>requiresArmourProficiency(item)&&!hasArmourProficiency(build,item));
  const castingProfiles=buildCastingProfiles(build,scores,items),activeKey=base.casting?.key,activeCasting=castingProfiles.find(x=>x.key===activeKey)||castingProfiles.at(-1)||null;
  const saveProfiles=buildSaveProfiles(build,scores,items),skillBonuses=buildSkillBonuses(build,scores,items);
  const weaponProfiles={main:weaponProfile(build,scores,items,loadout,'main'),off:weaponProfile(build,scores,items,loadout,'off'),rangedMain:weaponProfile(build,scores,items,loadout,'rangedMain'),rangedOff:weaponProfile(build,scores,items,loadout,'rangedOff')};
  const critThreshold=weaponProfiles.main?.critThreshold??Math.max(1,20+characterCritAdjustment(build)+equipmentCritAdjustment(items,'main'));
  const spellCritThreshold=Math.max(1,20+characterCritAdjustment(build)+equipmentCritAdjustment(items,'main')+(hasFeat(build,'spellSniper')?-1:0));
  const result={
    scores,mods:Object.fromEntries(abilities.map(a=>[a.key,mod(scores[a.key])])),
    hp:Math.max(1,base.hp+conDelta*build.targetLevel+ruleSum(items,'hp_bonus')),ac:armourAC(build,scores,loadout,items),
    initiative:base.initiative+dexDelta+ruleSum(items,'initiative_bonus'),
    spellDC:activeCasting?.dc||0,spellAttack:activeCasting?.attack||0,castingProfiles,spellCritThreshold,
    attackBonus:ruleSum(items,'attack_bonus'),weaponDamageBonus:ruleSum(items,'weapon_damage_bonus'),saveBonus:ruleSum(items,'save_bonus'),
    saveProfiles,skillBonuses,weaponProfiles,critThreshold,castingBlocked,conditionals:buildConditionalEffects(build,items,loadout),
    grants:items.flatMap(item=>(item.grants||[]).map(text=>({item:item.name,text}))),exactEffects:exactEffects(build,items,loadout),
    errors:loadoutIssues.errors,warnings:loadoutIssues.warnings,items,armourType:equipmentById(loadout.armor)?.armor?.type||'unarmored',armoured:isArmouredItem(equipmentById(loadout.armor))
  };
  return{base,baseScores,result};
}

function diffNumber(a,b){return Number.isFinite(a)&&Number.isFinite(b)?a-b:0}
export function evaluateCandidate(build,loadout,slot,itemId){
  const tx=equipTransaction(build,loadout,slot,itemId);
  if(!tx.ok)return{ok:false,errors:tx.errors,warnings:tx.warnings,loadout:{...loadout},summary:[]};
  const before=evaluateEquipment(build,loadout).result,after=evaluateEquipment(build,tx.loadout).result,summary=[];
  for(const a of abilities)if(before.scores[a.key]!==after.scores[a.key])summary.push(`${a.code} ${before.scores[a.key]}→${after.scores[a.key]}`);
  const push=(label,a,b,lower=false)=>{const d=diffNumber(a,b);if(d)summary.push(`${label} ${d>0?'+':''}${d}${lower?'（越低越好）':''}`)};
  push('AC',after.ac,before.ac);push('生命',after.hp,before.hp);push('先攻',after.initiative,before.initiative);push('法术DC',after.spellDC,before.spellDC);push('法术攻击',after.spellAttack,before.spellAttack);
  push('主手命中',after.weaponProfiles.main?.attack??0,before.weaponProfiles.main?.attack??0);push('远程命中',after.weaponProfiles.rangedMain?.attack??0,before.weaponProfiles.rangedMain?.attack??0);push('重击阈值',after.critThreshold,before.critThreshold,true);
  return{ok:true,loadout:tx.loadout,result:after,before,delta:{hp:after.hp-before.hp,ac:after.ac-before.ac,initiative:after.initiative-before.initiative,spellDC:after.spellDC-before.spellDC,spellAttack:after.spellAttack-before.spellAttack},summary:summary.slice(0,4),warnings:[...new Set([...tx.warnings,...after.warnings])],errors:after.errors,cleared:tx.cleared};
}

export function equipmentCompatibility(build,item){
  const reasons=[];let score=item.score||70;
  if(requiresArmourProficiency(item)&&!hasArmourProficiency(build,item)){score-=35;reasons.push('缺少护甲/盾牌熟练')}
  if(!hasWeaponProficiency(build,item)&&item.weapon){score-=20;reasons.push('缺少武器熟练')}
  const summary=characterSummary(build),primary=summary.casting?.ability,styles=selectedFightingStyles(build),scores=finalScores(build);
  if(primary&&item.tags?.some(t=>['施法','法术DC','法术攻击'].includes(t)))score+=6;
  if(primary==='cha'&&item.tags?.includes('魅力'))score+=8;
  if((classCounts(build).monk||0)&&item.tags?.includes('武僧'))score+=10;
  if(hasFeat(build,'tavern')&&item.tags?.some(t=>['投掷','徒手','酒馆斗殴者'].includes(t)))score+=10;
  if(hasFeat(build,'sharpshooter')&&item.tags?.includes('远程'))score+=8;
  if(hasFeat(build,'gwm')&&item.weapon?.properties?.includes('two-handed'))score+=8;
  if(styles.has('archery')&&isRangedWeapon(item))score+=6;
  if(styles.has('defense')&&isArmouredItem(item))score+=5;
  if(pactBladeActive(build)&&isMeleeWeapon(item))score+=6;
  for(const r of item.rules||[]){
    if(r.type==='ability_floor'&&scores[r.ability]<Number(r.value)){score+=8;reasons.push(`${abilityCode(r.ability)} 会提升至 ${r.value}`)}
    if(r.type==='ability_bonus'&&r.ability===primary)score+=5;
  }
  return{score:Math.max(0,Math.min(100,score)),reasons};
}
