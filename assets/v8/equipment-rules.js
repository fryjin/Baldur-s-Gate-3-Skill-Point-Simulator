import{classes}from'../js/data/core.js';
import{characterSummary,finalScores,mod,classCounts}from'../js/selectors.js';
import{equipmentById,slotsForItem}from'./equipment-catalog.js';

const ARMOUR_RANK={none:0,light:1,medium:2,heavy:3};
const SIMPLE_TYPES=new Set(['club','dagger','greatclub','handaxe','javelin','light-hammer','mace','quarterstaff','sickle','spear','light-crossbow','shortbow']);
const MARTIAL_TYPES=new Set(['battleaxe','flail','glaive','greataxe','greatsword','halberd','hand-crossbow','heavy-crossbow','longbow','longsword','maul','morningstar','pike','rapier','scimitar','shortsword','trident','war-pick','warhammer']);

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


const hasFeat=(build,key)=>(build.feats||[]).some(x=>x?.type===key);
export function equipmentProficiencies(build){
  const armour={light:false,medium:false,heavy:false,shield:false},weapons=new Set(),counts=classCounts(build),start=build.levels?.[0];
  const mergeArm=o=>Object.entries(o||{}).forEach(([k,v])=>{if(v)armour[k]=true});
  mergeArm(raceArmour[build.identity?.race]);
  if(start){mergeArm(startingArmour[start]);for(const p of startingWeapons[start]||[])weapons.add(p)}
  for(const key of Object.keys(counts)){
    if(key!==start){mergeArm(multiclassArmour[key]);for(const p of multiclassWeapons[key]||[])weapons.add(p)}
    const sub=build.subclasses?.[key];mergeArm(subclassArmour[sub]);for(const p of subclassWeapons[sub]||[])weapons.add(p)
  }
  // Armour proficiency with a heavier category includes the lighter categories.
  if(armour.heavy){armour.medium=true;armour.light=true}else if(armour.medium)armour.light=true;
  return{armour,weapons};
}
export function hasWeaponProficiency(build,item){
  if(!item?.weapon)return true;
  const p=equipmentProficiencies(build).weapons,type=item.weapon.type,cat=item.weapon.category;
  return p.has(type)||p.has(cat)||(cat==='simple'&&p.has('simple'))||(cat==='martial'&&p.has('martial'));
}
export function hasArmourProficiency(build,item){
  if(!item)return true;if(item.armor?.selfProficient)return true;
  const p=equipmentProficiencies(build).armour;
  if(item.kind==='shield')return Boolean(p.shield);
  const req=item.proficiency||item.armor?.proficiency;
  if(!req)return true;if(req==='shield')return Boolean(p.shield);return Boolean(p[req]);
}
function isMeleeWeapon(item){return item?.kind==='weapon'&&item.slotType==='melee'}
function isRangedWeapon(item){return item?.kind==='weapon'&&item.slotType==='ranged'}
const hasProp=(item,p)=>item?.weapon?.properties?.includes(p);

export function equipTransaction(build,loadout,slot,itemId){
  const next={...loadout},item=equipmentById(itemId),cleared=[],errors=[],warnings=[];
  if(!item){delete next[slot];return{ok:true,loadout:next,cleared,errors,warnings}}
  if(!slotsForItem(item).includes(slot))return{ok:false,loadout:next,cleared,errors:[`${item.name}不能装备到${slot}。`],warnings};
  next[slot]=item.id;
  if(slot==='main'&&hasProp(item,'two-handed')){if(next.off){cleared.push(next.off);delete next.off}}
  if(slot==='off'){
    const main=equipmentById(next.main);
    if(main&&hasProp(main,'two-handed')){errors.push(`${main.name}是双手武器，无法同时装备副手。`);return{ok:false,loadout:{...loadout},cleared:[],errors,warnings}}
    if(isMeleeWeapon(item)){
      if(!main||!isMeleeWeapon(main)){errors.push('副手武器需要同时装备一把可双持的近战主手武器。');return{ok:false,loadout:{...loadout},cleared:[],errors,warnings}}
      const dual=hasFeat(build,'dual'),legal=dual?(!hasProp(main,'two-handed')&&!hasProp(item,'two-handed')):(hasProp(main,'light')&&hasProp(item,'light'));
      if(!legal){errors.push(dual?'双持客也不能双持双手武器。':'默认只能双持两把“轻型”武器；选择“双持客”专长后可扩大范围。');return{ok:false,loadout:{...loadout},cleared:[],errors,warnings}}
    }
  }
  if(slot==='main'&&isMeleeWeapon(item)&&next.off){
    const off=equipmentById(next.off);
    if(isMeleeWeapon(off)){
      const dual=hasFeat(build,'dual'),legal=dual?(!hasProp(item,'two-handed')&&!hasProp(off,'two-handed')):(hasProp(item,'light')&&hasProp(off,'light'));
      if(!legal){cleared.push(next.off);delete next.off;warnings.push('新主手与原副手不满足双持条件，已自动卸下副手。')}
    }
  }
  if(slot==='rangedOff'){
    const main=equipmentById(next.rangedMain);
    if(item.weapon?.type!=='hand-crossbow'||main?.weapon?.type!=='hand-crossbow'){
      errors.push('远程副手仅用于双持手弩，远程主手也必须是手弩。');return{ok:false,loadout:{...loadout},cleared:[],errors,warnings}
    }
  }
  if(slot==='rangedMain'&&item.weapon?.type!=='hand-crossbow'&&next.rangedOff){cleared.push(next.rangedOff);delete next.rangedOff;warnings.push('非手弩远程武器会占用双手，已卸下远程副手。')}
  if(!hasArmourProficiency(build,item))warnings.push(`${item.name}需要${item.kind==='shield'?'盾牌':item.proficiency||item.armor?.proficiency}熟练；未熟练会阻止施法并使多类检定处于劣势。`);
  if(!hasWeaponProficiency(build,item))warnings.push(`${item.name}不在当前人物的武器熟练范围内。`);
  return{ok:true,loadout:next,cleared,errors,warnings}
}

