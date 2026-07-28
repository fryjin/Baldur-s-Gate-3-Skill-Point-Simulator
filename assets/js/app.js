import{parseRoute,subscribeRoute,navigate}from"./router.js";
import{subscribe,getBuild}from"./store.js";
import{renderHome}from"./views/home-view.js";
import{renderLevel}from"./views/level-view.js";
import{renderRoute}from"./views/route-view.js";
import{renderProgression}from"./views/progression-view.js";
import{renderAbilities}from"./views/abilities-view.js";
import{renderSkills}from"./views/skills-view.js";
import{renderFeatures}from"./views/features-view.js";
import{renderSpells}from"./views/spells-view.js";
import{renderReview}from"./views/review-view.js";
import{renderCharacter}from"./views/character-view.js";
import{renderLibrary}from"./views/library-view.js";
let route=parseRoute();
function render(){route=parseRoute();if(route.view==="home")return renderHome();if(route.view==="library")return renderLibrary(route.section);if(route.view==="character"){const build=getBuild(route.id);return build?renderCharacter(build):navigate("/home")}if(route.view==="build"){const build=getBuild(route.id);if(!build)return navigate("/home");const views={level:renderLevel,route:renderRoute,progression:renderProgression,abilities:renderAbilities,skills:renderSkills,features:renderFeatures,spells:renderSpells,review:renderReview};return(views[route.step]||renderLevel)(build)}renderHome()}
subscribeRoute(render);subscribe(render);if(!location.hash)navigate("/home");else render();
