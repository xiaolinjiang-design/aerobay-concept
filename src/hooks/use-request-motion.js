import {useLayoutEffect,useRef} from 'react';
import {motionEnabled} from '../components/motion-presence';

export function useRequestMotion(rootRef,requestIds,queueIds,filter){
 const previous=useRef(null),running=useRef(new Set());
 const requestKey=requestIds.join('|'),queueKey=queueIds.join('|');
 useLayoutEffect(()=>{
  const root=rootRef.current;if(!root)return;
  const old=previous.current;
  const scrollTop=root.querySelector('.queue-pane').scrollTop;
  const scrollDelta=old?scrollTop-old.scrollTop:0;
  const cards=[...root.querySelectorAll('[data-request-id]')];
  cards.forEach(card=>card.getAnimations().forEach(animation=>animation.cancel()));
  const current=new Map(cards.map(node=>[node.dataset.requestId,{node,rect:node.getBoundingClientRect(),clone:node.cloneNode(true)}]));
  const queueCards=[...root.querySelectorAll('[data-queue-id]')];
  const canAnimate=old&&old.filter===filter&&motionEnabled()&&!document.hidden;
  function animate(node,frames,options,remove=false){
   const animation=node.animate(frames,options);running.current.add(animation);
   const clean=()=>{running.current.delete(animation);if(remove)node.remove();};
   animation.onfinish=clean;animation.oncancel=clean;
  }
  if(canAnimate){
   for(const [id,item] of old.cards){
    if(current.has(id)||!queueIds.includes(id))continue;
    const {clone}=item;const rect={left:item.rect.left,width:item.rect.width,height:item.rect.height,top:item.rect.top-scrollDelta,bottom:item.rect.bottom-scrollDelta};
    const pane=root.querySelector('.queue-pane').getBoundingClientRect();
    if(rect.bottom<pane.top||rect.top>pane.bottom)continue;
    clone.removeAttribute('data-request-id');clone.setAttribute('aria-hidden','true');clone.inert=true;
    clone.classList.add('request-transfer-ghost');
    Object.assign(clone.style,{position:'fixed',left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,margin:0,zIndex:70,pointerEvents:'none'});
    root.append(clone);
    animate(clone,[{opacity:1,transform:'translateX(0) scale(1)'},{opacity:0,transform:'translateX(18px) scale(.98)'}],{duration:160,easing:'cubic-bezier(.32,.72,0,1)'},true);
   }
   for(const [id,{node,rect}] of current){
    const before=old.cards.get(id)?.rect;
    if(before){const dy=before.top-scrollDelta-rect.top;if(Math.abs(dy)>1)animate(node,[{transform:`translateY(${dy}px)`},{transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.645,.045,.355,1)'});}
    else animate(node,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.32,.72,0,1)'});
   }
   for(const node of queueCards){if(!old.queue.includes(node.dataset.queueId))animate(node,[{opacity:0,transform:'translateX(-10px)'},{opacity:1,transform:'translateX(0)'}],{duration:200,easing:'cubic-bezier(.32,.72,0,1)'});}
  }
  previous.current={cards:current,queue:[...queueIds],filter,scrollTop};
 },[requestKey,queueKey,filter]);
 useLayoutEffect(()=>()=>{running.current.forEach(animation=>animation.cancel());running.current.clear();},[]);
}
