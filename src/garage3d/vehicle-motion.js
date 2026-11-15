import {bayAngle} from '../lib/garage-layout.js';
import {GATE_PHASE_MS,VEHICLE_TRANSIT_MS} from '../lib/movement-timing.js';

const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t)};
export function bayPosition({floor,bay}){
 const angle=bayAngle(bay);
 return {x:10.1*Math.cos(angle),y:(floor-1)*2.35+.43,z:10.1*Math.sin(angle),angle};
}
export function vehiclePose(movement,elapsed=0){
 const {type,phase}=movement,arrival=type==='arrival',bay=bayPosition(movement);
 const point=(radius,y,heading=-bay.angle-Math.PI/2)=>({x:radius*Math.cos(bay.angle),y,z:radius*Math.sin(bay.angle),heading});
 const t=clamp(elapsed/VEHICLE_TRANSIT_MS);
 if(arrival){
  if(phase==='authorizing'||phase==='reserved')return point(0,17);
  if(phase==='gate-open')return point(0,17+(14.1-17)*ease(elapsed/1400));
  if(phase==='gate-closing')return point(0,14.1);
  if(phase==='transit')return t<.56?point(0,14.1+(bay.y-14.1)*ease(t/.56)):point(10.1*ease((t-.56)/.44),bay.y);
  return point(10.1,bay.y);
 }
 if(phase==='authorizing')return point(10.1,bay.y,-bay.angle-Math.PI/2);
 if(phase==='transit')return t<.44?point(10.1*(1-ease(t/.44)),bay.y,-bay.angle-Math.PI/2):point(0,bay.y+(.8-bay.y)*ease((t-.44)/.56),-bay.angle-Math.PI/2);
 if(phase==='reserved')return point(0,.8);
 if(phase==='gate-open')return point(0,.8-3.2*ease(elapsed/1400));
 return point(0,-2.4);
}
export function gateOpening(movement,elapsed){
 if(!movement)return 0;
 if(movement.phase==='reserved')return ease(elapsed/(GATE_PHASE_MS-300));
 if(movement.phase==='gate-open')return 1;
 if(movement.phase==='gate-closing')return 1-ease(elapsed/(GATE_PHASE_MS-300));
 return 0;
}
