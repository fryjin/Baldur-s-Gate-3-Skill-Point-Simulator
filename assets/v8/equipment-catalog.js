import{generatedEquipmentItems,generatedEquipmentMeta}from'./equipment-generated.js';
export const EQUIPMENT_SCHEMA_VERSION='8.2.0';

export const slotMeta={
  head:{name:'头部',glyph:'冠',group:'wearable'},
  cloak:{name:'披风',glyph:'披',group:'wearable'},
  armor:{name:'护甲',glyph:'甲',group:'wearable'},
  gloves:{name:'手套',glyph:'手',group:'wearable'},
  boots:{name:'鞋子',glyph:'靴',group:'wearable'},
  amulet:{name:'项链',glyph:'链',group:'jewelry'},
  ring1:{name:'戒指 1',glyph:'戒',group:'jewelry'},
  ring2:{name:'戒指 2',glyph:'戒',group:'jewelry'},
  main:{name:'近战主手',glyph:'主',group:'melee'},
  off:{name:'近战副手',glyph:'副',group:'melee'},
  rangedMain:{name:'远程主手',glyph:'弓',group:'ranged'},
  rangedOff:{name:'远程副手',glyph:'弩',group:'ranged'}
};
export const equipmentSlots=Object.keys(slotMeta);

const g=(id,name,en,act,slotType,rarity,source,summary,tags=[],extra={})=>({
  id,name,en,act,slotType,rarity,source,summary,tags,score:extra.score||70,
  kind:extra.kind||'wearable',image:extra.image||'',armor:extra.armor||null,weapon:extra.weapon||null,
  rules:extra.rules||[],conditional:extra.conditional||[],grants:extra.grants||[],notes:extra.notes||'',
  proficiency:extra.proficiency||null,sourceType:extra.sourceType||'world',region:extra.region||'',quality:extra.quality||'curated'
});
const A=(type,baseAC,dexCap,proficiency,extra={})=>({type,baseAC,dexCap,proficiency,...extra});
const W=(type,damage,damageType,category,properties=[],extra={})=>({type,damage,damageType,category,properties,...extra});
const R=(type,value,extra={})=>({type,value,...extra});

