import assert from'node:assert/strict';
import{equipmentItems,equipmentById}from'../assets/v8/equipment-catalog.js';
import{evaluateEquipment,evaluateCandidate,hasArmourProficiency,validateLoadout}from'../assets/v8/equipment-rules.js';

const baseBuild=(cls='fighter',level=4)=>({
  id:'validation',name:'validation',targetLevel:level,levels:Array(level).fill(cls),
  identity:{race:'人类',background:'soldier',armorMode:'unarmored'},
  abilities:{scores:{str:15,dex:15,con:14,int:8,wis:14,cha:15},bonus2:'str',bonus1:'dex'},
  feats:[],subclasses:{},skills:{class:[],multiclass:{},race:null},expertise:{},classChoices:{},spellChoices:{}
});

{
  const b=baseBuild('monk',4);b.abilities.scores.dex=14;b.abilities.scores.wis=15;b.abilities.bonus2='dex';b.abilities.bonus1='wis';
  const r=evaluateEquipment(b,{armor:'graceful-cloth'}).result;
  assert.ok(r.ac>=10+r.mods.dex+r.mods.wis,'clothing should preserve monk unarmoured defence');
}
{
  const b=baseBuild('fighter',4);b.classChoices['fighter-style']=['defense'];
  assert.equal(evaluateEquipment(b,{armor:'adamantine-splint'}).result.ac,19);
}
{
  const b=baseBuild('ranger',4);b.classChoices['ranger-enemy']=['ranger-knight'];
  assert.equal(hasArmourProficiency(b,equipmentById('adamantine-splint')),true);
}
{
  const b=baseBuild('sorcerer',4);
  assert.equal(evaluateEquipment(b,{head:'grymskull-helm'}).result.castingBlocked,true);
}
{
  const b=baseBuild('ranger',4);b.classChoices['ranger-style']=['archery'];
  assert.equal(evaluateEquipment(b,{rangedMain:'titanstring-bow'}).result.weaponProfiles.rangedMain.attack,7);
}
{
  const b=baseBuild('warlock',4);b.classChoices['warlock-pact']=['blade'];b.abilities.scores.str=8;b.abilities.scores.cha=15;b.abilities.bonus2='cha';b.abilities.bonus1='dex';
  assert.equal(evaluateEquipment(b,{main:'phalar-aluve'}).result.weaponProfiles.main.ability,'cha');
}
{
  const b=baseBuild('fighter',4);b.skills.class=['stealth'];
  const before=evaluateEquipment(b,{}).result.skillBonuses.stealth;
  const after=evaluateEquipment(b,{gloves:'gloves-dexterity'}).result.skillBonuses.stealth;
  assert.ok(after>before);
}
{
  const b=baseBuild('fighter',4);
  assert.ok(validateLoadout(b,{ring1:'ring-protection',ring2:'ring-protection'}).errors.length>0);
}
{
  const b=baseBuild('fighter',4);
  const twoHanded=equipmentItems.find(x=>x.slotType==='melee'&&x.weapon?.properties?.includes('two-handed'));
  const shield=equipmentItems.find(x=>x.kind==='shield');
  assert.ok(twoHanded&&shield);
  const preview=evaluateCandidate(b,{off:shield.id},'main',twoHanded.id);
  assert.equal(preview.ok,true);
  assert.equal(Boolean(preview.loadout.off),false);
}
console.log('V8.2.2 equipment rule validation: PASS');
