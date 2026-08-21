import assert from'node:assert/strict';
import{writeFileSync}from'node:fs';
import{spellData}from'../assets/js/data/spells.js';
import{finalScores,characterSummary,validationIssues,featSlots,spellSources,spellLimits}from'../assets/js/selectors.js';
import{buildResourceModel}from'../assets/js/data/resource-model.js';
import{equipmentById,equipmentItems}from'../assets/v8/equipment-catalog.js';
import{evaluateEquipment,equipTransaction,validateLoadout,hasArmourProficiency}from'../assets/v8/equipment-rules.js';
import{chapterLoadout,replaceChapterLoadout,finalLoadout}from'../assets/v8/equipment-store.js';

const build={
  version:7,id:'v825-acceptance',name:'V8.2.5 验收 · 圣武士6 / 术士6',targetLevel:12,
  levels:['paladin','paladin','paladin','paladin','paladin','paladin','sorcerer','sorcerer','sorcerer','sorcerer','sorcerer','sorcerer'],
  identity:{race:'人类',background:'soldier',armorMode:'heavy'},
  subclasses:{paladin:'复仇之誓',sorcerer:'风暴术法'},
  abilities:{scores:{str:15,dex:10,con:14,int:8,wis:8,cha:15},bonus2:'cha',bonus1:'str'},
  feats:[{type:'asi',a1:'str',a2:'str'},{type:'asi',a1:'cha',a2:'cha'}],
  skills:{class:['insight','persuasion'],race:'perception',multiclass:{}},
  expertise:{},
  classChoices:{'paladin-style':['defense'],'sorcerer-metamagic':['quickened','twinned']},
  spellChoices:{}
};

const sources=spellSources(build);
const pal=sources.find(x=>x.key==='paladin');
const sor=sources.find(x=>x.key==='sorcerer');
assert.ok(pal&&sor,'expected paladin and sorcerer spell sources');

const palLimit=spellLimits(build,pal),sorLimit=spellLimits(build,sor);
const pick=(key,predicate,n)=>spellData.filter(sp=>sp.classes.includes(key)&&predicate(sp)).slice(0,n).map(sp=>sp.key);
build.spellChoices.paladin={
  cantrips:[],
  spells:pick('paladin',sp=>sp.level>0&&sp.level<=pal.maxLevel,palLimit.prepared),
  prepared:[]
};
build.spellChoices.paladin.prepared=[...build.spellChoices.paladin.spells];
build.spellChoices.sorcerer={
  cantrips:pick('sorcerer',sp=>sp.level===0,sorLimit.cantrips),
  spells:pick('sorcerer',sp=>sp.level>0&&sp.level<=sor.maxLevel,sorLimit.spells),
  prepared:[]
};

assert.equal(build.spellChoices.paladin.prepared.length,palLimit.prepared,'paladin prepared spell fixture incomplete');
assert.equal(build.spellChoices.sorcerer.cantrips.length,sorLimit.cantrips,'sorcerer cantrip fixture incomplete');
assert.equal(build.spellChoices.sorcerer.spells.length,sorLimit.spells,'sorcerer known spell fixture incomplete');

const issues=validationIssues(build);
if(issues.length)console.error('character validation issues:',issues);
assert.equal(issues.length,0,'12-level character must be complete');
assert.equal(featSlots(build).length,2,'ASI/feat slots must use individual class levels (Paladin 6 + Sorcerer 6 => 2 slots)');
assert.deepEqual(finalScores(build),{str:18,dex:10,con:14,int:8,wis:8,cha:19});

const base=characterSummary(build);
assert.equal(base.hp,88);
assert.equal(base.ac,18);
assert.equal(base.initiative,0);
assert.equal(base.casting?.key,'sorcerer');
assert.equal(base.casting?.dc,16);
assert.equal(base.casting?.attack,8);

const resources=buildResourceModel(build);
const byResource=Object.fromEntries(resources.map(x=>[x.key,x]));
assert.equal(byResource['spell-slots']?.value,'14');
assert.deepEqual(byResource['spell-slots']?.entries,[
  {label:'1环',value:'4'},{label:'2环',value:'3'},{label:'3环',value:'3'},{label:'4环',value:'3'},{label:'5环',value:'1'}
]);
assert.equal(byResource['lay-on-hands']?.value,'4');
assert.equal(byResource['channel-oath']?.value,'1');
assert.equal(byResource['sorcery']?.value,'6');
assert.equal(byResource['pact-slots'],undefined);