function ruleSum(items,type,filter=()=>true){let n=0;for(const item of items)for(const r of item.rules||[])if(r.type===type&&filter(r,item))n+=Number(r.value)||0;return n}
function applyAbilities(base,items){const scores={...base};
  for(const ability of Object.keys(scores)){
    const floors=items.flatMap(i=>(i.rules||[]).filter(r=>r.type==='ability_floor'&&r.ability===ability).map(r=>r.value));if(floors.length)scores[ability]=Math.max(scores[ability],...floors);
    for(const r of items.flatMap(i=>i.rules||[]).filter(r=>r.type==='ability_bonus'&&r.ability===ability)){scores[ability]+=Number(r.value)||0;if(r.cap)scores[ability]=Math.min(scores[ability],r.cap)}
  }return scores
}
function armourAC(build,scores,loadout,items){
  const armor=equipmentById(loadout.armor),shield=equipmentById(loadout.off)?.kind==='shield'?equipmentById(loadout.off):null,dex=mod(scores.dex),wis=mod(scores.wis),con=mod(scores.con),counts=classCounts(build);
  let ac;
  if(armor?.armor){const a=armor.armor;if(a.type==='heavy')ac=a.baseAC;else if(a.type==='medium')ac=a.baseAC+(a.uncappedDex?dex:Math.min(a.dexCap??2,dex));else if(a.type==='light')ac=a.baseAC+dex;else ac=10+dex}
  else{
    ac=10+dex;
    if((counts.monk||0)>0&&!shield)ac=Math.max(ac,10+dex+wis);
    if((counts.barbarian||0)>0)ac=Math.max(ac,10+dex+con)
  }
  // ac_bonus on armour/shield/other items (avoid armor base itself, all bonus rules are explicit bonuses)
  ac+=ruleSum(items,'ac_bonus');
  const main=equipmentById(loadout.main),off=equipmentById(loadout.off);if(hasFeat(build,'dual')&&isMeleeWeapon(main)&&isMeleeWeapon(off))ac+=1;
  return ac
}

export function evaluateEquipment(build,loadout){
  const base=characterSummary(build),baseScores=finalScores(build),items=Object.values(loadout||{}).map(equipmentById).filter(Boolean),scores=applyAbilities(baseScores,items);
  const conDelta=mod(scores.con)-mod(baseScores.con),dexDelta=mod(scores.dex)-mod(baseScores.dex),casting=base.casting,castDelta=casting?mod(scores[casting.ability])-mod(baseScores[casting.ability]):0;
  const warnings=[];for(const item of items){if(!hasArmourProficiency(build,item))warnings.push(`${item.name}：缺少护甲/盾牌熟练`);if(!hasWeaponProficiency(build,item))warnings.push(`${item.name}：缺少武器熟练`)}
  const castingBlocked=items.some(item=>(item.kind==='shield'||item.armor)&&!hasArmourProficiency(build,item));
  const conditionals=items.flatMap(item=>(item.conditional||[]).map(text=>({item:item.name,text}))),grants=items.flatMap(item=>(item.grants||[]).map(text=>({item:item.name,text})));
  const result={
    scores,
    hp:Math.max(1,base.hp+conDelta*build.targetLevel),
    ac:armourAC(build,scores,loadout,items),
    initiative:base.initiative+dexDelta+ruleSum(items,'initiative_bonus'),
    spellDC:casting?(base.casting.dc+castDelta+ruleSum(items,'spell_dc_bonus')):0,
    spellAttack:casting?(base.casting.attack+castDelta+ruleSum(items,'spell_attack_bonus')):0,
    attackBonus:ruleSum(items,'attack_bonus'),weaponDamageBonus:ruleSum(items,'weapon_damage_bonus'),saveBonus:ruleSum(items,'save_bonus'),
    critThreshold:Math.max(1,20+ruleSum(items,'crit_threshold',r=>!r.hand||r.hand==='main')),
    castingBlocked,conditionals,grants,warnings,items,
    armourType:equipmentById(loadout.armor)?.armor?.type||'unarmored'
  };
  return{base,baseScores,result}
}

export function equipmentCompatibility(build,item){
  const reasons=[];let score=item.score||70;
  if(!hasArmourProficiency(build,item)&&(item.armor||item.kind==='shield')){score-=35;reasons.push('缺少护甲熟练')}
  if(!hasWeaponProficiency(build,item)&&item.weapon){score-=20;reasons.push('缺少武器熟练')}
  const summary=characterSummary(build),primary=summary.casting?.ability;
  if(primary&&item.tags?.some(t=>['施法','法术DC','法术攻击'].includes(t)))score+=6;
  if(primary==='cha'&&item.tags?.includes('魅力'))score+=8;
  if((classCounts(build).monk||0)&&item.tags?.includes('武僧'))score+=10;
  if(hasFeat(build,'tavern')&&item.tags?.some(t=>['投掷','徒手','酒馆斗殴者'].includes(t)))score+=10;
  if(hasFeat(build,'sharpshooter')&&item.tags?.includes('远程'))score+=8;
  if(hasFeat(build,'gwm')&&item.weapon?.properties?.includes('two-handed'))score+=8;
  return{score:Math.max(0,Math.min(100,score)),reasons}
}
