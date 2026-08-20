#!/usr/bin/env node
/**
 * V8.2 BG3 Forge -> equipment-generated.js importer.
 *
 * Usage:
 *   node tools/import-bg3forge-items.mjs path/to/items.json [assets/v8/equipment-generated.js]
 *
 * The importer is intentionally schema-tolerant: it looks for common item-export keys,
 * only keeps rows that can be mapped to an equippable slot, and writes a report next to
 * the generated module. Unknown/passive-heavy effects remain as conditional text instead
 * of being converted to fake numeric bonuses.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const input=process.argv[2];
const here=path.dirname(fileURLToPath(import.meta.url));
const defaultOut=path.resolve(here,'../assets/v8/equipment-generated.js');
const output=path.resolve(process.argv[3]||defaultOut);
if(!input){console.error('Usage: node tools/import-bg3forge-items.mjs <items.json> [output.js]');process.exit(1)}
const raw=JSON.parse(fs.readFileSync(path.resolve(input),'utf8'));
const rows=Array.isArray(raw)?raw:Array.isArray(raw.items)?raw.items:Array.isArray(raw.data)?raw.data:Object.values(raw||{}).filter(v=>v&&typeof v==='object');

const text=(obj,keys)=>{for(const key of keys){const v=obj?.[key];if(v!==undefined&&v!==null&&String(v).trim())return String(v).trim()}return''};
const num=(obj,keys)=>{for(const key of keys){const v=Number(obj?.[key]);if(Number.isFinite(v))return v}return null};
const arr=(v)=>Array.isArray(v)?v:v==null?[]:typeof v==='string'?v.split(/[;,|]/).map(x=>x.trim()).filter(Boolean):[v];
const slug=s=>String(s||'item').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'item';
const uniq=a=>[...new Set(a.filter(Boolean))];

function hay(row){return JSON.stringify(row).toLowerCase()}
function slotOf(row){
  const h=hay(row),slot=text(row,['slot','equipment_slot','equipmentSlot','slot_name','slotName','wearing_slot','wearingSlot']).toLowerCase();
  const s=`${slot} ${h}`;
  if(/helmet|headwear|head slot|circlet|hat|hood|helm/.test(s))return'head';
  if(/cloak|cape|mantle/.test(s))return'cloak';
  if(/glove|gauntlet/.test(s))return'gloves';
  if(/boot|shoe/.test(s))return'boots';
  if(/amulet|necklace|neck slot/.test(s))return'amulet';
  if(/ring/.test(s))return'ring';
  if(/shield/.test(s))return'shield';
  if(/longbow|shortbow|crossbow|hand crossbow|bow/.test(s))return'ranged';
  if(/weapon|sword|dagger|mace|hammer|axe|staff|quarterstaff|spear|pike|halberd|glaive|trident|club|rapier|scimitar|flail|morningstar/.test(s))return'melee';
  if(/armour|armor|robe|clothing|breastplate|mail|plate|leather/.test(s))return'armor';
  return'';
}
function actOf(row){
  const explicit=num(row,['act','chapter']);if(explicit&&explicit>=1&&explicit<=3)return explicit;
  const h=hay(row);if(/act\s*iii|act\s*3|lower city|baldur.?s gate|rivington|wyrm/.test(h))return 3;
  if(/act\s*ii|act\s*2|shadow.cursed|moonrise|last light|gauntlet of shar/.test(h))return 2;
  return 1;
}
function rarityOf(row){
  const r=text(row,['rarity','rarity_name','rarityName','quality']).toLowerCase();
  if(/legend/.test(r))return'传奇';if(/very rare|veryrare/.test(r))return'非常稀有';if(/rare/.test(r))return'稀有';if(/uncommon/.test(r))return'罕见';return'普通';
}
function weaponOf(row,h){
  if(!/melee|ranged/.test(slotOf(row)))return null;
  const type=text(row,['weapon_type','weaponType','type_name','typeName','weapon_group','weaponGroup'])||inferWeaponType(h);
  const damage=text(row,['damage','damage_dice','damageDice','weapon_damage','weaponDamage']);
  const category=/martial/.test(h)?'martial':'simple';
  const props=[];if(/two.?handed/.test(h))props.push('two-handed');if(/light/.test(h))props.push('light');if(/finesse/.test(h))props.push('finesse');if(/versatile/.test(h))props.push('versatile');if(/thrown/.test(h))props.push('thrown');if(/reach/.test(h))props.push('reach');if(/ranged|bow|crossbow/.test(h))props.push('ranged');if(/hand crossbow/.test(h))props.push('one-handed','light');
  return{type:slug(type).replaceAll('-','_'),damage:damage||'',damageType:text(row,['damage_type','damageType'])||'',category,properties:uniq(props)};
}
function inferWeaponType(h){for(const t of ['hand crossbow','heavy crossbow','light crossbow','longbow','shortbow','greatsword','longsword','shortsword','rapier','scimitar','dagger','mace','warhammer','maul','greataxe','battleaxe','handaxe','quarterstaff','staff','spear','pike','halberd','glaive','trident','club','flail','morningstar'])if(h.includes(t))return t;return'weapon'}
function armorOf(row,h){
  if(slotOf(row)!=='armor')return null;
  const base=num(row,['armor_class','armorClass','ac','base_ac','baseAC']);
  const type=/heavy/.test(h)?'heavy':/medium/.test(h)?'medium':/light/.test(h)?'light':'clothing';
  return{type,baseAC:base??(type==='heavy'?18:type==='medium'?15:type==='light'?12:10),dexCap:type==='heavy'?0:type==='medium'?2:null,proficiency:type==='clothing'?null:type};
}
function conditionalText(row){
  const vals=[];
  for(const key of ['description','description_text','descriptionText','passives','passive','boosts','boost','properties','effects','effect','special','tooltip']){
    const v=row?.[key];if(v==null)continue;if(typeof v==='string')vals.push(v);else if(Array.isArray(v))vals.push(...v.map(x=>typeof x==='string'?x:JSON.stringify(x)));else vals.push(JSON.stringify(v));
  }
  return uniq(vals.map(x=>x.replace(/\s+/g,' ').trim()).filter(x=>x.length>2)).slice(0,8);
}
function normalize(row,index){
  const slotType=slotOf(row);if(!slotType)return null;
  const name=text(row,['display_name','displayName','name','localized_name','localizedName','title'])||`Imported Item ${index+1}`;
  const en=text(row,['english_name','englishName','name_en','nameEn','name'])||name;
  const uuid=text(row,['uuid','id','guid','root_template','rootTemplate']);
  const id=`forge-${slug(en)}-${crypto.createHash('sha1').update(uuid||`${en}-${index}`).digest('hex').slice(0,8)}`;
  const h=hay(row),weapon=weaponOf(row,h),armor=armorOf(row,h),kind=slotType==='shield'?'shield':weapon?'weapon':'wearable';
  const source=text(row,['source','location','where','obtained_from','obtainedFrom','source_name','sourceName'])||'BG3 Forge import';
  const cond=conditionalText(row);
  const summary=cond[0]||'由外部 BG3 数据导入；复杂效果保留为条件文本，等待人工规则映射。';
  const tags=uniq([slotType,armor?.type,weapon?.type,rarityOf(row)]).slice(0,6);
  return{id,name,en,act:actOf(row),slotType,rarity:rarityOf(row),source,summary,tags,score:60,kind,image:'',armor,weapon,rules:[],conditional:cond,grants:[],notes:`Imported source id: ${uuid||'n/a'}`,proficiency:slotType==='shield'?'shield':weapon?.category==='martial'?weapon.type:armor?.proficiency||null,sourceType:'forge',region:'',quality:'imported'};
}
const mapped=[],rejected=[];
rows.forEach((row,i)=>{const n=normalize(row,i);n?mapped.push(n):rejected.push({index:i,name:text(row,['name','display_name','displayName'])||'',reason:'unmapped-slot'})});
const dedup=[...new Map(mapped.map(x=>[x.id,x])).values()];
const code=`/* Generated by tools/import-bg3forge-items.mjs. Do not hand edit. */\nexport const generatedEquipmentItems=${JSON.stringify(dedup,null,2)};\nexport const generatedEquipmentMeta=${JSON.stringify({source:path.basename(input),count:dedup.length,sourceRows:rows.length,rejected:rejected.length,generatedAt:new Date().toISOString()},null,2)};\n`;
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,code);
const report={input:path.resolve(input),output,sourceRows:rows.length,generated:dedup.length,rejected:rejected.length,byAct:Object.fromEntries([1,2,3].map(a=>[a,dedup.filter(x=>x.act===a).length])),bySlot:Object.fromEntries([...new Set(dedup.map(x=>x.slotType))].sort().map(s=>[s,dedup.filter(x=>x.slotType===s).length])),rejectedSample:rejected.slice(0,100)};
fs.writeFileSync(output.replace(/\.js$/,'-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
