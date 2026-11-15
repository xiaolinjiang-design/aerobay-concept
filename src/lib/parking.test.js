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