const curatedEquipmentItems=[
  // ACT I — head / cloak / armour
  g('haste-helm','急速头盔','Haste Helm',1,'head','罕见','染疫村落','战斗开始时提供短暂动量，适合需要抢位置的近战与远程。',['先攻','机动'],{score:75,grants:['Momentum at combat start']}),
  g('warped-intellect','扭曲智力头带','Warped Headband of Intellect',1,'head','罕见','染疫村落 · 食人魔','将智力提高到 17，适合低智力但需要智力检定或副施法的构筑。',['智力','属性设定'],{score:88,rules:[R('ability_floor',17,{ability:'int'})]}),
  g('helmet-smiting','惩击头盔','Helmet of Smiting',1,'head','罕见','幽暗地域','强化惩击类法术带来的临时生命，偏圣武士生存。',['圣武士','惩击','生存'],{score:72}),
  g('circlet-blasting','爆裂头环','Circlet of Blasting',1,'head','罕见','商人','提供灼热射线的装备施法能力。',['火焰','装备法术'],{score:73,grants:['Scorching Ray']}),
  g('grymskull-helm','格林骷髅头盔','Grymskull Helm',1,'head','非常稀有','精金熔炉','重甲头盔，提供火焰抗性并降低遭受暴击的风险。',['重甲','防御','火焰抗性'],{score:88,proficiency:'heavy'}),
  g('deathstalker-mantle','死亡追猎者斗篷','The Deathstalker Mantle',1,'cloak','非常稀有','黑暗冲动剧情奖励','击杀后获得短暂隐形，适合刺客与爆发型角色。',['隐形','击杀','爆发'],{score:94,conditional:['击杀后隐形']}),
  g('graceful-cloth','优雅布衣','The Graceful Cloth',1,'armor','稀有','山隘 · 商人','敏捷 +2，并强化敏捷检定；不视为护甲。',['敏捷','徒手','先攻'],{score:92,armor:A('clothing',10,null,null),rules:[R('ability_bonus',2,{ability:'dex',cap:20})]}),
  g('luminous-armour','光耀护甲','Luminous Armour',1,'armor','罕见','幽暗地域','造成光耀伤害时可施加光耀宝珠，光耀构筑的重要组件。',['光耀','光耀宝珠','中甲'],{score:92,armor:A('medium',15,2,'medium'),conditional:['光耀伤害触发光耀宝珠']}),
  g('adamantine-scale','精金鳞甲','Adamantine Scale Mail',1,'armor','非常稀有','精金熔炉','高质量中甲，降低受到暴击后的风险并提供伤害减免。',['中甲','生存','精金'],{score:91,armor:A('medium',16,2,'medium')}),
  g('adamantine-splint','精金板条甲','Adamantine Splint Armour',1,'armor','非常稀有','精金熔炉','18 AC 的重甲并提供精金系防护能力。',['重甲','生存','精金'],{score:95,armor:A('heavy',18,0,'heavy')}),
  g('protecty-sparkswall','保护火花之墙','The Protecty Sparkswall',1,'armor','稀有','复仇之炉','闪电充能体系的法袍，适合闪电施法者。',['闪电充能','施法','布甲'],{score:84,armor:A('clothing',10,null,null),conditional:['拥有闪电充能时获得额外防护']}),
  g('spidersilk-armour','蛛丝护甲','Spidersilk Armour',1,'armor','罕见','明萨拉','轻甲并强化专注相关豁免。',['轻甲','专注','施法'],{score:80,armor:A('light',12,null,'light'),conditional:['专注豁免优势']}),

  // ACT I — gloves / boots / jewellery
  g('gloves-dexterity','敏捷手套','Gloves of Dexterity',1,'gloves','非常稀有','养育间 · 商人','将敏捷提高到 18，并提高攻击表现。',['敏捷','命中','核心'],{score:99,rules:[R('ability_floor',18,{ability:'dex'}),R('attack_bonus',1)]}),
  g('gloves-power','力量手套','Gloves of Power',1,'gloves','罕见','翠绿林地附近','武器命中可施加灾祸类减益。',['命中','减益'],{score:69,conditional:['武器命中触发减益']}),
  g('missile-snaring','飞弹拦截手套','Gloves of Missile Snaring',1,'gloves','罕见','商人','通过反应降低远程武器伤害。',['防御','远程'],{score:70}),
  g('sparkle-hands','火花之手','The Sparkle Hands',1,'gloves','罕见','湿地','徒手攻击获得闪电充能，适合武僧。',['武僧','徒手','闪电充能'],{score:87,conditional:['徒手命中获得闪电充能']}),
  g('belligerent-skies','好战天空手套','Gloves of Belligerent Skies',1,'gloves','罕见','养育间','雷鸣、闪电或光耀伤害可施加回荡。',['回荡','雷鸣','闪电','光耀'],{score:93,conditional:['指定元素伤害触发回荡']}),
  g('cinder-sizzle','余烬与嘶鸣手套','Gloves of Cinder and Sizzle',1,'gloves','罕见','养育间','徒手攻击追加火焰伤害并提供火焰相关技能。',['武僧','火焰','徒手'],{score:84,conditional:['徒手附加火焰伤害']}),
  g('boots-speed','速度之靴','Boots of Speed',1,'boots','稀有','幽暗地域','可通过附赠动作提高移动能力。',['机动','附赠动作'],{score:84,grants:['Click Heels']}),
  g('night-walkers','瓦解夜行者','Disintegrating Night Walkers',1,'boots','非常稀有','复仇之炉','免疫多种地形控制，并提供迷踪步。',['迷踪步','机动','地形免疫'],{score:96,grants:['Misty Step']}),
  g('stormy-clamour','风暴喧嚣之靴','Boots of Stormy Clamour',1,'boots','罕见','幽暗地域 · 商人','施加状态时叠加回荡，是回荡体系核心之一。',['回荡','控制','施法'],{score:95,conditional:['施加状态时获得回荡联动']}),
  g('watersparkers','水花行者','The Watersparkers',1,'boots','罕见','染疫村落','站在水面时建立闪电充能联动。',['闪电充能','水面'],{score:80,conditional:['水面与闪电充能联动']}),
  g('amulet-misty-step','迷踪步护符','Amulet of Misty Step',1,'amulet','罕见','幽暗地域','提供迷踪步，泛用位移装备。',['迷踪步','机动'],{score:89,grants:['Misty Step']}),
  g('psychic-spark','心灵火花','Psychic Spark',1,'amulet','罕见','幽暗地域 · 布尔格','强化魔法飞弹并提供一次魔法飞弹施法。',['魔法飞弹','施法','核心'],{score:92,conditional:['Magic Missile 额外飞弹'],grants:['Magic Missile']}),
  g('periapt-wound','伤口闭合护符','Periapt of Wound Closure',1,'amulet','非常稀有','养育间 · 商人','倒地后更稳定，并使受到的治疗趋向最大值。',['治疗','生存'],{score:89,conditional:['治疗骰取最大值']}),
  g('broodmothers-revenge','育母复仇','Broodmother\'s Revenge',1,'amulet','罕见','卡哈','受到治疗后武器获得毒素附伤。',['毒素','治疗联动','武器'],{score:84,conditional:['受到治疗后武器附毒']}),
  g('ring-protection','防护戒指','Ring of Protection',1,'ring','稀有','翠绿林地任务','AC +1，豁免 +1，极其泛用。',['AC','豁免','泛用'],{score:98,rules:[R('ac_bonus',1),R('save_bonus',1)]}),
  g('caustic-band','腐蚀戒指','Caustic Band',1,'ring','罕见','幽暗地域 · 商人','武器攻击稳定附加酸蚀伤害。',['酸蚀','武器','附伤'],{score:90,conditional:['武器攻击 +2 酸蚀伤害']}),
  g('crusher-ring','粉碎者之戒','Crusher\'s Ring',1,'ring','罕见','地精营地','增加移动距离，近战机动非常实用。',['移动','近战'],{score:82,conditional:['移动速度 +3m']}),
  g('strange-conduit','奇异导管戒指','Strange Conduit Ring',1,'ring','稀有','养育间','保持专注时武器攻击附加心灵伤害。',['专注','心灵','附伤'],{score:91,conditional:['专注时武器 +1d4 心灵']}),
  g('whispering-promise','低语承诺','The Whispering Promise',1,'ring','罕见','第一章商人','治疗目标后提供短时祝福，是治疗辅助核心戒指。',['治疗','祝福','辅助'],{score:94,conditional:['治疗后目标获得 Bless']}),

  // ACT I — weapons / shields / ranged
  g('phalar-aluve','法拉·阿鲁维','Phalar Aluve',1,'melee','稀有','幽暗地域','团队型长剑，可通过旋律增强命中或制造额外雷鸣伤害。',['团队','辅助','长剑'],{score:97,kind:'weapon',weapon:W('longsword','1d8','挥砍','martial',['versatile']),proficiency:'longsword',grants:['Phalar Aluve: Sing','Phalar Aluve: Shriek']}),
  g('undermountain-king','山丘巨王短刀','Knife of the Undermountain King',1,'melee','非常稀有','养育间 · 商人','降低重击阈值并改善伤害骰表现。',['重击','匕首','核心'],{score:98,kind:'weapon',weapon:W('shortsword','1d6','穿刺','martial',['light','finesse']),proficiency:'shortsword',rules:[R('crit_threshold',-1)]}),
  g('blood-lathander','洛山达之血','The Blood of Lathander',1,'melee','传奇','养育间','传奇钉头锤，提供强力光耀与防倒地能力。',['传奇','光耀','生存'],{score:99,kind:'weapon',weapon:W('mace','1d6','钝击','simple',[]),proficiency:'simple',grants:['Sunbeam'],conditional:['生命降至 0 时自救']}),
  g('returning-pike','回归长矛','Returning Pike',1,'melee','罕见','地精营地 · 商人','投掷后自动返回，是投掷构筑前期核心。',['投掷','酒馆斗殴者','长矛'],{score:97,kind:'weapon',weapon:W('pike','1d10','穿刺','martial',['two-handed','thrown']),proficiency:'pike',conditional:['投掷后返回']}),
  g('unseen-menace','隐形威胁','Unseen Menace',1,'melee','稀有','养育间 · 商人','攻击获得优势相关效果并强化重击路线。',['优势','重击','长柄'],{score:91,kind:'weapon',weapon:W('pike','1d10','穿刺','martial',['two-handed']),proficiency:'pike',conditional:['隐形武器状态提供优势']}),
  g('cacophony','杂音','Cacophony',1,'melee','罕见','修道院','雷鸣主题长棍，适合武僧和前期雷鸣联动。',['雷鸣','长棍','武僧'],{score:82,kind:'weapon',weapon:W('quarterstaff','1d6','钝击','simple',['versatile']),proficiency:'simple'}),
  g('club-hill-giant','山丘巨人力量短棒','Club of Hill Giant Strength',1,'melee','罕见','奥术塔','将力量提高到 19，可用于副手属性修正。',['力量','属性设定','短棒'],{score:94,kind:'weapon',weapon:W('club','1d4','钝击','simple',['light']),proficiency:'simple',rules:[R('ability_floor',19,{ability:'str'})]}),
  g('spellsparkler','法术火花','The Spellsparkler',1,'melee','稀有','渥金休眠地奖励','法术和戏法造成伤害时建立闪电充能。',['闪电充能','法师','法杖'],{score:94,kind:'weapon',weapon:W('quarterstaff','1d6','钝击','simple',['versatile']),proficiency:'simple',conditional:['法术伤害获得闪电充能']}),
  g('mourning-frost','悼霜','Mourning Frost',1,'melee','非常稀有','幽暗地域组合','冰霜法杖，强化寒冷伤害并支持冻寒体系。',['寒冷','冻寒','法杖'],{score:93,kind:'weapon',weapon:W('quarterstaff','1d6','钝击','simple',['versatile']),proficiency:'simple',conditional:['强化寒冷伤害']}),
  g('staff-arcane-blessing','奥术祝福法杖','Staff of Arcane Blessing',1,'melee','稀有','奥术塔','强化祝福效果并提供祝福施法。',['祝福','辅助','法杖'],{score:88,kind:'weapon',weapon:W('quarterstaff','1d6','钝击','simple',['versatile']),proficiency:'simple',grants:['Bless']}),
  g('titanstring-bow','泰坦弦弓','Titanstring Bow',1,'ranged','稀有','第一章商人','弓伤害额外利用力量修正，力量药剂体系核心。',['力量','远程','长弓'],{score:99,kind:'weapon',weapon:W('longbow','1d8','穿刺','martial',['two-handed','ranged']),proficiency:'longbow',conditional:['远程伤害加入力量修正']}),
  g('joltshooter','震击射手','The Joltshooter',1,'ranged','稀有','渥金休眠地奖励','远程命中获得闪电充能。',['远程','闪电充能'],{score:86,kind:'weapon',weapon:W('longbow','1d8','穿刺','martial',['two-handed','ranged']),proficiency:'longbow'}),
  g('adamantine-shield','精金盾牌','Adamantine Shield',1,'shield','非常稀有','精金熔炉','+2 AC 的精金盾，并降低暴击威胁。',['盾牌','AC','生存'],{score:95,kind:'shield',proficiency:'shield',rules:[R('ac_bonus',2)]}),
  g('safeguard-shield','守卫盾','Safeguard Shield',1,'shield','罕见','第一章商人','基础 +2 AC 并强化豁免。',['盾牌','豁免'],{score:80,kind:'shield',proficiency:'shield',rules:[R('ac_bonus',2),R('save_bonus',1)]}),

  // ACT II — head / cloak / armour
  g('helmet-arcane-acuity','奥术敏锐头盔','Helmet of Arcane Acuity',2,'head','非常稀有','石匠行会附近','武器命中叠加奥术敏锐，是武器+控制法术构筑核心。',['奥术敏锐','控制','核心'],{score:100,conditional:['武器命中获得奥术敏锐']}),
  g('hat-fire-acuity','火焰敏锐帽','Hat of Fire Acuity',2,'head','非常稀有','第二章战利品','造成火焰伤害时叠加奥术敏锐，火法控制核心。',['火焰','奥术敏锐','核心'],{score:100,conditional:['火焰伤害获得奥术敏锐']}),
  g('covert-cowl','隐秘兜帽','Covert Cowl',2,'head','稀有','终焉光芒附近','隐蔽时降低重击阈值，适合潜行暴击路线。',['重击','隐蔽'],{score:84,conditional:['隐蔽时重击阈值 -1']}),
  g('cloak-protection','防护斗篷','Cloak of Protection',2,'cloak','稀有','终焉光芒旅店 · 商人','AC +1，豁免 +1，任何构筑都实用。',['AC','豁免','泛用'],{score:98,rules:[R('ac_bonus',1),R('save_bonus',1)]}),
  g('cloak-elemental-absorption','元素吸收斗篷','Cloak of Elemental Absorption',2,'cloak','稀有','月出之塔区域','受到元素伤害后短时获得对应抗性与附伤联动。',['元素抗性','防御'],{score:83,conditional:['受元素伤害后触发抗性']}),
  g('potent-robe','强能长袍','Potent Robe',2,'armor','非常稀有','阿尔菲拉任务奖励','魅力施法者戏法核心长袍，并提供临时生命联动。',['魅力','戏法','核心'],{score:100,armor:A('clothing',10,null,null),conditional:['戏法伤害加入魅力调整值','回合开始获得临时生命']}),
  g('yuan-ti','元提鳞甲','Yuan-Ti Scale Mail',2,'armor','非常稀有','终焉光芒旅店 · 商人','15 基础 AC 的中甲，但允许完整敏捷加值。',['中甲','敏捷','AC'],{score:98,armor:A('medium',15,null,'medium',{uncappedDex:true})}),
  g('dark-justiciar-half','黑暗审判官半身甲','Dark Justiciar Half-Plate',2,'armor','非常稀有','莎尔试炼场','高防御中甲并支持隐蔽/黑暗路线。',['中甲','黑暗','隐蔽'],{score:88,armor:A('medium',16,2,'medium')}),
  g('dwarven-splintmail','矮人板条甲','Dwarven Splintmail',2,'armor','非常稀有','月出之塔 · 商人','高 AC 重甲并强化体质与生存。',['重甲','体质','生存'],{score:91,armor:A('heavy',19,0,'heavy'),rules:[R('ability_bonus',2,{ability:'con',cap:20})]}),
  g('flawed-helldusk','残缺狱火暮光甲','Flawed Helldusk Armour',2,'armor','非常稀有','达蒙锻造','重甲，火焰主题防御装备。',['重甲','火焰','防御'],{score:87,armor:A('heavy',18,0,'heavy')}),

  // ACT II — gloves / boots / jewellery
  g('balanced-hands','平衡之手手套','Gloves of the Balanced Hands',2,'gloves','稀有','终焉光芒旅店 · 商人','授予双武器战斗风格，双持构筑关键。',['双持','副手','武器'],{score:94,grants:['Two-Weapon Fighting']}),
  g('flawed-helldusk-gloves','残缺狱火暮光手套','Flawed Helldusk Gloves',2,'gloves','非常稀有','达蒙锻造','武器与徒手附加火焰/死灵伤害，并强化法术攻击。',['火焰','武器','徒手'],{score:94,conditional:['武器/徒手附加伤害'],rules:[R('spell_attack_bonus',1)]}),
  g('gloves-crushing','粉碎手套','Gloves of Crushing',2,'gloves','稀有','月出之塔区域','强化徒手命中与伤害，是武僧常用装备。',['武僧','徒手','命中'],{score:92,rules:[R('attack_bonus',1)],conditional:['徒手伤害 +2']}),
  g('dark-justiciar-gauntlets','黑暗审判官手套','Dark Justiciar Gauntlets',2,'gloves','稀有','莎尔试炼场','武器伤害附加死灵伤害。',['死灵','武器','附伤'],{score:85,conditional:['武器 +1d4 死灵']}),
  g('evasive-shoes','闪避之鞋','Evasive Shoes',2,'boots','稀有','终焉光芒旅店 · 商人','AC +1，并强化体操。',['AC','敏捷','泛用'],{score:92,rules:[R('ac_bonus',1)]}),
  g('boots-brilliance','辉煌之靴','Boots of Brilliance',2,'boots','稀有','第二章区域','吟游诗人可恢复诗人激励资源。',['吟游诗人','资源恢复'],{score:79,grants:['Restore Bardic Inspiration']}),
  g('spineshudder','脊椎震颤护符','Spineshudder Amulet',2,'amulet','非常稀有','月出之塔区域','远程法术攻击命中时施加回荡。',['回荡','法术攻击','核心'],{score:97,conditional:['远程法术攻击命中触发回荡']}),
  g('surgeon-subjugation','外科医生征服护符','Surgeon\'s Subjugation Amulet',2,'amulet','非常稀有','治疗之家','重击后可麻痹目标一次，爆发回合很强。',['重击','麻痹','爆发'],{score:95,conditional:['重击后可麻痹目标']}),
  g('harpers-amulet','竖琴手护符','Amulet of the Harpers',2,'amulet','非常稀有','终焉光芒旅店','提供护盾法术和感知豁免优势。',['护盾术','豁免','生存'],{score:94,grants:['Shield'],conditional:['感知豁免优势']}),
  g('spellcrux','法术核心护符','Spellcrux Amulet',2,'amulet','非常稀有','月出之塔监狱','可恢复任意等级法术位一次。',['法术位','资源恢复','施法'],{score:98,grants:['Spell Slot Restoration']}),
  g('risky-ring','风险戒指','Risky Ring',2,'ring','非常稀有','月出之塔 · 商人','攻击检定获得优势，但豁免检定劣势。',['优势','爆发','风险'],{score:100,conditional:['攻击检定优势','豁免检定劣势']}),
  g('callous-glow','无情光芒之戒','Callous Glow Ring',2,'ring','非常稀有','莎尔试炼场','对被照亮目标造成额外光耀伤害。',['光耀','附伤','核心'],{score:98,conditional:['对受光照目标 +2 光耀伤害']}),
  g('coruscation-ring','闪耀戒指','Coruscation Ring',2,'ring','稀有','终焉光芒旅店地窖','处于光照时法术伤害施加光耀宝珠。',['光耀宝珠','法术','控制'],{score:96,conditional:['光照下法术伤害施加光耀宝珠']}),
  g('mental-inhibition','精神抑制戒指','Ring of Mental Inhibition',2,'ring','稀有','第二章区域','敌人豁免失败后叠加精神疲劳。',['控制','豁免','精神疲劳'],{score:88,conditional:['敌人豁免失败触发 Mental Fatigue']}),
  g('snowburst','雪爆戒指','Snowburst Ring',2,'ring','稀有','终焉光芒旅店','造成寒冷伤害时在目标周围生成冰面。',['寒冷','冰面','控制'],{score:91,conditional:['寒冷伤害生成冰面']}),
  g('killers-sweetheart','杀手甜心','Killer\'s Sweetheart',2,'ring','非常稀有','莎尔试炼场','击杀后可把一次命中转为重击。',['重击','爆发'],{score:98,conditional:['击杀后获得强制重击机会']}),

  // ACT II — weapons / shields / ranged
  g('drakethroat','龙喉战刃','Drakethroat Glaive',2,'melee','非常稀有','月出之塔 · 商人','可给武器附加元素伤害与强化，常用于给其他武器上 Buff。',['元素武器','长柄','辅助'],{score:99,kind:'weapon',weapon:W('glaive','1d10','挥砍','martial',['two-handed','reach']),proficiency:'glaive',grants:['Draconic Elemental Weapon']}),
  g('charge-bound-warhammer','充能束缚战锤','Charge-Bound Warhammer',2,'melee','稀有','月出之塔区域','绑定给魔契武器或奥法骑士时显著强化。',['邪术师','奥法骑士','战锤'],{score:93,kind:'weapon',weapon:W('warhammer','1d8','钝击','martial',['versatile']),proficiency:'warhammer',conditional:['契约/绑定时额外强化']}),
  g('render-mind-body','身心撕裂者','Render of Mind and Body',2,'melee','稀有','第二章区域','拥有优势时附加心灵伤害。',['优势','心灵','短剑'],{score:88,kind:'weapon',weapon:W('shortsword','1d6','穿刺','martial',['light','finesse']),proficiency:'shortsword',conditional:['优势时附加心灵伤害']}),
  g('sword-life-stealing','夺命之剑','Sword of Life Stealing',2,'melee','非常稀有','终焉光芒旅店 · 商人','重击时附加死灵伤害并获得临时生命。',['重击','死灵','短剑'],{score:93,kind:'weapon',weapon:W('shortsword','1d6','穿刺','martial',['light','finesse']),proficiency:'shortsword',conditional:['重击额外死灵伤害与临时生命']}),
  g('halberd-vigilance','警戒戟','Halberd of Vigilance',2,'melee','非常稀有','月出之塔 · 商人','高质量长柄武器并强化先攻/反应能力。',['先攻','长柄','反应'],{score:95,kind:'weapon',weapon:W('halberd','1d10','挥砍','martial',['two-handed','reach']),proficiency:'halberd',rules:[R('initiative_bonus',1)]}),
  g('moonlight-glaive','月光战刃','Moonlight Glaive',2,'melee','非常稀有','暗影诅咒之地剧情','光耀主题长柄武器。',['光耀','长柄'],{score:88,kind:'weapon',weapon:W('glaive','1d10','挥砍','martial',['two-handed','reach']),proficiency:'glaive'}),
  g('shars-spear','莎尔黄昏之矛','Shar\'s Spear of Evening',2,'melee','传奇','莎尔剧情','黑暗体系传奇长矛，对黑暗构筑有独特加成。',['传奇','黑暗','长矛'],{score:99,kind:'weapon',weapon:W('spear','1d6','穿刺','simple',['versatile','thrown']),proficiency:'simple',conditional:['黑暗区域额外能力']}),
  g('selunes-spear','塞伦涅夜矛','Selûne\'s Spear of Night',2,'melee','传奇','暗夜之歌剧情','月光主题传奇长矛，提供光明与月系能力。',['传奇','光耀','长矛'],{score:95,kind:'weapon',weapon:W('spear','1d6','穿刺','simple',['versatile','thrown']),proficiency:'simple'}),
  g('darkfire-shortbow','暗火短弓','Darkfire Shortbow',2,'ranged','非常稀有','终焉光芒旅店 · 商人','提供火焰/寒冷抗性并可施放加速术。',['加速术','抗性','短弓'],{score:98,kind:'weapon',weapon:W('shortbow','1d6','穿刺','simple',['two-handed','ranged']),proficiency:'shortbow',grants:['Haste']}),
  g('neer-misser','绝不失手','Ne\'er Misser',2,'ranged','非常稀有','月出之塔 · 商人','手弩造成力场伤害，并提供魔法飞弹。',['手弩','力场','双持远程'],{score:96,kind:'weapon',weapon:W('hand-crossbow','1d6','力场','martial',['light','ranged','one-handed']),proficiency:'hand-crossbow',grants:['Magic Missile']}),
  g('hellfire-hand-crossbow','地狱火手弩','Hellfire Hand Crossbow',2,'ranged','非常稀有','尤格','高质量手弩并带火焰主题技能。',['手弩','火焰','双持远程'],{score:95,kind:'weapon',weapon:W('hand-crossbow','1d6','穿刺','martial',['light','ranged','one-handed']),proficiency:'hand-crossbow'}),
  g('ketheric-shield','凯瑟里克之盾','Ketheric\'s Shield',2,'shield','非常稀有','凯瑟里克','+2 AC，并提高法术攻击与法术 DC。',['盾牌','法术DC','施法'],{score:100,kind:'shield',proficiency:'shield',rules:[R('ac_bonus',2),R('spell_dc_bonus',1),R('spell_attack_bonus',1)]}),

  // ACT III — head / cloak / armour
  g('birthright','天赋权利','Birthright',3,'head','非常稀有','巫术杂货店','魅力 +2（上限可超过常规 20），魅力施法毕业头部之一。',['魅力','法术DC','核心'],{score:99,rules:[R('ability_bonus',2,{ability:'cha',cap:22})]}),
  g('hood-weave','织法兜帽','Hood of the Weave',3,'head','非常稀有','神秘卡里翁','显著提高法术攻击与法术 DC。',['法术DC','法术攻击','毕业'],{score:100,rules:[R('spell_dc_bonus',2),R('spell_attack_bonus',2)]}),
  g('helm-balduran','博德安之盔','Helm of Balduran',3,'head','传奇','安苏尔','AC 与豁免提高，并提供强力防御被动。',['传奇','AC','豁免','生存'],{score:100,rules:[R('ac_bonus',1),R('save_bonus',1)],conditional:['回合开始恢复生命','免疫眩晕','防止暴击']}),
  g('sarevok-helm','沙洛佛克角盔','Sarevok\'s Horned Helmet',3,'head','非常稀有','谋杀法庭','降低重击阈值，适合物理暴击构筑。',['重击','物理','毕业'],{score:99,rules:[R('crit_threshold',-1)]}),
  g('mask-soul-perception','灵魂感知面具','Mask of Soul Perception',3,'head','非常稀有','第三章区域','提高攻击、先攻与察觉。',['命中','先攻','察觉'],{score:96,rules:[R('attack_bonus',2),R('initiative_bonus',2)]}),
  g('pyroquickness','烈焰迅捷帽','Pyroquickness Hat',3,'head','非常稀有','巫术杂货店宝库','使用非戏法火焰法术后获得额外附赠动作，但自身受火焰伤害。',['火焰','附赠动作','爆发'],{score:98,conditional:['火焰法术触发额外附赠动作']}),
  g('cloak-weave','织法斗篷','Cloak of the Weave',3,'cloak','非常稀有','第三章商人','提高法术攻击与法术 DC，并提供元素吸收类能力。',['法术DC','法术攻击','毕业'],{score:99,rules:[R('spell_dc_bonus',1),R('spell_attack_bonus',1)]}),
  g('cloak-displacement','移位斗篷','Cloak of Displacement',3,'cloak','非常稀有','第三章商人','敌人对你的攻击更难命中，受伤后暂时失效。',['防御','闪避'],{score:97,conditional:['回合开始获得位移防御']}),
  g('shade-slayer-cloak','暗影杀手斗篷','Shade-Slayer Cloak',3,'cloak','非常稀有','第三章区域','隐蔽时降低重击阈值。',['重击','隐蔽'],{score:94,conditional:['隐蔽时重击阈值 -1']}),
  g('armour-agility','敏捷护甲','Armour of Agility',3,'armor','非常稀有','博德之门 · 商人','17 基础 AC 的中甲，完整敏捷加值，并提高豁免。',['中甲','敏捷','毕业'],{score:100,armor:A('medium',17,null,'medium',{uncappedDex:true}),rules:[R('save_bonus',2)]}),
  g('helldusk-armour','狱火暮光甲','Helldusk Armour',3,'armor','传奇','希望宅邸','21 AC 传奇重甲，穿戴者自动视为熟练，并提供火焰与减伤能力。',['传奇','重甲','毕业'],{score:100,armor:A('heavy',21,0,'heavy',{selfProficient:true}),conditional:['火焰抗性','受到伤害时反击']}),
  g('bhaalist-armour','巴尔信徒护甲','Bhaalist Armour',3,'armor','非常稀有','谋杀法庭','轻甲并拥有谋杀光环，使附近敌人更易受到穿刺伤害。',['穿刺','光环','爆发'],{score:100,armor:A('light',14,null,'light'),conditional:['附近敌人穿刺易伤光环']}),
  g('robe-weave','织法长袍','Robe of the Weave',3,'armor','非常稀有','拉玛吉斯高塔','提高 AC、法术攻击和法术 DC，是纯施法毕业法袍。',['施法','AC','法术DC','毕业'],{score:100,armor:A('clothing',10,null,null),rules:[R('ac_bonus',2),R('spell_dc_bonus',1),R('spell_attack_bonus',1)]}),
  g('bonespike-garb','骨刺服','Bonespike Garb',3,'armor','非常稀有','第三章商人','无甲野蛮人终局装备，强化狂暴与伤害减免。',['野蛮人','无甲','狂暴'],{score:95,armor:A('clothing',10,null,null),conditional:['狂暴相关防御与反伤']}),

  // ACT III — gloves / boots / jewellery
  g('gauntlets-hill-giant','山丘巨人力量护手','Gauntlets of Hill Giant Strength',3,'gloves','非常稀有','希望宅邸','将力量提高到 23。',['力量','属性设定','毕业'],{score:100,rules:[R('ability_floor',23,{ability:'str'})]}),
  g('legacy-masters','大师遗产','Legacy of the Masters',3,'gloves','非常稀有','第三章商人','武器攻击与武器伤害 +2，稳定物理输出毕业手套。',['命中','武器伤害','毕业'],{score:100,rules:[R('attack_bonus',2),R('weapon_damage_bonus',2)]}),
  g('helldusk-gloves','狱火暮光手套','Helldusk Gloves',3,'gloves','非常稀有','希望宅邸','提高法术攻击与法术 DC，并为武器/徒手提供额外伤害。',['法术DC','武器','徒手'],{score:99,rules:[R('spell_dc_bonus',1),R('spell_attack_bonus',1)],conditional:['武器/徒手额外火焰或死灵伤害']}),
  g('soul-catching','灵魂捕捉手套','Gloves of Soul Catching',3,'gloves','传奇','希望宅邸任务','徒手构筑毕业手套，附加力场伤害并可恢复生命。',['武僧','徒手','传奇'],{score:100,conditional:['徒手 +1d10 力场','徒手命中可恢复生命或获得优势']}),
  g('spellmight','法术强能手套','Spellmight Gloves',3,'gloves','非常稀有','马戏团任务','法术攻击可承受命中惩罚换取额外伤害。',['法术攻击','爆发','高风险'],{score:96,conditional:['法术攻击 -5 命中换 +1d8 伤害']}),
  g('craterflesh','裂肉手套','Craterflesh Gloves',3,'gloves','非常稀有','谋杀法庭','重击时额外造成力场伤害，适合暴击流。',['重击','力场','爆发'],{score:98,conditional:['重击额外力场伤害']}),
  g('helldusk-boots','狱火暮光长靴','Helldusk Boots',3,'boots','非常稀有','戈塔什区域','提供强力位移与控制免疫能力。',['位移','生存','终局'],{score:98,grants:['Hellcrawler']}),
  g('boots-persistence','坚毅之靴','Boots of Persistence',3,'boots','非常稀有','第三章商人','提供长期机动与自由移动类效果。',['机动','自由行动','毕业'],{score:97,conditional:['长期移动与自由行动增益']}),
  g('bonespike-boots','骨刺长靴','Bonespike Boots',3,'boots','非常稀有','第三章区域','无甲/无盾时强化 AC 与跳跃，野蛮人/武僧可用。',['无甲','跳跃','AC'],{score:92,conditional:['无甲无盾时 AC +1']}),
  g('amulet-health','强健护符','Amulet of Greater Health',3,'amulet','非常稀有','希望宅邸','将体质提高到 23，并强化体质豁免相关表现。',['体质','生命','专注','毕业'],{score:100,rules:[R('ability_floor',23,{ability:'con'})],conditional:['体质豁免优势']}),
  g('amulet-devout','虔诚护符','Amulet of the Devout',3,'amulet','非常稀有','风暴海岸礼拜堂','法术 DC +2，并提供额外神力引导资源。',['牧师','法术DC','神力引导'],{score:100,rules:[R('spell_dc_bonus',2)],grants:['Additional Channel Divinity']}),
  g('fey-semblance','妖精外貌护符','Fey Semblance Amulet',3,'amulet','非常稀有','鬼婆相关任务','智力、感知、魅力豁免优势。',['豁免','防御'],{score:91,conditional:['INT/WIS/CHA 豁免优势']}),
  g('khalids-gift','卡立德的礼物','Khalid\'s Gift',3,'amulet','非常稀有','贾希拉住宅','感知 +1，并提供情绪/控制相关防御。',['感知','防御'],{score:91,rules:[R('ability_bonus',1,{ability:'wis',cap:21})]}),
  g('band-mystic-scoundrel','神秘恶棍戒指','Band of the Mystic Scoundrel',3,'ring','非常稀有','第三章丛林','武器命中后可用附赠动作施放幻术/惑控法术，剑诗人核心。',['附赠动作','幻术','惑控','核心'],{score:100,conditional:['武器命中后幻术/惑控法术可用附赠动作施放']}),
  g('ring-regeneration','再生戒指','Ring of Regeneration',3,'ring','非常稀有','巫术杂货店','每回合恢复生命，可触发治疗联动装备。',['治疗','每回合','联动'],{score:97,conditional:['每回合恢复生命']}),
  g('feywild-sparks','妖精荒野火花戒指','Ring of Feywild Sparks',3,'ring','非常稀有','洛若坎区域','狂野魔法术士相关装备，提高浪涌触发特色。',['术士','狂野魔法'],{score:82,conditional:['狂野魔法浪涌联动']}),
  g('free-action','自由行动戒指','Ring of Free Action',2,'ring','稀有','月出之塔 · 商人','忽略困难地形并防止部分束缚/麻痹。',['机动','控制免疫'],{score:88,conditional:['困难地形无视与部分控制免疫']}),

  // ACT III — weapons / shields / ranged
  g('markoheshkir','玛科赫什基','Markoheshkir',3,'melee','传奇','拉玛吉斯高塔','施法毕业法杖：法术攻击/DC +1，提供奥术电池和元素恩赐。',['传奇','施法','法术DC','毕业'],{score:100,kind:'weapon',weapon:W('quarterstaff','1d6','钝击','simple',['versatile']),proficiency:'simple',rules:[R('spell_dc_bonus',1),R('spell_attack_bonus',1)],grants:['Arcane Battery','Kereska\'s Favour']}),
  g('staff-spellpower','法术力量法杖','Staff of Spellpower',3,'melee','非常稀有','希望宅邸','法术攻击/DC +1，并提供奥术电池。',['施法','法术DC','奥术电池'],{score:99,kind:'weapon',weapon:W('quarterstaff','1d6','钝击','simple',['versatile']),proficiency:'simple',rules:[R('spell_dc_bonus',1),R('spell_attack_bonus',1)],grants:['Arcane Battery']}),
  g('rhapsody','狂想曲','Rhapsody',3,'melee','非常稀有','卡扎多尔','击杀可积累猩红恶作剧层数，强化攻击、伤害和法术 DC。',['叠层','法术DC','爆发'],{score:100,kind:'weapon',weapon:W('dagger','1d4','穿刺','simple',['light','finesse']),proficiency:'simple',conditional:['击杀叠层：攻击/伤害/法术DC提高']}),
  g('nyrulna','尼鲁纳','Nyrulna',3,'melee','传奇','第三章丛林','传奇三叉戟，投掷后返回并造成范围雷鸣伤害。',['投掷','雷鸣','传奇'],{score:100,kind:'weapon',weapon:W('trident','1d8','穿刺','martial',['versatile','thrown']),proficiency:'trident',conditional:['投掷返回并造成范围雷鸣伤害']}),
  g('baldurans-giantslayer','博德安巨人杀手','Balduran\'s Giantslayer',3,'melee','传奇','安苏尔','传奇巨剑，力量收益高并对大型目标强势。',['力量','双手','传奇'],{score:100,kind:'weapon',weapon:W('greatsword','2d6','挥砍','martial',['two-handed','heavy']),proficiency:'greatsword',conditional:['伤害额外利用力量调整值']}),
  g('bloodthirst','嗜血','Bloodthirst',3,'melee','传奇','奥林','传奇匕首，主手降低重击阈值，副手提供不同防御/反击效果。',['重击','匕首','传奇'],{score:100,kind:'weapon',weapon:W('dagger','1d4','穿刺','simple',['light','finesse']),proficiency:'simple',rules:[R('crit_threshold',-1,{hand:'main'})]}),
  g('crimson-mischief','猩红恶作剧','Crimson Mischief',3,'melee','传奇','奥林','传奇短剑，优势攻击与副手玩法具有额外收益。',['优势','双持','传奇'],{score:100,kind:'weapon',weapon:W('shortsword','1d6','穿刺','martial',['light','finesse']),proficiency:'shortsword',conditional:['优势时额外伤害','副手特殊加成']}),
  g('duellists-prerogative','决斗者特权','Duellist\'s Prerogative',3,'melee','传奇','拯救范拉任务','空副手时发挥完整威力的传奇刺剑，提供额外反应与攻击。',['决斗','刺剑','传奇'],{score:100,kind:'weapon',weapon:W('rapier','1d8','穿刺','martial',['finesse']),proficiency:'rapier',conditional:['副手为空时完整生效']}),
  g('silver-sword-astral','星界银剑','Silver Sword of the Astral Plane',3,'melee','传奇','沃斯剧情','吉斯洋基角色使用时具有强力心灵与防御加成。',['吉斯洋基','双手','传奇'],{score:99,kind:'weapon',weapon:W('greatsword','2d6','挥砍','martial',['two-handed','heavy']),proficiency:'greatsword',conditional:['吉斯洋基专属额外加成']}),
  g('devotees-mace','信徒钉头锤','Devotee\'s Mace',3,'melee','传奇','神圣干预','传奇钉头锤，提供强力团队治疗光环。',['治疗','牧师','传奇'],{score:96,kind:'weapon',weapon:W('mace','1d6','钝击','simple',[]),proficiency:'simple',grants:['Healing Incense Aura']}),
  g('dolor-amarus','苦痛之刃','Dolor Amarus',3,'melee','非常稀有','巴尔信徒','重击伤害强化，暴击流常用匕首。',['重击','匕首','附伤'],{score:96,kind:'weapon',weapon:W('dagger','1d4','穿刺','simple',['light','finesse']),proficiency:'simple',conditional:['重击额外伤害']}),
  g('gontr-mael','贡特尔·梅尔','Gontr Mael',3,'ranged','传奇','钢铁卫士铸造厂','传奇长弓，命中、引导箭与加速相关能力强。',['长弓','传奇','加速'],{score:100,kind:'weapon',weapon:W('longbow','1d8','穿刺','martial',['two-handed','ranged']),proficiency:'longbow',grants:['Celestial Haste']}),
  g('dead-shot','致命一击','The Dead Shot',3,'ranged','非常稀有','博德之门 · 商人','强化远程命中并降低重击阈值。',['重击','远程','长弓'],{score:100,kind:'weapon',weapon:W('longbow','1d8','穿刺','martial',['two-handed','ranged']),proficiency:'longbow',rules:[R('crit_threshold',-1)]}),
  g('hellfire-engine-crossbow','地狱火引擎弩','Hellfire Engine Crossbow',3,'ranged','非常稀有','钢铁卫士相关制作','重型十字弩并提供特殊火焰/牵引技能。',['重弩','火焰','技能'],{score:91,kind:'weapon',weapon:W('heavy-crossbow','1d10','穿刺','martial',['two-handed','ranged']),proficiency:'heavy-crossbow'}),
  g('viconia-fortress','维康妮亚行走堡垒','Viconia\'s Walking Fortress',3,'shield','传奇','悲伤之邸','传奇盾牌，+3 AC 并提供强力法术防护。',['盾牌','传奇','防御'],{score:100,kind:'shield',proficiency:'shield',rules:[R('ac_bonus',3)],conditional:['法术豁免与反射类防护']}),
  g('shield-undevout','不虔之盾','Shield of the Undevout',3,'shield','非常稀有','第三章区域','提高法术 DC 并强化恐惧类法术。',['盾牌','法术DC','恐惧'],{score:95,kind:'shield',proficiency:'shield',rules:[R('ac_bonus',2),R('spell_dc_bonus',1)],conditional:['恐惧类法术强化']})
];

