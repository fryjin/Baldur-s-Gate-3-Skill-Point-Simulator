const failureKey='bg3-v8-equipment-image-failures-v2';
let failures=new Set();try{failures=new Set(JSON.parse(sessionStorage.getItem(failureKey)||'[]'))}catch{}
let observer=null;
const save=()=>{try{sessionStorage.setItem(failureKey,JSON.stringify([...failures].slice(-1200)))}catch{}};
const fileUrl=file=>`https://bg3.wiki/wiki/Special:FilePath/${encodeURIComponent(file)}`;
const baseName=item=>String(item?.en||item?.name||'').trim().replace(/\s+/g,'_');
export function equipmentImageCandidates(item){const base=baseName(item),hdBase=`./assets/hd/equipment/${item.id}`,localBase=`./assets/equipment/${item.id}`;return[
  `${hdBase}.webp`,`${hdBase}.png`,`${hdBase}.jpg`,
  fileUrl(`${base}_Faded.png`),fileUrl(`${base}_Faded.webp`),
  item.image||'',`${localBase}.webp`,`${localBase}.png`,
  fileUrl(`${base}_Icon.png`),fileUrl(`${base}_Icon.webp`),
  fileUrl(`${base}_Unfaded_Icon.png`),fileUrl(`${base}_Unfaded_Icon.webp`),fileUrl(`${base}_Item_Icon.png`)
].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i&&!failures.has(x))}
const enc=list=>encodeURIComponent(JSON.stringify(list));
const dec=value=>{try{return JSON.parse(decodeURIComponent(value||''))}catch{return[]}};
export function equipmentImageTag(item,className='v82-equipment-image',alt=''){const list=equipmentImageCandidates(item);return`<img class="${className}" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="${alt||item.name+'图标'}" decoding="async" loading="lazy" referrerpolicy="no-referrer" data-equipment-candidates="${enc(list)}">`}
function load(img){if(img.dataset.loading)return;const list=dec(img.dataset.equipmentCandidates);if(!list.length)return;img.dataset.loading='1';let i=0;const next=()=>{if(i>=list.length){img.classList.add('image-missing');img.removeAttribute('data-equipment-candidates');delete img.dataset.loading;return}const src=list[i++];const ok=()=>{cleanup();img.classList.add('is-loaded');img.removeAttribute('data-equipment-candidates');delete img.dataset.loading};const fail=()=>{failures.add(src);save();cleanup();next()};const cleanup=()=>{img.removeEventListener('load',ok);img.removeEventListener('error',fail)};img.addEventListener('load',ok,{once:true});img.addEventListener('error',fail,{once:true});img.src=src};next()}
export function bindEquipmentImageFallbacks(root=document){const imgs=[...root.querySelectorAll('img[data-equipment-candidates]')];if(!('IntersectionObserver'in window)){imgs.forEach(load);return}observer??=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){observer.unobserve(e.target);load(e.target)}}),{rootMargin:'260px 0px'});imgs.forEach(img=>observer.observe(img))}
