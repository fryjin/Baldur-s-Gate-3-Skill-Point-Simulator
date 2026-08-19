export const slotMeta={
  head:['头部','冠'],cloak:['披风','披'],armor:['护甲','甲'],gloves:['手套','手'],boots:['鞋子','靴'],amulet:['项链','链'],ring1:['戒指 1','戒'],ring2:['戒指 2','戒'],main:['主手','主'],off:['副手','副'],ranged:['远程','远']
};

export const equipmentItems=[
  {id:'graceful-cloth',act:1,slot:'armor',name:'优雅布衣',en:'The Graceful Cloth',rarity:'稀有',source:'山隘 · 商人',icon:'衣',summary:'敏捷 +2，并强化敏捷检定。',effects:{ac:1,dex:2},tags:['敏捷','轻装','先攻'],score:86},
  {id:'gloves-dexterity',act:1,slot:'gloves',name:'敏捷手套',en:'Gloves of Dexterity',rarity:'非常稀有',source:'养育间 · 商人',icon:'手',summary:'将敏捷提高到 18，适合低敏施法者。',effects:{dexFloor:18},tags:['敏捷','先攻','护甲'],score:95},
  {id:'undermountain-king',act:1,slot:'main',name:'山丘巨王短刀',en:'Knife of the Undermountain King',rarity:'非常稀有',source:'养育间 · 商人',icon:'刃',summary:'降低重击阈值，并强化优势攻击。',effects:{crit:1,attack:1},tags:['重击','武器','爆发'],score:91},
  {id:'strange-conduit',act:1,slot:'ring1',name:'奇异导管戒指',en:'Strange Conduit Ring',rarity:'稀有',source:'养育间',icon:'环',summary:'保持专注时，武器攻击附加心灵伤害。',effects:{damage:2.5},tags:['专注','心灵','附伤'],score:78},
  {id:'caustic-band',act:1,slot:'ring2',name:'腐蚀戒指',en:'Caustic Band',rarity:'稀有',source:'幽暗地域 · 商人',icon:'酸',summary:'武器攻击稳定附加酸蚀伤害。',effects:{damage:2},tags:['酸蚀','附伤','稳定'],score:82},
  {id:'phalar-aluve',act:1,slot:'main',name:'法拉·阿鲁维',en:'Phalar Aluve',rarity:'稀有',source:'幽暗地域',icon:'剑',summary:'团队型武器，可通过旋律增强命中或额外伤害。',effects:{party:2,attack:1},tags:['团队','辅助','武器'],score:88},
  {id:'adamantine-shield',act:1,slot:'off',name:'精金盾牌',en:'Adamantine Shield',rarity:'非常稀有',source:'精金熔炉',icon:'盾',summary:'提高护甲并降低敌方暴击威胁。',effects:{ac:2,defense:2},tags:['护甲','生存','盾牌'],score:84},

  {id:'potent-robe',act:2,slot:'armor',name:'强能长袍',en:'Potent Robe',rarity:'非常稀有',source:'第二章任务奖励',icon:'袍',summary:'魅力施法者的核心长袍，强化戏法伤害与生存。',effects:{spellDamage:4,ac:1},tags:['魅力','戏法','核心'],score:99},
  {id:'risky-ring',act:2,slot:'ring1',name:'风险戒指',en:'Risky Ring',rarity:'非常稀有',source:'月出之塔 · 商人',icon:'险',summary:'攻击更容易取得优势，但豁免承受风险。',effects:{attack:3,crit:1,save:-1},tags:['优势','爆发','风险'],score:97},
  {id:'callous-glow',act:2,slot:'ring2',name:'无情光芒之戒',en:'Callous Glow Ring',rarity:'非常稀有',source:'莎尔试炼场',icon:'光',summary:'对被照亮目标追加光耀伤害。',effects:{damage:2},tags:['光耀','附伤','输出'],score:89},
  {id:'cloak-protection',act:2,slot:'cloak',name:'防护斗篷',en:'Cloak of Protection',rarity:'稀有',source:'终焉光芒旅店 · 商人',icon:'披',summary:'护甲等级与豁免检定各 +1。',effects:{ac:1,save:1},tags:['护甲','豁免','泛用'],score:92},
  {id:'arcane-acuity-helm',act:2,slot:'head',name:'奥术敏锐头盔',en:'Helmet of Arcane Acuity',rarity:'非常稀有',source:'第二章探索',icon:'慧',summary:'武器命中后叠加奥术敏锐，提升法术攻击与 DC。',effects:{spellDC:2,spellAttack:2},tags:['法术DC','控制','核心'],score:98},
  {id:'yuan-ti',act:2,slot:'armor',name:'元提鳞甲',en:'Yuan-Ti Scale Mail',rarity:'非常稀有',source:'终焉光芒旅店 · 商人',icon:'鳞',summary:'允许完整敏捷加值的中甲，兼顾防御与先攻。',effects:{ac:3,initiative:1},tags:['护甲','敏捷','中甲'],score:94},

  {id:'birthright',act:3,slot:'head',name:'天赋权利',en:'Birthright',rarity:'非常稀有',source:'博德之门 · 商人',icon:'冠',summary:'魅力 +2，纯魅力施法构筑的直接提升。',effects:{cha:2},tags:['魅力','法术DC','核心'],score:96},
  {id:'markoheshkir',act:3,slot:'main',name:'玛科赫什基',en:'Markoheshkir',rarity:'传奇',source:'拉玛吉斯高塔',icon:'杖',summary:'毕业级施法法杖，强化法术并提供元素向能力。',effects:{spellDC:1,spellAttack:1,spellDamage:3},tags:['施法','法术DC','毕业'],score:100},
  {id:'rhapsody',act:3,slot:'off',name:'狂想曲',en:'Rhapsody',rarity:'非常稀有',source:'第三章首领战利品',icon:'匕',summary:'通过击杀累积强化命中、伤害与法术效果。',effects:{spellDC:1,spellAttack:1,damage:3},tags:['叠层','法术','爆发'],score:96},
  {id:'armour-agility',act:3,slot:'armor',name:'敏捷护甲',en:'Armour of Agility',rarity:'非常稀有',source:'博德之门 · 商人',icon:'甲',summary:'极高防御中甲，完整吃敏捷加值。',effects:{ac:4,save:2},tags:['护甲','敏捷','毕业'],score:98},
  {id:'dead-shot',act:3,slot:'ranged',name:'致命一击',en:'The Dead Shot',rarity:'非常稀有',source:'博德之门 · 商人',icon:'弓',summary:'提升远程命中并进一步压低重击阈值。',effects:{crit:1,attack:2},tags:['重击','远程','命中'],score:95},
  {id:'legacy-masters',act:3,slot:'gloves',name:'大师遗产',en:'Legacy of the Masters',rarity:'非常稀有',source:'第三章商人',icon:'掌',summary:'稳定提高武器攻击与伤害。',effects:{attack:2,damage:2},tags:['武器','命中','伤害'],score:93},
  {id:'helldusk-boots',act:3,slot:'boots',name:'狱火暮光长靴',en:'Helldusk Boots',rarity:'非常稀有',source:'第三章任务',icon:'靴',summary:'强化机动与生存，适合终局高压战斗。',effects:{defense:2,initiative:1},tags:['机动','生存','终局'],score:91},
  {id:'amulet-health',act:3,slot:'amulet',name:'强健护符',en:'Amulet of Greater Health',rarity:'非常稀有',source:'希望宅邸',icon:'心',summary:'将体质提升到极高水平，显著提高生命与专注稳定性。',effects:{conFloor:23},tags:['体质','生命','专注'],score:100}
];

export const equipmentById=id=>equipmentItems.find(item=>item.id===id)||null;
export const equipmentSlots=Object.keys(slotMeta);