const curatedIds=new Set(curatedEquipmentItems.map(item=>item.id));
export const equipmentItems=[...curatedEquipmentItems,...generatedEquipmentItems.filter(item=>item?.id&&!curatedIds.has(item.id))];
export const catalogMeta={schema:EQUIPMENT_SCHEMA_VERSION,curated:curatedEquipmentItems.length,generated:generatedEquipmentItems.length,generatedSource:generatedEquipmentMeta};

export const equipmentById=id=>equipmentItems.find(item=>item.id===id)||null;
export function slotsForItem(item){
  if(!item)return[];
  if(item.slotType==='ring')return['ring1','ring2'];
  if(item.slotType==='melee')return['main','off'];
  if(item.slotType==='shield')return['off'];
  if(item.slotType==='ranged')return item.weapon?.type==='hand-crossbow'?['rangedMain','rangedOff']:['rangedMain'];
  return[item.slotType];
}
export function itemsForSlot(slot){return equipmentItems.filter(item=>slotsForItem(item).includes(slot));}
export const catalogStats={
  total:equipmentItems.length,
  byAct:Object.fromEntries([1,2,3].map(act=>[act,equipmentItems.filter(x=>x.act===act).length])),
  byKind:Object.fromEntries(['wearable','weapon','shield'].map(kind=>[kind,equipmentItems.filter(x=>x.kind===kind).length]))
};
