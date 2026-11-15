import React,{useEffect,useState} from 'react';
export const motionEnabled=()=>!matchMedia('(prefers-reduced-motion: reduce)').matches&&document.documentElement.dataset.input!=='keyboard';
export default function MotionPresence({open,children}){
 const [present,setPresent]=useState(open),[visible,setVisible]=useState(open);
 useEffect(()=>{
  let frame,nextFrame,timer;
  if(open){setPresent(true);frame=requestAnimationFrame(()=>{nextFrame=requestAnimationFrame(()=>setVisible(true));});}
  else{setVisible(false);timer=setTimeout(()=>setPresent(false),motionEnabled()?140:0);}
  return()=>{cancelAnimationFrame(frame);cancelAnimationFrame(nextFrame);clearTimeout(timer);};
 },[open]);
 if(!present)return null;
 return React.cloneElement(children,{'data-visible':visible,'aria-hidden':!open,inert:!open?'':undefined});
}
