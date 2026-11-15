import React,{useEffect,useState} from 'react';
import {Layers,ZoomIn,Zap,ArrowDown,ArrowUp} from 'lucide-react';
import {Button} from './ui/button';
import {spaceStatus} from '../lib/parking';
const R=82,INNER=31,ANGLES=[-135,-75,-15,45,105,165];
const location=(floor,bay)=>{let a=ANGLES[bay-1]*Math.PI/180;return{x:57*Math.cos(a),z:57*Math.sin(a),y:(floor-1)*28};};
function project(x,y,z){return[300+(x-z)*.866*1.55,380+(x+z)*.5*1.55-y*1.55];}
const p=(x,y,z)=>project(x,y,z).map(v=>v.toFixed(2)).join(',');
const pathPoints=points=>points.map(v=>p(...v)).join(' ');
function Box({x,y,z,w=9,h=4,l=18,angle=0,body='#b4bec9',roof='#d2d9df',glass=false}){
 const a=angle*Math.PI/180,c=Math.cos(a),sn=Math.sin(a),point=(u,v,t)=>[x+u*c+t*sn,y+v,z-u*sn+t*c];
 const b=[point(-w/2,0,-l/2),point(w/2,0,-l/2),point(w/2,0,l/2),point(-w/2,0,l/2)],t=b.map(v=>[v[0],v[1]+h,v[2]]);
 return <g><polygon points={pathPoints([b[0],b[1],t[1],t[0]])} fill={glass?'#303c47':'#6c7884'}/><polygon points={pathPoints([b[1],b[2],t[2],t[1]])} fill={glass?'#374550':'#8b98a4'}/><polygon points={pathPoints([b[2],b[3],t[3],t[2]])} fill={body}/><polygon points={pathPoints([b[3],b[0],t[0],t[3]])} fill={glass?'#26333e':'#7b8997'}/><polygon points={pathPoints(t)} fill={roof} stroke="#d1dae1" strokeOpacity=".25" strokeWidth=".4"/></g>;
}
function Vehicle({x,y,z,angle,active=false}){return <g><ellipse cx={project(x,y,z)[0]} cy={project(x,y,z)[1]+3} rx="15" ry="5" fill="#000" opacity=".22"/><Box x={x} y={y} z={z} angle={angle} body={active?'#c2cce2':'#9fabb7'} roof={active?'#eff1f5':'#cbd2d9'}/><Box x={x} y={y+4} z={z} w={7.6} h={3.2} l={9} angle={angle} body="#42525f" roof="#52636f" glass/><Box x={x} y={y+7.2} z={z} w={6.8} h={.7} l={6} angle={angle} body="#b7c1ca" roof={active?'#e8ecf2':'#aebbc5'}/></g>;}
function Floor({floor,focused,state,choosing,send}){
 const y=(floor-1)*28,pt=(r,a,dy=0)=>[r*Math.cos(a),y+dy,r*Math.sin(a)];
 let parts=[];for(let i=0;i<56;i++){const a=i*Math.PI/28,b=(i+1)*Math.PI/28;const cut=!focused&&i>5&&i<21;if(cut)continue;parts.push(<g key={i}><polygon points={pathPoints([pt(R,a,-3),pt(R,b,-3),pt(R,b),pt(R,a)])} fill="#202933" stroke="#3c4752" strokeWidth=".35"/><polygon points={pathPoints([pt(INNER,a),pt(R,a),pt(R,b),pt(INNER,b)])} fill={i<28?'#303b46':'#35414d'} stroke="#54616d" strokeOpacity=".3" strokeWidth=".3"/><polygon points={pathPoints([pt(INNER,a,-3),pt(INNER,a),pt(INNER,b),pt(INNER,b,-3)])} fill="#52616d"/></g>);}
 let route=[];for(let i=0;i<=56;i++){let a=i*Math.PI/28;if(!focused&&i>5&&i<21)continue;route.push(project(...pt(37,a,.1)).join(','));}
 const spots=Array.from({length:6},(_,i)=>{if(!focused&&ANGLES[i]>32&&ANGLES[i]<135)return null;let bay=i+1,loc=location(floor,bay),angle=ANGLES[i]+90,status=spaceStatus(state,floor,bay),selected=state.choice?.floor===floor&&state.choice?.bay===bay,charging=bay===6,activeHere=state.active?.floor===floor&&state.active?.bay===bay;
 const a=angle*Math.PI/180,c=Math.cos(a),sn=Math.sin(a),corners=[[-8,-14],[8,-14],[8,14],[-8,14]].map(([u,t])=>[loc.x+u*c+t*sn,y+.3,loc.z-u*sn+t*c]);
 const stroke=selected?'#b3b5fa':status==='reserved'?'#9d9fe2':status==='available'?'#7fa79a':'#81909b';
 const enabled=choosing&&status==='available';const activate=()=>{if(enabled)send('bay',{floor,bay});};
 return <g key={bay} role="button" tabIndex={enabled?0:-1} aria-label={`Floor ${floor}, space ${bay}, ${status}`} aria-disabled={!enabled} aria-pressed={selected} onClick={activate} onKeyDown={e=>{if(enabled&&(e.key==='Enter'||e.key===' ')){e.preventDefault();activate();}}} className={enabled?'scene-bay interactive':'scene-bay'}>
 <polygon points={pathPoints(corners)} fill={selected?'#5e6ad240':status==='reserved'?'#5e6ad218':status==='available'?'#71a19012':'transparent'} stroke={stroke} strokeWidth={selected?2:1} strokeDasharray={status==='reserved'?'3 2':undefined}/>
 {charging&&<polygon points={pathPoints(corners.slice(0,2).concat(corners.slice(0,2).reverse().map(v=>[v[0],v[1],v[2]+1])))} fill="#8bb8be"/>}
 {status==='occupied'&&!activeHere&&<Vehicle {...loc} y={y+.8} angle={angle}/>}
 {(focused||selected)&&<text x={project(loc.x,y,loc.z)[0]} y={project(loc.x,y,loc.z)[1]+22} textAnchor="middle" fill={status==='available'?'#c2dad1':'#bac4cd'} fontSize="12" fontFamily="ui-monospace, monospace">{String(bay).padStart(2,'0')}</text>}
 </g>;
 }).filter(Boolean).sort((a,b)=>{const la=location(floor,+a.key),lb=location(floor,+b.key);return la.x+la.z-lb.x-lb.z;});
 return <g>{parts}<polyline points={route.join(' ')} fill="none" stroke="#b7c0c9" strokeWidth=".6" strokeOpacity=".5" strokeDasharray="4 6"/>{spots}</g>;
}
export default function GarageScene({state,send,progress}){
 const[focus,setFocus]=useState(null);useEffect(()=>{if(state.choosing)setFocus(4);},[state.choosing]);useEffect(()=>{if(state.choice)setFocus(state.choice.floor);},[state.choice?.floor]);useEffect(()=>{if(state.active&&state.active.id!=='C-204')setFocus(null);},[state.active?.id]);
 const active=state.active;let vehicle=null,flightPath=null;if(active&&active.id!=='C-204'&&active.phase!=='confirming'){let loc=location(active.floor,active.bay),t=active.phase==='transit'?progress/100:0;if(active.type==='departure')t=1-t;let lateral=Math.max(0,(t-.72)/.28),y=165+(loc.y-165)*Math.min(t/.72,1);vehicle=<Vehicle x={loc.x*lateral} y={y+2} z={loc.z*lateral} angle={ANGLES[active.bay-1]+90} active/>;flightPath=<polyline points={pathPoints([[0,165,0],[0,loc.y,0],[loc.x,loc.y,loc.z]])} fill="none" stroke="#9b9de0" strokeWidth="2" strokeDasharray="4 5"/>;}
 const viewBox=focus?`70 ${215-(focus-1)*43.4} 460 260`:'50 55 500 515';
 return <section className="iso-garage"><div className="scene-toolbar"><span className="scene-title"><Layers size={13}/>{focus?'Floor '+focus:'Garage'}</span><div className="scene-floor-picker"><Button variant="ghost" size="sm" aria-pressed={!focus} onClick={()=>setFocus(null)}>All</Button>{[6,5,4,3,2,1].map(f=><Button key={f} variant="ghost" size="sm" aria-pressed={focus===f} onClick={()=>setFocus(f)}>F{f}</Button>)}</div></div><div className={`isometric-stage ${focus?'floor-focus':''}`}>
 <svg className="garage-svg" viewBox={viewBox} role="group" aria-label="Isometric donut-shaped garage with six floors, parked vehicles, and a shared central shaft"><defs><radialGradient id="garage-ambient"><stop offset="0" stopColor="#526477" stopOpacity=".14"/><stop offset="1" stopColor="#0a0d12" stopOpacity="0"/></radialGradient></defs><ellipse cx="300" cy="430" rx="250" ry="115" fill="url(#garage-ambient)"/>
 {!focus&&<g opacity=".15" stroke="#73808c" strokeWidth=".6">{[-120,-80,-40,0,40,80,120].map(v=><g key={v}><line x1={project(v,-5,-120)[0]} y1={project(v,-5,-120)[1]} x2={project(v,-5,120)[0]} y2={project(v,-5,120)[1]}/><line x1={project(-120,-5,v)[0]} y1={project(-120,-5,v)[1]} x2={project(120,-5,v)[0]} y2={project(120,-5,v)[1]}/></g>)}</g>}
 {!focus&&[1,2,3,4,5,6].map(f=><g key={f}><Floor floor={f} state={state} focused={false} choosing={false} send={send}/></g>)}
 {focus&&<Floor floor={focus} state={state} focused choosing={state.choosing} send={send}/>}
 {!focus&&<><line x1={project(0,165,0)[0]} y1={project(0,165,0)[1]} x2={project(0,-2,0)[0]} y2={project(0,-2,0)[1]} stroke="#8995a5" strokeWidth="1" strokeDasharray="3 7" opacity=".5"/>{flightPath}{vehicle}{active?.id==='C-204'&&<Vehicle x={0} y={83} z={0} angle={0} active/>}</>}
 </svg><div className="scene-view-label">{focus?<><ZoomIn size={12}/> Floor {focus} · bay view</>:<>Isometric section · roof entry</>}</div></div><div className="scene-legend"><span><i className="legend-available"/>Available</span><span><i/>Occupied</span><span><i className="legend-reserved"/>Reserved</span><span><Zap size={10}/>Charging bay</span></div></section>;
}
