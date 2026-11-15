import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import '../concept.css';

export function mountGarage(root,{mode='demo',initialState=null,onSpotClick}={}){
root.innerHTML=`<main class="concept"><div id="viewport" aria-label="Interactive 3D parking garage"></div><div class="floor-control" aria-label="View level"><button class="active" data-level="all">ALL</button>${[6,5,4,3,2,1].map(n=>`<button data-level="${n}">${String(n).padStart(2,'0')}</button>`).join('')}</div><div class="controls"><button class="roof-toggle" aria-pressed="false">HIDE ROOF</button><div class="gate-control"><div class="gate-heading">SHAFT <span class="shaft-status">EMPTY</span></div><div class="gate-row"><button data-action="admit">AUTHORIZE ENTRY ↓</button><button data-action="release">AUTHORIZE EXIT ↓</button></div><p class="gate-message" role="status">Gates closed · shaft clear</p></div></div></main>`;
if(mode==='app')root.querySelector('.gate-control').hidden=true;
const viewport=root.querySelector('#viewport');
const scene=new THREE.Scene();scene.background=new THREE.Color('#090d13');scene.fog=new THREE.Fog('#090d13',45,100);
const camera=new THREE.PerspectiveCamera(36,1,.1,200);camera.position.set(25,22,29);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;viewport.append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,5,0);controls.enableDamping=true;controls.dampingFactor=.055;controls.minDistance=mode==='app'?5:19;controls.maxDistance=95;controls.maxPolarAngle=Math.PI*.49;
scene.add(new THREE.HemisphereLight('#c4d1e4','#111927',1.5));const sun=new THREE.DirectionalLight('#d6e1f2',2.0);sun.position.set(-12,28,14);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;sun.shadow.bias=-.0002;scene.add(sun);
const mat=(color,roughness=.82,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const white=mat('#353e4b'),edge=mat('#28323f'),inside=mat('#202a36'),stripe=mat('#ffffff'),steel=mat('#59687a',.45,.35),dark=mat('#1b2531',.4,.2),teal=mat('#5e9295',.5,.2),amber=mat('#bc9b5c');
const garage=new THREE.Group();scene.add(garage);const levels=[],bayTargets=[],bayMarkers=[];
function mesh(geometry,material,parent=garage){const o=new THREE.Mesh(geometry,material);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function box(w,h,d,x,y,z,material,parent=garage){const o=mesh(new THREE.BoxGeometry(w,h,d),material,parent);o.position.set(x,y,z);return o}
function torus(radius,tube,y,material,parent=garage){const o=mesh(new THREE.TorusGeometry(radius,tube,8,128),material,parent);o.rotation.x=Math.PI/2;o.position.y=y;return o}
function ringShape(outer,inner){const s=new THREE.Shape();s.absarc(0,0,outer,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);s.holes.push(hole);return s}
const floorGeometry=new THREE.ExtrudeGeometry(ringShape(12.7,4.15),{depth:.38,bevelEnabled:false,curveSegments:96});floorGeometry.rotateX(-Math.PI/2);
function line(a,b,y,r=.025,material=stripe,parent=garage){const p=new THREE.Vector3(a[0],y,a[1]),q=new THREE.Vector3(b[0],y,b[1]);const v=q.clone().sub(p);const c=mesh(new THREE.CylinderGeometry(r,r,v.length(),6),material,parent);c.position.copy(p.add(q).multiplyScalar(.5));c.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return c}
function carPanel(points,material,parent){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));geometry.setIndex([0,1,2,0,2,3]);geometry.computeVertexNormals();const panel=mesh(geometry,material,parent);panel.castShadow=false;return panel}
function roundedCarShape(width,rear,front,radius){const s=new THREE.Shape();s.moveTo(-width+radius,rear);s.lineTo(width-radius,rear);s.quadraticCurveTo(width,rear,width,rear+radius);s.lineTo(width,front-radius);s.quadraticCurveTo(width,front,width-radius,front);s.lineTo(-width+radius,front);s.quadraticCurveTo(-width,front,-width,front-radius);s.lineTo(-width,rear+radius);s.quadraticCurveTo(-width,rear,-width+radius,rear);return s}
function coupeBody(style){
 const {front:f,rear:r,width:w,wheel}=style;
 const sections=[
  [r,.64,.49],[r+.13,.83,.57],[-wheel-.18,.98,.69],[-wheel+.12,1,.74],
  [-.43,.92,.68],[.30,.89,.66],[wheel-.20,1,.69],[wheel+.15,.99,.67],
  [f-.18,.83,.55],[f,.63,.43]
 ];
 const vertices=[],indices=[];
 for(const [z,spread,height] of sections){
  const side=w*spread,shoulder=side*.82;
  for(const [x,y] of [[0,height+.035],[shoulder,height],[side,height-.12],[side,.36],[side*.82,.19],[0,.17],[-side*.82,.19],[-side,.36],[-side,height-.12],[-shoulder,height]])vertices.push(x,y,z);
 }
 const count=10;
 for(let ring=0;ring<sections.length-1;ring++)for(let i=0;i<count;i++){
  const a=ring*count+i,b=ring*count+(i+1)%count,c=(ring+1)*count+i,d=(ring+1)*count+(i+1)%count;
  indices.push(a,d,b,a,c,d);
 }
 for(let i=1;i<count-1;i++){indices.push(0,i+1,i);const end=(sections.length-1)*count;indices.push(end,end+i,end+i+1)}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
const carStyles=[
 {front:1.55,rear:-1.50,width:.79,wheel:1.02,roofY:1.15,roofFront:.15,roofRear:-.58,glassFront:.70,glassRear:-1.04},
 {front:1.64,rear:-1.64,width:.81,wheel:1.13,roofY:1.20,roofFront:.24,roofRear:-.67,glassFront:.77,glassRear:-1.17},
 {front:1.42,rear:-1.39,width:.76,wheel:.94,roofY:1.13,roofFront:.13,roofRear:-.50,glassFront:.66,glassRear:-.95}
];
const carPaint=[white,mat('#4c5b6e',.65,.08),mat('#36495d',.55,.12),mat('#273649',.47,.2)];
const parkedCars=[];
const carGlass=new THREE.MeshStandardMaterial({color:'#263b48',roughness:.18,metalness:.14,side:THREE.DoubleSide});
function car(parent,x,y,z,angle,color=white,styleIndex=0){
 const g=new THREE.Group();parent.add(g);g.position.set(x,y,z);g.rotation.y=angle;
 if(parent!==garage)parkedCars.push({group:g,level:levels.indexOf(parent),paint:color});
 const style=carStyles[styleIndex%carStyles.length];
 const w=style.width,f=style.front,r=style.rear;
 mesh(coupeBody(style),color,g);
 box(w*1.55,.045,f-r-.12,0,.21,(f+r)/2,dark,g);
 const cf=style.glassFront,cr=style.glassRear,rf=style.roofFront,rr=style.roofRear,roofY=style.roofY,baseY=.69,baseW=w*.70,roofW=w*.57;
 carPanel([[-baseW,baseY,cf],[baseW,baseY,cf],[roofW,roofY,rf],[-roofW,roofY,rf]],carGlass,g);
 carPanel([[baseW,baseY,cr],[-baseW,baseY,cr],[-roofW,roofY,rr],[roofW,roofY,rr]],carGlass,g);
 for(const sx of [-1,1])carPanel([[sx*baseW,baseY,cf],[sx*roofW,roofY,rf],[sx*roofW,roofY,rr],[sx*baseW,baseY,cr]],carGlass,g);
 const roofShape=roundedCarShape(roofW,rr,rf,.18);
 const roofPanel=mesh(new THREE.ExtrudeGeometry(roofShape,{depth:.045,bevelEnabled:true,bevelThickness:.045,bevelSize:.055,bevelSegments:4,curveSegments:12}),color,g);roofPanel.rotation.x=Math.PI/2;roofPanel.position.y=roofY+.07;
 box(w*1.15,.07,.055,0,.31,f-.055,dark,g);
 for(const sx of [-1,1]){
  const headlight=mesh(new THREE.SphereGeometry(1,16,10),mat('#e9f4f5',.18),g);headlight.scale.set(.20,.075,.30);headlight.position.set(sx*w*.64,.52,f-.40);
  const mirror=mesh(new THREE.SphereGeometry(1,12,8),dark,g);mirror.scale.set(.12,.05,.09);mirror.position.set(sx*(w+.08),.7,cf-.11);
 }
 const spoiler=box(w*1.52,.045,.12,0,.73,r+.12,color,g);
 for(const sx of [-1,1])box(.04,.12,.06,sx*w*.58,.64,r+.13,dark,g);
 for(const sx of [-w,w])for(const sz of [-style.wheel,style.wheel]){
  const tire=mesh(new THREE.CylinderGeometry(.27,.27,.12,24),mat('#263139',.9),g);tire.rotation.z=Math.PI/2;tire.position.set(sx*.98,.28,sz);
  const hub=mesh(new THREE.CylinderGeometry(.18,.18,.125,20),mat('#758991',.4,.35),g);hub.rotation.z=Math.PI/2;hub.position.set(sx*1.06,.28,sz);
  const center=mesh(new THREE.CylinderGeometry(.045,.045,.13,12),dark,g);center.rotation.z=Math.PI/2;center.position.set(sx*1.07,.28,sz);
 }
 return g;
}
const perimeterMesh=new THREE.MeshPhysicalMaterial({color:'#5d7c90',transparent:true,opacity:.32,roughness:.65,metalness:.25,side:THREE.DoubleSide,depthWrite:false});
for(let level=0;level<6;level++){const group=new THREE.Group();garage.add(group);levels.push(group);const y=level*2.35;const slab=mesh(floorGeometry,white,group);slab.position.y=y;torus(12.68,.13,y+.38,edge,group);torus(4.18,.11,y+.39,steel,group);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;for(const r of [6.55,11.75]){const x=r*Math.cos(a),z=r*Math.sin(a);line([x,z],[x+.01*Math.cos(a),z+.01*Math.sin(a)],y+.4,.035,edge,group)}const p1=[7.65*Math.cos(a),7.65*Math.sin(a)],p2=[12.25*Math.cos(a),12.25*Math.sin(a)];line(p1,p2,y+.405,.035,stripe,group);const mid=a+Math.PI/12;const tx=10.1*Math.cos(mid),tz=10.1*Math.sin(mid);const tick=mesh(new THREE.RingGeometry(.52,.57,40),teal,group);tick.rotation.x=-Math.PI/2;tick.position.set(tx,y+.41,tz);if(mode==='app'?i%2===0:(i+level)%6!==0){car(group,tx,y+.42,tz,-mid-Math.PI/2,carPaint[(i+level*3)%carPaint.length],(i+level*2)%carStyles.length);if(mode==='app')parkedCars.at(-1).bay=i/2+1}}
 for(let i=0;i<24;i++){const a=i*Math.PI/12;const innerR=4.3,outerR=12.65;const xi=innerR*Math.cos(a),zi=innerR*Math.sin(a),xo=outerR*Math.cos(a),zo=outerR*Math.sin(a);if(i%2===0){box(.17,1.25,.17,xo,y+1.01,zo,white,group);box(.13,.65,.13,xi,y+.75,zi,white,group)}const b=a+Math.PI/12;line([xo,zo],[outerR*Math.cos(b),outerR*Math.sin(b)],y+1.52,.055,white,group);line([xi,zi],[innerR*Math.cos(b),innerR*Math.sin(b)],y+1.08,.045,white,group)}
 const wallBottom=y+.38,wallTop=level===5?15.05:y+2.35,wallHeight=wallTop-wallBottom;
 const wall=mesh(new THREE.CylinderGeometry(12.78,12.78,wallHeight,96,1,true),perimeterMesh,group);wall.position.y=(wallBottom+wallTop)/2;wall.castShadow=false;
 torus(12.78,.055,wallTop,steel,group);
 for(let i=0;i<24;i++){const a=i*Math.PI/12;box(.09,wallHeight,.09,12.78*Math.cos(a),(wallBottom+wallTop)/2,12.78*Math.sin(a),steel,group)}
 }
