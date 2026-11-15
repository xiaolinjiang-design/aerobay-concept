import {Vector3} from 'three';

export function applyViewport(camera,area,canvasWidth,canvasHeight){
 camera.setViewOffset(area.width,area.height,-area.left,-area.top,canvasWidth,canvasHeight);
 camera.updateProjectionMatrix();
}
export function towerFramingPoints(){
 const points=[];
 for(const [radius,height] of [[16.7,-.6],[13,.4],[13,15.3],[3.5,18]])for(let i=0;i<48;i++){
  const angle=i*Math.PI/24;points.push(new Vector3(radius*Math.cos(angle),height,radius*Math.sin(angle)));
 }
 return points;
}
export function towerOverviewPose(camera){
 const target=new Vector3(0,7.3,0),direction=new Vector3(25,17,29).normalize();
 const right=new Vector3().crossVectors(new Vector3(0,1,0),direction).normalize();
 const up=new Vector3().crossVectors(direction,right).normalize();
 const vertical=Math.tan(camera.fov*Math.PI/360)*.94,horizontal=vertical*camera.aspect;
 let distance=0;
 for(const corner of towerFramingPoints()){
  const point=corner.clone().sub(target),depth=point.dot(direction);
  distance=Math.max(distance,Math.abs(point.dot(right))/horizontal+depth,Math.abs(point.dot(up))/vertical+depth);
 }
 return {position:target.clone().addScaledVector(direction,distance),target};
}