const requireItems=ids=>ids.forEach(id=>assert.ok(equipmentById(id),`missing equipment ${id}`));

const act1={
  head:'helmet-smiting',
  cloak:'deathstalker-mantle',
  armor:'adamantine-splint',
  gloves:'gloves-dexterity',
  boots:'night-walkers',
  amulet:'psychic-spark',
  ring1:'ring-protection',
  ring2:'caustic-band',
  main:'phalar-aluve',
  off:'adamantine-shield',
  rangedMain:'titanstring-bow'
};
requireItems(Object.values(act1));
assert.deepEqual(validateLoadout(build,act1).errors,[]);
const state={act:1,slot:'armor',chapters:{1:{},2:{},3:{}}};
replaceChapterLoadout(state,1,act1);
assert.deepEqual(chapterLoadout(state,1),act1);

const r1=evaluateEquipment(build,chapterLoadout(state,1)).result;
assert.deepEqual(r1.scores,{str:18,dex:18,con:14,int:8,wis:8,cha:19});
assert.equal(r1.hp,88);
assert.equal(r1.ac,22);
assert.equal(r1.initiative,4);
assert.equal(r1.spellDC,16);
assert.equal(r1.spellAttack,8);
assert.equal(r1.saveBonus,1);
assert.equal(r1.weaponProfiles.main.attack,9);
assert.equal(r1.weaponProfiles.main.damageText,'1d8+4 挥砍');
assert.equal(r1.weaponProfiles.rangedMain.attack,9);
assert.equal(r1.castingBlocked,false);

const act2={
  ...chapterLoadout(state,1),
  cloak:'cloak-protection',
  armor:'dwarven-splintmail',
  off:'ketheric-shield',
  rangedMain:'neer-misser',
  rangedOff:'hellfire-hand-crossbow'
};
requireItems(Object.values(act2));
replaceChapterLoadout(state,2,act2);
assert.equal(Object.keys(chapterLoadout(state,2)).length,12);
assert.equal(Object.keys(state.chapters[2]).length,5,'ACT2 should store delta only');

const r2=evaluateEquipment(build,chapterLoadout(state,2)).result;
assert.deepEqual(r2.scores,{str:18,dex:18,con:16,int:8,wis:8,cha:19});
assert.equal(r2.hp,100);
assert.equal(r2.ac,24);
assert.equal(r2.initiative,4);
assert.equal(r2.spellDC,17);
assert.equal(r2.spellAttack,9);
assert.equal(r2.saveBonus,2);
assert.equal(r2.weaponProfiles.main.attack,9);
assert.equal(r2.weaponProfiles.rangedMain.attack,9);
assert.equal(r2.errors.length,0);
assert.equal(r2.castingBlocked,false);

const tx= equipTransaction(build,chapterLoadout(state,2),'rangedMain','dead-shot');
assert.equal(tx.ok,true);
assert.equal(Boolean(tx.loadout.rangedOff),false,'two-handed/normal ranged weapon must clear ranged off-hand');
assert.ok(tx.cleared.includes('hellfire-hand-crossbow'));

const act3={
  ...tx.loadout,
  head:'birthright',
  cloak:'cloak-weave',
  armor:'helldusk-armour',
  gloves:'legacy-masters',
  amulet:'amulet-health',
  off:'viconia-fortress'
};
requireItems(Object.values(act3));
replaceChapterLoadout(state,3,act3);
assert.equal(state.chapters[3].rangedOff,null,'ACT3 delta must persist ranged-off removal');
assert.deepEqual(finalLoadout(state),chapterLoadout(state,3));

const r3=evaluateEquipment(build,finalLoadout(state)).result;
assert.deepEqual(r3.scores,{str:18,dex:10,con:23,int:8,wis:8,cha:21});
assert.equal(r3.hp,136);
assert.equal(r3.ac,26);
assert.equal(r3.initiative,0);
assert.equal(r3.spellDC,18);
assert.equal(r3.spellAttack,10);
assert.equal(r3.saveBonus,1);
assert.equal(r3.weaponProfiles.main.attack,10);
assert.equal(r3.weaponProfiles.main.damageText,'1d8+6 挥砍');
assert.equal(r3.weaponProfiles.rangedMain.attack,6);
assert.equal(r3.weaponProfiles.rangedMain.critThreshold,19);
assert.equal(r3.critThreshold,19);
assert.equal(r3.castingBlocked,false);
assert.equal(r3.errors.length,0);
assert.equal(r3.warnings.length,0);