if(mode==='app')for(let floor=1;floor<=6;floor++)for(let bay=1;bay<=6;bay++){
 const angle=(bay-1)*Math.PI/3+Math.PI/12,x=10.1*Math.cos(angle),z=10.1*Math.sin(angle),y=(floor-1)*2.35+.43;
 const marker=mesh(new THREE.RingGeometry(1.44,1.53,48),new THREE.MeshBasicMaterial({color:'#72d4a4',side:THREE.DoubleSide,transparent:true,opacity:.85,depthWrite:false}),levels[floor-1]);marker.rotation.x=-Math.PI/2;marker.position.set(x,y+.015,z);marker.castShadow=false;marker.visible=false;marker.userData={floor,bay};bayMarkers.push(marker);
 const target=mesh(new THREE.CircleGeometry(1.65,48),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}),levels[floor-1]);target.rotation.x=-Math.PI/2;target.position.set(x,y+.02,z);target.castShadow=false;target.userData={floor,bay};bayTargets.push(target);
}
// An opaque charcoal roof shades the decks; the central hatch seals the flight shaft.
const roof=new THREE.Group();garage.add(roof);
const roofMaterial=mat('#293440',.88);roofMaterial.side=THREE.DoubleSide;
const canopy=mesh(new THREE.ExtrudeGeometry(ringShape(14.25,3.35),{depth:.28,bevelEnabled:false,curveSegments:96}),roofMaterial,roof);
canopy.rotation.x=-Math.PI/2;canopy.position.y=15.05;
torus(14.25,.16,15.23,white,roof);torus(3.35,.13,15.23,white,roof);
for(let i=0;i<24;i++){const a=i*Math.PI/12;line([3.35*Math.cos(a),3.35*Math.sin(a)],[14.25*Math.cos(a),14.25*Math.sin(a)],15.35,.045,edge,roof)}
for(let i=0;i<12;i++){const a=i*Math.PI/6;box(.16,2.75,.16,12.45*Math.cos(a),13.7,12.45*Math.sin(a),white,roof)}
const hatchMaterial=mat('#354654',.32,.08);
function gatePanels(parent,y){const panels=[];for(const side of [-1,1]){const shape=new THREE.Shape();if(side===1){shape.moveTo(0,-3.28);shape.absarc(0,0,3.28,-Math.PI/2,Math.PI/2,false);shape.lineTo(0,-3.28)}else{shape.moveTo(0,3.28);shape.absarc(0,0,3.28,Math.PI/2,Math.PI*1.5,false);shape.lineTo(0,3.28)}const panel=mesh(new THREE.ShapeGeometry(shape,48),hatchMaterial,parent);panel.rotation.x=-Math.PI/2;panel.position.y=y;panels.push(panel)}return panels}
const topPanels=gatePanels(roof,15.08);
const base=mesh(new THREE.ExtrudeGeometry(ringShape(16.5,3.35),{depth:.22,bevelEnabled:false,curveSegments:96}),mat('#202b38'));base.rotation.x=-Math.PI/2;base.position.y=-.4;base.receiveShadow=true;const bottomPanels=gatePanels(garage,-.15);
const ground=mesh(new THREE.PlaneGeometry(200,200),mat('#090d13'));ground.rotation.x=-Math.PI/2;ground.position.y=-.43;ground.receiveShadow=true;
const tunnel=new THREE.Group();garage.add(tunnel);
const tunnelWall=mesh(new THREE.CylinderGeometry(3.3,3.3,15.1,64,1,true),new THREE.MeshPhysicalMaterial({color:'#5b8097',transparent:true,opacity:.24,roughness:.18,metalness:.1,side:THREE.DoubleSide,depthWrite:false}),tunnel);tunnelWall.position.y=7.45;tunnelWall.castShadow=false;
for(let i=0;i<7;i++)torus(3.3,.055,i*2.35+.1,steel,tunnel);
for(let i=0;i<12;i++){const a=i*Math.PI/6;box(.08,15,.08,3.3*Math.cos(a),7.45,3.3*Math.sin(a),steel,tunnel)}
const flying=car(garage,0,12.5,0,.5,mat('#8294b1'));const flightGlow=mesh(new THREE.CylinderGeometry(2.1,2.1,13,48,1,true),new THREE.MeshBasicMaterial({color:'#a6d5d7',transparent:true,opacity:.055,side:THREE.DoubleSide}));flightGlow.position.y=6.7;
let disposed=false,currentState=initialState;const instanceRows=[];
new GLTFLoader().load(`${import.meta.env.BASE_URL}supercar.glb`,({scene:model})=>{
 if(disposed)return;
 model.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 const upright=new THREE.Matrix4().makeRotationX(size.z<size.y?-Math.PI/2:0);
 const orientedBounds=bounds.clone().applyMatrix4(upright),orientedSize=orientedBounds.getSize(new THREE.Vector3());
 const turn=new THREE.Matrix4().makeRotationY(orientedSize.x>orientedSize.z?-Math.PI/2:0);
 const orientation=turn.multiply(upright),finalBounds=bounds.clone().applyMatrix4(orientation);
 const finalSize=finalBounds.getSize(new THREE.Vector3()),finalCenter=finalBounds.getCenter(new THREE.Vector3());
 const scale=3.12/Math.max(finalSize.x,finalSize.z);
 const normalize=new THREE.Matrix4().makeScale(scale,scale,scale).multiply(new THREE.Matrix4().makeTranslation(-finalCenter.x,-finalBounds.min.y,-finalCenter.z)).multiply(orientation);
 const byMaterial=new Map();
 model.traverse(part=>{if(!part.isMesh)return;const material=part.material;const source=part.geometry.clone();source.applyMatrix4(normalize.clone().multiply(part.matrixWorld));
  for(const name of Object.keys(source.attributes))if(!['position','normal','uv'].includes(name))source.deleteAttribute(name);
  if(!source.getAttribute('uv'))source.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(source.getAttribute('position').count*2),2));
  const geometry=source.index?source.toNonIndexed():source;
  if(!byMaterial.has(material))byMaterial.set(material,[]);byMaterial.get(material).push(geometry);
 });
 const parts=[...byMaterial].map(([material,geometries])=>({material,geometry:mergeGeometries(geometries,false)})).filter(part=>part.geometry);
 const paints=['#637184','#465b72','#34485e','#202c3b'];
 for(let level=0;level<6;level++){
  const cars=parkedCars.filter(item=>item.level===level);
  for(const {material,geometry} of parts){const paint=material.name==='paint';const displayMaterial=material.clone();if(paint){displayMaterial.map=null;displayMaterial.color.set('#ffffff');displayMaterial.metalness=.42;displayMaterial.roughness=.32}
   const instances=new THREE.InstancedMesh(geometry,displayMaterial,cars.length);instances.castShadow=true;instances.receiveShadow=true;
   const matrices=[];cars.forEach((item,index)=>{const length=[1,.94,1.06][index%3];item.group.scale.set(index%3===2?1.03:1,1,length);item.group.updateMatrix();matrices.push(item.group.matrix.clone());instances.setMatrixAt(index,item.group.matrix);if(paint)instances.setColorAt(index,new THREE.Color(paints[index%paints.length]))});
   if(!instanceRows[level])instanceRows[level]=[];instanceRows[level].push({instances,cars,matrices});
   levels[level].add(instances);
  }
  cars.forEach(({group})=>{levels[level].remove(group);group.traverse(object=>{if(object.isMesh)object.geometry.dispose()})});
 }
 flying.clear();for(const {material,geometry} of parts){const displayMaterial=material.clone();if(material.name==='paint'){displayMaterial.map=null;displayMaterial.color.set('#8294b1')}const piece=new THREE.Mesh(geometry,displayMaterial);piece.castShadow=true;piece.receiveShadow=true;flying.add(piece)}
 if(currentState)update(currentState);
},undefined,error=>console.error('Car model failed to load',error));
let initialSize=true;function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;camera.aspect=w/h;if(initialSize){const scale=Math.max(1,1.05/camera.aspect)*(mode==='app'?1.28:1);camera.position.set(25*scale,5+17*scale,29*scale);initialSize=false}camera.updateProjectionMatrix();renderer.setSize(w,h)}const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);resize();
let selected='all';root.querySelectorAll('[data-level]').forEach(button=>button.addEventListener('click',()=>{selected=button.dataset.level;root.querySelectorAll('[data-level]').forEach(b=>b.classList.toggle('active',b===button));levels.forEach((g,i)=>{g.visible=selected==='all'||i+1===Number(selected)});flightGlow.visible=selected==='all';flying.visible=selected==='all'&&gateState.phase!=='empty'}));
const roofToggle=root.querySelector('.roof-toggle');roofToggle.addEventListener('click',()=>{const cutaway=roof.visible;roof.visible=!cutaway;roofToggle.setAttribute('aria-pressed',String(cutaway));roofToggle.textContent=cutaway?'SHOW ROOF':'HIDE ROOF'});
const gateState={top:false,bottom:false,phase:'empty'};const admitButton=root.querySelector('[data-action="admit"]'),releaseButton=root.querySelector('[data-action="release"]');const status=root.querySelector('.shaft-status'),message=root.querySelector('.gate-message');let phaseStart=0;
function setPhase(phase,note){gateState.phase=phase;phaseStart=performance.now();gateState.top=['entryOpening','entering'].includes(phase);gateState.bottom=['exitOpening','exiting'].includes(phase);admitButton.disabled=phase!=='empty';releaseButton.disabled=phase!=='inside';status.textContent=phase==='empty'?'EMPTY':phase==='inside'?'1 CAR INSIDE':'MOVING';message.textContent=note||(phase==='empty'?'Gates closed · shaft clear':phase==='inside'?'Gates closed · car inside':'Gate locked during movement');flying.visible=selected==='all'&&phase!=='empty'}
admitButton.addEventListener('click',()=>{if(admitButton.disabled)return;flying.position.y=17;setPhase('entryOpening','Top gate opening')});
releaseButton.addEventListener('click',()=>{if(releaseButton.disabled)return;flying.position.y=7;setPhase('exitOpening','Bottom gate opening')});setPhase('empty');
const hiddenMatrix=new THREE.Matrix4().makeScale(0,0,0);
let cameraGoal=null,targetGoal=null,lastFocusKey=null,wasChoosing=false;
function focusSpot({floor,bay}){
 if(!Number.isInteger(floor)||!Number.isInteger(bay)||floor<1||floor>6||bay<1||bay>6)return;
 const angle=(bay-1)*Math.PI/3+Math.PI/12,x=10.1*Math.cos(angle),z=10.1*Math.sin(angle),y=(floor-1)*2.35+.8;
 selected=String(floor);root.querySelectorAll('[data-level]').forEach(button=>button.classList.toggle('active',button.dataset.level===selected));levels.forEach((group,index)=>group.visible=index===floor-1);
 roof.visible=false;roofToggle.setAttribute('aria-pressed','true');roofToggle.textContent='SHOW ROOF';
 targetGoal=new THREE.Vector3(x,y,z);cameraGoal=new THREE.Vector3(x-5.5*Math.cos(angle)-5*Math.sin(angle),y+8.5,z-5.5*Math.sin(angle)+5*Math.cos(angle));
 flying.visible=false;flightGlow.visible=false;
}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart=null;
function onPointerDown(event){pointerStart={x:event.clientX,y:event.clientY};cameraGoal=null;targetGoal=null}
function onPointerUp(event){if(mode!=='app'||!pointerStart)return;const movement=Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y);pointerStart=null;if(movement>7)return;
 const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
 const hit=raycaster.intersectObjects(bayTargets).find(({object})=>object.parent.visible);if(!hit)return;const spot=hit.object.userData;focusSpot(spot);
 if(currentState?.choosing&&currentState.availableBays?.some(item=>item.floor===spot.floor&&item.bay===spot.bay))onSpotClick?.(spot);
}
renderer.domElement.addEventListener('pointerdown',onPointerDown);renderer.domElement.addEventListener('pointerup',onPointerUp);
function update(next){currentState=next;if(mode!=='app'||!next)return;
 const occupied=new Set((next.occupiedBays||[]).map(({floor,bay})=>`${floor}-${bay}`));
 instanceRows.forEach(rows=>rows.forEach(({instances,cars,matrices})=>{cars.forEach((item,index)=>instances.setMatrixAt(index,occupied.has(`${item.level+1}-${item.bay}`)?matrices[index]:hiddenMatrix));instances.instanceMatrix.needsUpdate=true}));
 const active=next.active;gateState.top=!!active&&active.type==='arrival'&&active.phase==='gate-open';gateState.bottom=!!active&&active.type==='departure'&&active.phase==='gate-open';gateState.phase=active?'inside':'empty';
 flying.visible=selected==='all'&&!!active;flightGlow.visible=flying.visible;
 if(active){const amount=Math.min(1,Math.max(0,(next.progress||0)/100));flying.position.y=active.type==='arrival'?17-10*amount:7-11*amount}
 const available=new Set((next.availableBays||[]).map(spot=>`${spot.floor}-${spot.bay}`));
 bayMarkers.forEach(marker=>{const spot=marker.userData,isChoice=next.choice?.floor===spot.floor&&next.choice?.bay===spot.bay;marker.visible=next.choosing&&available.has(`${spot.floor}-${spot.bay}`);marker.material.color.set(isChoice?'#ffe1a2':'#72d4a4');marker.scale.setScalar(isChoice?1.16:1)});
 const spot=next.choice||(next.choosing&&!wasChoosing?next.suggestedBays?.[0]:null);const focusKey=spot?`${spot.floor}-${spot.bay}`:null;
 if(spot&&focusKey!==lastFocusKey){focusSpot(spot);lastFocusKey=focusKey}
 if(!next.choosing)lastFocusKey=null;wasChoosing=next.choosing;
}
if(initialState)update(initialState);
const clock=new THREE.Clock();let frame;function animate(){if(disposed)return;frame=requestAnimationFrame(animate);const t=clock.getElapsedTime(),elapsed=performance.now()-phaseStart;
 if(mode==='demo'&&gateState.phase==='entryOpening'&&elapsed>=800)setPhase('entering','One car entering');
 else if(mode==='demo'&&gateState.phase==='entering'){flying.position.y=17-Math.min(elapsed/2200,1)*10;if(elapsed>=2200)setPhase('entryClosing','Top gate closing')}
 else if(mode==='demo'&&gateState.phase==='entryClosing'&&elapsed>=800)setPhase('inside');
 else if(mode==='demo'&&gateState.phase==='exitOpening'&&elapsed>=800)setPhase('exiting','One car exiting');
 else if(mode==='demo'&&gateState.phase==='exiting'){flying.position.y=7-Math.min(elapsed/2200,1)*11;if(elapsed>=2200)setPhase('exitClosing','Bottom gate closing')}
 else if(mode==='demo'&&gateState.phase==='exitClosing'&&elapsed>=800)setPhase('empty');
 else if(mode==='demo'&&gateState.phase==='inside')flying.position.y=7+.16*Math.sin(t*.9);
 if(mode==='demo')flying.rotation.y=t*.17;[[topPanels,gateState.top],[bottomPanels,gateState.bottom]].forEach(([panels,open])=>panels.forEach((panel,i)=>{const target=open?(i===0?-3.5:3.5):0;panel.position.x+=(target-panel.position.x)*.1}));if(cameraGoal){camera.position.lerp(cameraGoal,.11);controls.target.lerp(targetGoal,.11);if(camera.position.distanceTo(cameraGoal)<.03){camera.position.copy(cameraGoal);controls.target.copy(targetGoal);cameraGoal=null;targetGoal=null}}controls.update();renderer.render(scene,camera)}animate();
return{update,dispose(){disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();renderer.domElement.removeEventListener('pointerdown',onPointerDown);renderer.domElement.removeEventListener('pointerup',onPointerUp);controls.dispose();scene.traverse(object=>{if(object.isMesh){object.geometry.dispose();if(Array.isArray(object.material))object.material.forEach(m=>m.dispose());else object.material.dispose()}});renderer.dispose();root.replaceChildren()}};
}
