import assert from'node:assert/strict';
import{POINT_BUY_BUDGET,pointBuyUsedScores,pointBuyProjected,canSetPointBuyScore}from'../assets/js/data/point-buy.js';
import{spellData}from'../assets/js/data/spells.js';
import{cantripPlan}from'../assets/js/data/spell-progression.js';
import{learningPlan,emptyLearningState,activeNodeForState,assignToNode,migrateLearningState,learningIntegrityIssues,nodeProgress}from'../assets/js/data/spell-learning.js';

assert.equal(POINT_BUY_BUDGET,27);
const exact={str:15,dex:15,con:15,int:8,wis:8,cha:8};
assert.equal(pointBuyUsedScores(exact),27);
assert.equal(pointBuyProjected(exact,'int',9),28);
assert.equal(canSetPointBuyScore(exact,'int',9),false);
assert.equal(canSetPointBuyScore(exact,'str',14),true);

const near={str:15,dex:15,con:14,int:8,wis:8,cha:8};
assert.equal(pointBuyUsedScores(near),25);
assert.equal(canSetPointBuyScore(near,'con',15),true);
assert.equal(pointBuyProjected(near,'con',15),27);

const source={key:'sorcerer',name:'术士',level:8,mode:'known',maxLevel:4};
assert.deepEqual(cantripPlan(source),[
  {classLevel:1,count:4,total:4},
  {classLevel:4,count:1,total:5}
]);
const plan=learningPlan(source);
assert.deepEqual(plan.map(x=>[x.classLevel,x.count,x.maxSpellLevel]),[
  [1,2,1],[2,1,1],[3,1,2],[4,1,2],[5,1,3],[6,1,3],[7,1,4],[8,1,4]
]);
assert.equal(plan.reduce((n,x)=>n+x.count,0),9);

const state=emptyLearningState(source);
assert.equal(activeNodeForState(source,state,plan[7].id).classLevel,1);

const level1=plan[0],level7=plan.find(x=>x.classLevel===7);
const lvl1spells=spellData.filter(sp=>sp.classes.includes('sorcerer')&&sp.level===1);
const fireball=spellData.find(sp=>sp.key==='fireball');
const dimensionDoor=spellData.find(sp=>sp.key==='dimensionDoor');
assert.ok(lvl1spells.length>=2&&fireball&&dimensionDoor);

let res=assignToNode(state,level7,dimensionDoor.key);
assert.equal(res.ok,false);
assert.match(res.reason,/更早等级/);

res=assignToNode(state,level1,fireball.key);
assert.equal(res.ok,false);
assert.match(res.reason,/最高只能选择 1 环/);

assert.equal(assignToNode(state,level1,lvl1spells[0].key).ok,true);
assert.equal(assignToNode(state,level1,lvl1spells[1].key).ok,true);
assert.equal(nodeProgress(state,level1).complete,true);
assert.equal(activeNodeForState(source,state,plan[7].id).classLevel,2);

const high4=spellData.filter(sp=>sp.classes.includes('sorcerer')&&sp.level===4).slice(0,6).map(sp=>sp.key);
assert.ok(high4.length>=5,'need enough sorcerer 4th-level spells for migration guard test');
const impossibleChoice={cantrips:[],spells:high4,prepared:[]};
const migrated=migrateLearningState(null,source,impossibleChoice);
assert.equal(migrated.replacements.some(x=>x.migrated),false);
assert.ok(migrated.unassigned.length>0);
assert.ok(learningIntegrityIssues(source,migrated,impossibleChoice).length>0);

console.log('V8.2.6 character guardrail validation: PASS');
console.log('point buy: hard cap 27');
console.log('sorcerer 8: cantrips 5; known spells 9');
console.log('learning nodes: L1 2×≤1环 → L2 1×≤1环 → L3/4 ≤2环 → L5/6 ≤3环 → L7/8 ≤4环');