const saves=Object.fromEntries(r3.saveProfiles.map(x=>[x.ability,x.bonus]));
assert.deepEqual(saves,{str:5,dex:1,con:7,int:0,wis:4,cha:10});
assert.equal(r3.weaponDamageBonus,2,'conditional Caustic Band damage must not be folded into always-on weapon damage');
assert.ok(r3.conditionals.some(x=>x.item==='腐蚀戒指'),'conditional item effects must remain separate');

const twoHanded=equipmentItems.find(x=>x.slotType==='melee'&&x.weapon?.properties?.includes('two-handed'));
assert.ok(twoHanded,'need a two-handed melee fixture');
const tx2=equipTransaction(build,{...act1},'main',twoHanded.id);
assert.equal(tx2.ok,true);
assert.equal(Boolean(tx2.loadout.off),false,'two-handed main must clear shield/off-hand');

const sorcStart={...build,levels:['sorcerer',...Array(11).fill('paladin')],targetLevel:12,subclasses:{sorcerer:'风暴术法',paladin:'复仇之誓'}};
assert.equal(hasArmourProficiency(sorcStart,equipmentById('adamantine-splint')),false,'multiclassing into paladin must not grant starting heavy-armour proficiency');
assert.equal(evaluateEquipment(sorcStart,{armor:'adamantine-splint'}).result.castingBlocked,true);

const report={
  version:'V8.2.5 full build acceptance',
  character:{
    route:'Paladin 6 / Sorcerer 6',
    level:12,
    validationIssues:issues,
    featSlots:featSlots(build).length,
    base:{scores:finalScores(build),hp:base.hp,ac:base.ac,initiative:base.initiative,spellDC:base.casting?.dc,spellAttack:base.casting?.attack},
    resources:resources.map(x=>({key:x.key,value:x.value,entries:x.entries,recharge:x.recharge}))
  },
  chapters:{
    act1:{slots:Object.keys(chapterLoadout(state,1)).length,hp:r1.hp,ac:r1.ac,initiative:r1.initiative,spellDC:r1.spellDC,spellAttack:r1.spellAttack,mainAttack:r1.weaponProfiles.main.attack,rangedAttack:r1.weaponProfiles.rangedMain.attack},
    act2:{slots:Object.keys(chapterLoadout(state,2)).length,hp:r2.hp,ac:r2.ac,initiative:r2.initiative,spellDC:r2.spellDC,spellAttack:r2.spellAttack,mainAttack:r2.weaponProfiles.main.attack,rangedAttack:r2.weaponProfiles.rangedMain.attack},
    act3:{slots:Object.keys(finalLoadout(state)).length,hp:r3.hp,ac:r3.ac,initiative:r3.initiative,spellDC:r3.spellDC,spellAttack:r3.spellAttack,mainAttack:r3.weaponProfiles.main.attack,rangedAttack:r3.weaponProfiles.rangedMain.attack,crit:r3.critThreshold}
  },
  focusedRules:{
    act2StoredAsDelta:Object.keys(state.chapters[2]).length===5,
    rangedOffClearedByDeadShot:!tx.loadout.rangedOff,
    twoHandedClearsShield:!tx2.loadout.off,
    multiclassPaladinDoesNotGrantHeavy:!hasArmourProficiency(sorcStart,equipmentById('adamantine-splint')),
    unproficientArmourBlocksCasting:evaluateEquipment(sorcStart,{armor:'adamantine-splint'}).result.castingBlocked,
    conditionalDamageSeparated:r3.weaponDamageBonus===2
  }
};
writeFileSync('V825_FULL_BUILD_ACCEPTANCE.json',JSON.stringify(report,null,2)+'\n');
console.log('V8.2.5 full 12-level + ACT1→ACT3 acceptance: PASS');
console.log(JSON.stringify(report,null,2));
