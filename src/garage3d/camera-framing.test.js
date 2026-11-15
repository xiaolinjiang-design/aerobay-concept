import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera} from 'three';
import {applyViewport,towerOverviewPose,towerFramingPoints} from './camera-framing.js';
for(const [width,height] of [[1440,900],[1920,1080],[1280,800],[1000,800]]){
 test(`tower fits below the cards and between side panels at ${width}×${height}`,()=>{
  const camera=new PerspectiveCamera(36,1,.1,200),area={left:280,top:204,width:width-620,height:height-224};
  applyViewport(camera,area,width,height);
  const pose=towerOverviewPose(camera);camera.position.copy(pose.position);camera.lookAt(pose.target);camera.updateMatrixWorld();
  for(const corner of towerFramingPoints()){
   const point=corner.clone().project(camera),screen={x:(point.x+1)*width/2,y:(1-point.y)*height/2};
   assert.ok(screen.x>=area.left&&screen.x<=area.left+area.width,JSON.stringify(screen));
   assert.ok(screen.y>=area.top&&screen.y<=area.top+area.height,JSON.stringify(screen));
  }
 });
}
