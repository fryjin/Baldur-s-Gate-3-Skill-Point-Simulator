const isDesktop=()=>matchMedia('(min-width:768px)').matches;
const isSpellRoute=()=>{const parts=(location.hash||'').replace(/^#\/?/,'').split('/').filter(Boolean);return parts[0]==='build'&&parts[2]==='spells'};
let queued=false,applying=false;

function restructureLearning(){
  const panel=document.querySelector('.m24-learning-panel');
  if(!panel||panel.querySelector(':scope > .m28-learning-layout'))return;
  const grid=panel.querySelector(':scope > .m24-node-grid');
  if(!grid)return;
  const nodes=[...grid.querySelectorAll(':scope > .m24-node')];
  if(!nodes.length)return;
  const active=nodes.find(node=>node.classList.contains('active'))||nodes[0];
  const layout=document.createElement('div');layout.className='m28-learning-layout';
  const current=document.createElement('div');current.className='m28-current-node';
  current.innerHTML='<span class="m28-current-node-label">当前学习节点</span>';
  const others=document.createElement('div');others.className='m28-other-nodes';
  others.innerHTML='<span class="m28-other-node-label">其他学习节点</span>';
  const otherGrid=document.createElement('div');otherGrid.className='m28-other-node-grid';
  current.append(active);
  nodes.filter(node=>node!==active).forEach(node=>otherGrid.append(node));
  others.append(otherGrid);layout.append(current,others);
  grid.after(layout);
}

function foldRightLearning(){
  document.querySelectorAll('.m24-learning-result').forEach(section=>{
    if(section.querySelector(':scope > .m28-learning-details'))return;
    const nodes=section.querySelector(':scope > .m24-result-nodes');
    if(!nodes)return;
    const details=document.createElement('details');details.className='m28-learning-details';
    const summary=document.createElement('summary');summary.textContent='查看逐级学习明细';
    nodes.after(details);details.append(summary,nodes);
  });
}

function apply(){
  if(applying)return;applying=true;
  try{
    const active=isDesktop()&&isSpellRoute();
    document.body.classList.toggle('m28-spell-page',active);
    if(active){restructureLearning();foldRightLearning()}
  }finally{applying=false}
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})}

new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
window.addEventListener('hashchange',schedule);
window.addEventListener('resize',schedule,{passive:true});
schedule();
