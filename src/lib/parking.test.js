import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initial, reducer, spaceStatus } from './parking.js';
function arrivalQueued() {
  let s=initial();
  s=reducer(s,{type:'choose'});
  s=reducer(s,{type:'bay',floor:4,bay:6});
  return reducer(s,{type:'enqueue'});
}
test('assignment reserves a bay without authorizing shaft entry',()=>{
  const s=arrivalQueued();assert.deepEqual(s.queue,['C-118']);assert.equal(s.active.id,'C-204');assert.equal(spaceStatus(s,4,6),'reserved');assert.equal(reducer(s,{type:'start',id:'C-118'}),s);
});
test('occupied bays cannot be assigned',()=>{
 let s=initial();s=reducer(s,{type:'choose'});s=reducer(s,{type:'bay',floor:4,bay:1});assert.equal(s.choice,null);assert.equal(reducer(s,{type:'enqueue'}),s);
});
test('dispatch requires verified clearance, queue head and release from hold',()=>{
 let s=arrivalQueued();s=reducer(s,{type:'select',id:'C-076'});s=reducer(s,{type:'enqueue'});s=reducer(s,{type:'exit-demo'});assert.equal(reducer(s,{type:'start',id:'C-118'}),s);s=reducer(s,{type:'verified'});assert.equal(reducer(s,{type:'start',id:'C-076'}),s);s=reducer(s,{type:'hold',id:'C-118'});assert.equal(reducer(s,{type:'start',id:'C-118'}),s);s=reducer(s,{type:'hold',id:'C-118'});s=reducer(s,{type:'start',id:'C-118'});assert.equal(s.active.id,'C-118');assert.equal(s.shaft,'reserved');assert.equal(reducer(s,{type:'start',id:'C-076'}),s);
});
test('parking and departure update occupancy and require new shaft verification',()=>{
 let s=arrivalQueued();s=reducer(s,{type:'exit-demo'});s=reducer(s,{type:'verified'});s=reducer(s,{type:'start',id:'C-118'});s=reducer(s,{type:'finish'});assert.equal(spaceStatus(s,4,6),'occupied');assert.equal(s.shaft,'checking');s=reducer(s,{type:'select',id:'C-076'});s=reducer(s,{type:'enqueue'});s=reducer(s,{type:'verified'});s=reducer(s,{type:'start',id:'C-076'});s=reducer(s,{type:'finish'});assert.equal(spaceStatus(s,2,1),'available');assert.equal(s.shaft,'checking');
});
test('direct popover assignment reserves and queues atomically without starting movement',()=>{
 let s=initial();s=reducer(s,{type:'assign-spot',id:'C-118',floor:4,bay:6});assert.deepEqual(s.queue,['C-118']);assert.equal(spaceStatus(s,4,6),'reserved');assert.equal(s.active.id,'C-204');assert.equal(s.choosing,false);assert.equal(reducer(s,{type:'assign-spot',id:'C-118',floor:4,bay:3}),s);
});
test('popover assignment rejects occupied or out-of-range spots and departures',()=>{
 const s=initial();for(const action of[{id:'C-118',floor:4,bay:1},{id:'C-118',floor:8,bay:1},{id:'C-076',floor:4,bay:6}])assert.equal(reducer(s,{type:'assign-spot',...action}),s);
});

import {suggestedSpots,gateDistance} from './parking.js';
test('suggestions rank available spots by roof-gate route distance',()=>{
 const state=initial();
 const spots=suggestedSpots(state);
 assert.equal(spots[0].floor,6);
 assert.ok(spots.every((spot,i)=>i===0||gateDistance(spots[i-1])<=gateDistance(spot)));
 const first=spots[0];
 const next=suggestedSpots({...state,overrides:{[first.floor+'-'+first.bay]:'occupied'}});
 assert.ok(!next.some(spot=>spot.floor===first.floor&&spot.bay===first.bay));
});

test('timed requests alternate arrivals and valid departures without authorizing movement',()=>{
 let state=reducer(initial(),{type:'new-request'});
 assert.equal(state.requests.at(-1).type,'arrival');
 assert.equal(state.requests.at(-1).status,'new');
 state=reducer(state,{type:'new-request'});
 const departure=state.requests.at(-1);
 assert.equal(departure.type,'departure');
 assert.equal(spaceStatus(state,departure.floor,departure.bay),'occupied');
 assert.deepEqual(state.queue,[]);
 const ids=[];
 for(let i=0;i<12;i++){state=reducer(state,{type:'new-request'});ids.push(state.requests.at(-1).id);}
 assert.equal(new Set(ids).size,ids.length);
});
