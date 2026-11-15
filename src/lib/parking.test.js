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

import {earlyDeparture} from './parking.js';
test('early departure label compares requested time with booking',()=>{
 assert.equal(earlyDeparture({type:'departure',departure:'14:34',bookedDeparture:'17:00'}),'17:00');
 assert.equal(earlyDeparture({type:'departure',departure:'17:00',bookedDeparture:'17:00'}),null);
 assert.equal(earlyDeparture({type:'arrival',departure:'14:34',bookedDeparture:'17:00'}),null);
 assert.equal(earlyDeparture({type:'departure',id:'C-311',floor:1,bay:1,departure:'14:34'}),'17:00');
});


test('a vacated spot becomes reserved again on reassignment and counts still total 72',async()=>{
 const {capacityCounts}=await import('./parking.js');
 const state={...initial(),active:null,shaft:'clear',overrides:{'1-1':'available'}};
 const assigned=reducer(state,{type:'assign-spot',id:'C-118',floor:1,bay:1});
 const before=capacityCounts(state),after=capacityCounts(assigned);
 assert.equal(spaceStatus(assigned,1,1),'reserved');
 assert.equal(after.reserved,before.reserved+1);
 assert.equal(after.available,before.available-1);
 assert.equal(after.available+after.occupied+after.reserved,72);
});

test('all 72 modeled bays are counted, and bay 12 can be assigned while bay 13 is rejected',async()=>{
 const {GARAGE_SPOTS,TOTAL_SPOTS}=await import('./garage-layout.js');
 const {capacityCounts}=await import('./parking.js');
 assert.equal(TOTAL_SPOTS,72);
 assert.equal(new Set(GARAGE_SPOTS.map(spot=>`${spot.floor}-${spot.bay}`)).size,72);
 const state=initial(),assigned=reducer(state,{type:'assign-spot',id:'C-118',floor:4,bay:12});
 assert.equal(spaceStatus(assigned,4,12),'reserved');
 assert.ok(assigned.queue.includes('C-118'));
 assert.equal(reducer(state,{type:'assign-spot',id:'C-118',floor:4,bay:13}),state);
 const counts=capacityCounts(assigned);
 assert.equal(counts.total,72);
 assert.equal(counts.available+counts.occupied+counts.reserved,72);
});


test('demo request rebalance converts half the arrivals once, using unique occupied bays only',async()=>{
 const {rebalanceDemoRequests}=await import('./parking.js');
 const state={...initial(),active:null,requests:[...initial().requests.filter(r=>r.type==='departure'),...Array.from({length:10},(_,i)=>({id:`A-${i}`,type:'arrival',status:'new',arrival:'14:45',departure:'17:30'}))],selected:'A-0',choosing:true,choice:{floor:4,bay:6}};
 const next=rebalanceDemoRequests(state),converted=next.requests.filter(r=>r.id.startsWith('A-')&&r.type==='departure');
 assert.equal(converted.length,5);
 assert.equal(new Set(converted.map(r=>`${r.floor}-${r.bay}`)).size,5);
 assert.ok(converted.every(r=>spaceStatus(state,r.floor,r.bay)==='occupied'));
 assert.deepEqual(next.queue,state.queue);
 assert.equal(next.choosing,false);
 assert.equal(next.requests.length,state.requests.length);
 assert.equal(rebalanceDemoRequests(next),next);
 const full={...state,requests:Array.from({length:136},(_,i)=>({id:`A-${i}`,type:'arrival',status:'new',arrival:'14:45',departure:'17:30'}))};
 const limited=rebalanceDemoRequests(full);
 assert.equal(limited.requests.filter(r=>r.type==='departure').length,48);
});
