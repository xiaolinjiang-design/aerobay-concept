import {useLayoutEffect,useRef} from 'react';
import {motionEnabled} from '../components/motion-presence';

export function useSuggestionMotion(rootRef,selection,page,open){
 const previous=useRef(null);
 useLayoutEffect(()=>{
  const nodes=[...rootRef.current.querySelectorAll('[data-suggestion-id]')];
  nodes.forEach(node=>node.getAnimations().forEach(animation=>animation.cancel()));
  const current=new Map(nodes.map(node=>[node.dataset.suggestionId,{node,rect:node.getBoundingClientRect()}]));
  const old=previous.current;
  if(open&&old?.open&&old.page===page&&old.selection!==selection&&motionEnabled()){
   current.forEach(({node,rect},id)=>{
    const before=old.cards.get(id)?.rect;if(!before||!rect.width)return;
    node.animate([
     {transform:`translate(${before.left-rect.left}px,${before.top-rect.top}px) scaleX(${before.width/rect.width})`},
     {transform:'translate(0,0) scaleX(1)'},
    ],{duration:240,easing:'cubic-bezier(.4,0,.2,1)'});
   });
  }
  previous.current={cards:current,selection,page,open};
  return()=>nodes.forEach(node=>node.getAnimations().forEach(animation=>animation.cancel()));
 },[rootRef,selection,page,open]);
}
