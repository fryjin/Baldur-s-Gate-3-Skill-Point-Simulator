import{parseRoute,subscribeRoute,navigate}from"./router.js";
import{subscribe,getBuild}from"./store.js";
import{renderHome}from"./views/home-view.js";
import{renderLevel}from"./views/level-view.js";
import{renderRoute}from"./views/route-view.js";
import{renderSpells}from"./views/spells-view.js";
import{renderPlaceholder}from"./views/placeholder-view.js";
import{renderSimple}from"./views/simple-view.js";
let route=parseRoute();
function render(){route=parseRoute();if(route.view==='home')return renderHome();if(route.view==='library')return renderSimple('资料库将在下一阶段迁移','V7 将把完整法术、技能、专长、职业与子职业资料从构筑向导中拆分出来。');if(route.view==='character')return renderSimple('完整角色纸将在下一阶段迁移','角色纸将作为独立全屏视图，不再永久挤占构筑界面。');if(route.view==='build'){const build=getBuild(route.id);if(!build)return navigate('/home');if(route.step==='level')return renderLevel(build);if(route.step==='route')return renderRoute(build);if(route.step==='spells')return renderSpells(build);return renderPlaceholder(build,route.step)}renderHome()}
subscribeRoute(render);subscribe(render);if(!location.hash)navigate('/home');else render();
