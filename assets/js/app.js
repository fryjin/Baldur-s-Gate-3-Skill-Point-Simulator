import{parseRoute,subscribeRoute,navigate}from"./router.js";
import{subscribe,getBuild}from"./store.js";
import{activeSteps,lastActiveStep}from"./components/shell.js";
import{renderHome}from"./views/home-view.js";
import{renderLevel}from"./views/level-view.js";
import{renderRoute}from"./views/route-view.js";
import{renderProgression}from"./views/progression-view.js";
import{renderAbilities}from"./views/abilities-view.js";
import{renderSkills}from"./views/skills-view.js";
import{renderFeatures}from"./views/features-view.js";
import{renderSpells}from"./views/spells-view.js";
import{renderCharacter}from"./views/character-view.js";
import{renderLibrary}from"./views/library-view.js";
import{renderMobileBuild}from"./mobile/mobile-build-view.js";

let route=parseRoute();
const mobileQuery=matchMedia("(max-width:767px)");
function isMobile(){return mobileQuery.matches}
function syncViewport(){const vv=window.visualViewport,height=vv?.height||window.innerHeight,offset=vv?.offsetTop||0,keyboard=Math.max(0,window.innerHeight-height-offset);document.documentElement.style.setProperty("--app-height",`${height}px`);document.documentElement.style.setProperty("--keyboard-inset",`${keyboard}px`);document.body.classList.toggle("keyboard-open",keyboard>120)}
syncViewport();window.visualViewport?.addEventListener("resize",syncViewport,{passive:true});window.visualViewport?.addEventListener("scroll",syncViewport,{passive:true});window.addEventListener("orientationchange",()=>setTimeout(()=>{syncViewport();render()},120),{passive:true});mobileQuery.addEventListener?.("change",()=>{document.getElementById("overlay-root").innerHTML="";render()});

function render(){
  route=parseRoute();
  document.body.dataset.viewport=isMobile()?"mobile":"desktop";
  const characterRoute=route.view==="character";
  document.documentElement.classList.toggle("character-route-active",characterRoute);
  document.body.classList.toggle("character-route-active",characterRoute);
  if(route.view==="home")return renderHome();
  if(route.view==="library")return renderLibrary(route.section);
  if(route.view==="character"){const build=getBuild(route.id);return build?renderCharacter(build):navigate("/home")}
  if(route.view==="build"){
    const build=getBuild(route.id);if(!build)return navigate("/home");
    const active=activeSteps(build),allowed=new Set(active.map(x=>x[0]));
    if(route.step==="review"||!allowed.has(route.step)){navigate(`/build/${build.id}/${lastActiveStep(build)}`);return}
    if(isMobile())return renderMobileBuild(build,route.step);
    const views={level:renderLevel,route:renderRoute,progression:renderProgression,abilities:renderAbilities,skills:renderSkills,features:renderFeatures,spells:renderSpells};
    return(views[route.step]||renderLevel)(build);
  }
  renderHome();
}
subscribeRoute(render);subscribe(render);if(!location.hash)navigate("/home");else render();
