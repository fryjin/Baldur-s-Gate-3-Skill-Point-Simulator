import{equipmentHdAssets}from"../js/data/hd-asset-manifest.js";
import{equipmentById}from"./equipment-catalog.js";

const failureKey="bg3-v8-equipment-image-failures-v3";
let failures=new Set();try{failures=new Set(JSON.parse(sessionStorage.getItem(failureKey)||"[]"))}catch{}
let observer=null;
const save=()=>{try{sessionStorage.setItem(failureKey,JSON.stringify([...failures].slice(-1200)))}catch{}};
const placeholder="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
const fileUrl=file=>`https://bg3.wiki/wiki/Special:FilePath/${encodeURIComponent(file)}`;
const baseName=item=>String(item?.en||item?.name||"").trim().replace(/\s+/g,"_");

export function equipmentImageCandidates(item){
  const base=baseName(item),localBase=`./assets/equipment/${item.id}`;
  return[
    fileUrl(`${base}_Faded.png`),fileUrl(`${base}_Faded.webp`),
    item.image||"",`${localBase}.webp`,`${localBase}.png`,
    fileUrl(`${base}_Icon.png`),fileUrl(`${base}_Icon.webp`),
    fileUrl(`${base}_Unfaded_Icon.png`),fileUrl(`${base}_Unfaded_Icon.webp`),fileUrl(`${base}_Item_Icon.png`)
  ].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i&&!failures.has(x))
}
function tryList(img,list){
  let i=0;
  const next=()=>{
    if(i>=list.length){img.src=placeholder;img.classList.add("image-missing");return}
    const src=list[i++];
    const ok=()=>{cleanup();img.classList.add("is-loaded")};
    const fail=()=>{failures.add(src);save();cleanup();next()};
    const cleanup=()=>{img.removeEventListener("load",ok);img.removeEventListener("error",fail)};
    img.addEventListener("load",ok,{once:true});
    img.addEventListener("error",fail,{once:true});
    img.src=src
  };
  next()
}
function bindPrimary(img){
  if(img.dataset.primaryBound)return;
  img.dataset.primaryBound="1";
  img.addEventListener("load",()=>img.classList.add("is-loaded"),{once:true});
  img.addEventListener("error",()=>{
    const item=equipmentById(img.dataset.equipmentKey);
    img.src=placeholder;
    tryList(img,item?equipmentImageCandidates(item):[])
  },{once:true})
}
function loadDeferred(img){
  if(img.dataset.loading)return;
  img.dataset.loading="1";
  const item=equipmentById(img.dataset.equipmentKey);
  tryList(img,item?equipmentImageCandidates(item):[]);
  delete img.dataset.loading
}
export function equipmentImageTag(item,className="v82-equipment-image",alt=""){
  const primary=equipmentHdAssets[item.id]||"",eager=className.includes("detail"),src=primary||placeholder;
  return`<img class="${className}" src="${src}" alt="${alt||item.name+"图标"}" width="96" height="96" decoding="async" loading="${eager?"eager":"lazy"}" fetchpriority="${eager?"high":"low"}" referrerpolicy="no-referrer" data-equipment-key="${item.id}" ${primary?'data-equipment-primary="1"':'data-equipment-pending="1"'}>`
}
export function bindEquipmentImageFallbacks(root=document){
  const primary=[...root.querySelectorAll("img[data-equipment-primary]")];primary.forEach(bindPrimary);
  const pending=[...root.querySelectorAll("img[data-equipment-pending]")];
  if(!pending.length)return;
  if(!("IntersectionObserver"in window)){pending.forEach(loadDeferred);return}
  observer??=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){observer.unobserve(e.target);loadDeferred(e.target)}}),{rootMargin:"180px 0px"});
  pending.forEach(img=>observer.observe(img))
}
