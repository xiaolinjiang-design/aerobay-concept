import test from 'node:test';
import assert from 'node:assert/strict';
import {vehiclePose,bayPosition,gateOpening} from './vehicle-motion.js';
import {VEHICLE_TRANSIT_MS,GATE_PHASE_MS} from '../lib/movement-timing.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
test('arrivals descend to each assigned floor before moving into the exact bay',()=>{
 for(let floor=1;floor<=6;floor++)for(let bay=1;bay<=12;bay++){
  const movement={type:'arrival',phase:'transit',floor,bay},destination=bayPosition(movement);
  const turn=vehiclePose(movement,VEHICLE_TRANSIT_MS*.56),end=vehiclePose(movement,VEHICLE_TRANSIT_MS);
  assert.equal(Math.hypot(turn.x,turn.z),0);assert.ok(Math.abs(turn.y-destination.y)<1e-9);
  assert.ok(distance(end,destination)<1e-9);
 }
});
test('all phase boundaries preserve vehicle position for arrivals and departures',()=>{
 for(const type of ['arrival','departure']){
  const phases=type==='arrival'?['authorizing','reserved','gate-open','gate-closing','transit','confirming']:['authorizing','transit','reserved','gate-open','gate-closing','confirming'];
  const duration={authorizing:1100,reserved:GATE_PHASE_MS,'gate-open':1400,'gate-closing':GATE_PHASE_MS,transit:VEHICLE_TRANSIT_MS,confirming:1400};
  for(let floor=1;floor<=6;floor++)for(let i=0;i<phases.length-1;i++){
   const a=vehiclePose({type,phase:phases[i],floor,bay:4},duration[phases[i]]);
   const b=vehiclePose({type,phase:phases[i+1],floor,bay:4},0);
   assert.ok(distance(a,b)<1e-9,`${type} floor ${floor}: ${phases[i]} → ${phases[i+1]}`);
  }
 }
});
test('departures leave the bay before descending and wait above the closed bottom gate',()=>{
 const movement={type:'departure',phase:'transit',floor:5,bay:3};
 const mid=vehiclePose(movement,VEHICLE_TRANSIT_MS*.44),end=vehiclePose(movement,VEHICLE_TRANSIT_MS);
 assert.equal(Math.hypot(mid.x,mid.z),0);assert.equal(mid.y,bayPosition(movement).y);
 assert.ok(Math.abs(end.y-.8)<1e-9);
 assert.ok(vehiclePose({...movement,phase:'gate-open'},1400).y<-.15);
});
test('physical gates open and close continuously over their full travel duration',()=>{
 assert.equal(gateOpening({phase:'reserved'},0),0);
 assert.equal(gateOpening({phase:'reserved'},GATE_PHASE_MS),1);
 assert.equal(gateOpening({phase:'gate-closing'},0),1);
 assert.equal(gateOpening({phase:'gate-closing'},GATE_PHASE_MS),0);
 assert.ok(gateOpening({phase:'reserved'},1800)>.1&&gateOpening({phase:'reserved'},1800)<.9);
});
