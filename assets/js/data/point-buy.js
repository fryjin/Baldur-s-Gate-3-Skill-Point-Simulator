import{abilities}from"./core.js";

export const POINT_BUY_BUDGET=27;
export const POINT_BUY_COSTS=Object.freeze({8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9});

export function pointBuyUsedScores(scores={}){
  return abilities.reduce((sum,a)=>sum+(POINT_BUY_COSTS[Number(scores[a.key])]??0),0)
}
export function pointBuyProjected(scores={},key,value){
  const next={...scores,[key]:Math.max(8,Math.min(15,Number(value)||8))};
  return pointBuyUsedScores(next)
}
export function canSetPointBuyScore(scores={},key,value){
  const current=Math.max(8,Math.min(15,Number(scores[key])||8));
  const next=Math.max(8,Math.min(15,Number(value)||8));
  if(next<=current)return true;
  return pointBuyProjected(scores,key,next)<=POINT_BUY_BUDGET
}
