import React,{useEffect,useState,useRef} from 'react';
import {ChevronDown,Layers,ZoomIn,Zap,ArrowDown,ArrowUp} from 'lucide-react';
import {Button} from './ui/button';
import {Popover,PopoverAnchor,PopoverContent,PopoverClose} from './ui/popover';
import {X,Check} from 'lucide-react';
import {spaceStatus,parkedVehicle,parkingTime} from '../lib/parking';
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
function BayMark({corners,status,selected}){
 const empty=status==='available';
 const interpolate=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 return <g className={`bay-mark ${empty?'bay-mark-available':''} ${selected?'bay-mark-selected':''} ${status==='reserved'?'bay-mark-reserved':''}`}>
 <polygon className="bay-footprint" points={pathPoints(corners)} />
 {empty&&corners.map((corner,i)=>{const prev=corners[(i+3)%4],next=corners[(i+1)%4],left=interpolate(corner,prev,.26),right=interpolate(corner,next,.26),up=point=>[point[0],point[1]+2.2,point[2]];return <g key={i} className="bay-corner"><polyline className="bay-corner-ground" points={pathPoints([left,corner,right])}/><polyline className="bay-corner-raised" points={pathPoints([up(left),up(corner),up(right)])}/><line className="bay-corner-stem" x1={project(...corner)[0]} y1={project(...corner)[1]} x2={project(...up(corner))[0]} y2={project(...up(corner))[1]}/></g>;})}
 </g>;
}
function Floor({floor,focused,state,choosing,send,onInspect}){
 const [hoveredBay,setHoveredBay]=useState(null);
 const y=(floor-1)*28,pt=(r,a,dy=0)=>[r*Math.cos(a),y+dy,r*Math.sin(a)];
 let parts=[];for(let i=0;i<56;i++){const a=i*Math.PI/28,b=(i+1)*Math.PI/28;const cut=!focused&&i>5&&i<21;if(cut)continue;parts.push(<g key={i}><polygon points={pathPoints([pt(R,a,-3),pt(R,b,-3),pt(R,b),pt(R,a)])} fill="#202933" stroke="#3c4752" strokeWidth=".35"/><polygon points={pathPoints([pt(INNER,a),pt(R,a),pt(R,b),pt(INNER,b)])} fill={i<28?'#303b46':'#35414d'} stroke="#54616d" strokeOpacity=".3" strokeWidth=".3"/><polygon points={pathPoints([pt(INNER,a,-3),pt(INNER,a),pt(INNER,b),pt(INNER,b,-3)])} fill="#52616d"/></g>);}
 let route=[];for(let i=0;i<=56;i++){let a=i*Math.PI/28;if(!focused&&i>5&&i<21)continue;route.push(project(...pt(37,a,.1)).join(','));}
 const spots=Array.from({length:6},(_,i)=>{if(!focused&&ANGLES[i]>32&&ANGLES[i]<135)return null;let bay=i+1,loc=location(floor,bay),angle=ANGLES[i]+90,status=spaceStatus(state,floor,bay),selected=state.choice?.floor===floor&&state.choice?.bay===bay,charging=bay===6,activeHere=state.active?.floor===floor&&state.active?.bay===bay;
 const a=angle*Math.PI/180,c=Math.cos(a),sn=Math.sin(a),corners=[[-8,-14],[8,-14],[8,14],[-8,14]].map(([u,t])=>[loc.x+u*c+t*sn,y+.3,loc.z-u*sn+t*c]);
 const enabled=status==='available'||status==='occupied';const activate=e=>{if(enabled){onInspect({floor,bay},e.currentTarget);}};
 return <g key={bay} role="button" tabIndex={enabled?0:-1} aria-label={`Floor ${floor}, space ${bay}, ${status}`} aria-disabled={!enabled} aria-pressed={selected} onClick={activate} onMouseEnter={()=>enabled&&setHoveredBay(bay)} onMouseLeave={()=>setHoveredBay(null)} onFocus={()=>enabled&&setHoveredBay(bay)} onBlur={()=>setHoveredBay(null)} onKeyDown={e=>{if(enabled&&(e.key==='Enter'||e.key===' ')){e.preventDefault();activate(e);}}} className={enabled?'scene-bay interactive':'scene-bay'}>
 <BayMark corners={corners} status={status} selected={selected}/>
 {enabled&&<polygon className="bay-hit-area" points={pathPoints(corners)} fill="transparent" stroke="transparent" strokeWidth={focused?14:4}/>}

 {charging&&<polygon className="charging-edge" points={pathPoints(corners.slice(0,2).concat(corners.slice(0,2).reverse().map(v=>[v[0],v[1],v[2]+1])))} fill="#8bb8be"/>}
 {status==='occupied'&&!activeHere&&<Vehicle {...loc} y={y+.8} angle={angle}/>}
 {(focused||selected)&&<text className="bay-number" x={project(loc.x,y,loc.z)[0]} y={project(loc.x,y,loc.z)[1]+22} textAnchor="middle" fill={status==='available'?'#c2dad1':'#bac4cd'} fontSize="12" fontFamily="ui-monospace, monospace">{String(bay).padStart(2,'0')}</text>}
 {enabled&&hoveredBay===bay&&<g className="bay-hover-label" transform={`translate(${project(loc.x,y,loc.z)[0]},${project(loc.x,y+12,loc.z)[1]-18})`} aria-hidden="true"><path d="M-55,-12 H55 V9 H4 L0,13 L-4,9 H-55 Z"/><text textAnchor="middle" y="2">{status==='available'?'Available':'Occupied'} · F{floor}-{String(bay).padStart(2,'0')}</text></g>}
 </g>;
 }).filter(Boolean).sort((a,b)=>{const la=location(floor,+a.key),lb=location(floor,+b.key);return la.x+la.z-lb.x-lb.z;});
 return <g>{parts}<polyline points={route.join(' ')} fill="none" stroke="#b7c0c9" strokeWidth=".6" strokeOpacity=".5" strokeDasharray="4 6"/>{spots}</g>;
}
export default function GarageScene({state,send,progress}){
 const[focus,setFocus]=useState(null),[inspected,setInspected]=useState(null),[assignCar,setAssignCar]=useState('');const anchorRef=useRef(null),lastTrigger=useRef(null);
 const arrivals=state.requests.filter(r=>r.type==='arrival'&&r.status==='new');
 const selectedArrival=arrivals.find(r=>r.id===assignCar)||arrivals.find(r=>r.id===state.selected)||arrivals[0];
 function inspect(spot,element){lastTrigger.current=element;const bounds=element?.getBoundingClientRect();if(bounds)anchorRef.current={contextElement:element,getBoundingClientRect:()=>element?.isConnected?element.getBoundingClientRect():bounds};setInspected(spot);setAssignCar(state.selected);}
useEffect(()=>{if(state.choosing){setFocus(null);setInspected(null);}},[state.choosing,state.selected]);useEffect(()=>{if(state.choice){setFocus(state.choice.floor);if(!inspected||inspected.floor!==state.choice.floor||inspected.bay!==state.choice.bay){anchorRef.current=null;setInspected(state.choice);setAssignCar(state.selected);}}},[state.choice]);
 useEffect(()=>{if(inspected&&spaceStatus(state,inspected.floor,inspected.bay)==='reserved')setInspected(null);},[state.requests,state.overrides]);useEffect(()=>{if(state.active&&state.active.id!=='C-204')setFocus(null);},[state.active?.id]);
 const occupied=inspected&&spaceStatus(state,inspected.floor,inspected.bay)==='occupied';
 const car=occupied?parkedVehicle(state,inspected.floor,inspected.bay):null;
 const timing=car?parkingTime(car):null;
 const active=state.active;let vehicle=null,flightPath=null;if(active&&active.id!=='C-204'&&active.phase!=='confirming'){let loc=location(active.floor,active.bay),t=active.phase==='transit'?progress/100:0;if(active.type==='departure')t=1-t;let lateral=Math.max(0,(t-.72)/.28),y=165+(loc.y-165)*Math.min(t/.72,1);vehicle=<Vehicle x={loc.x*lateral} y={y+2} z={loc.z*lateral} angle={ANGLES[active.bay-1]+90} active/>;flightPath=<polyline points={pathPoints([[0,165,0],[0,loc.y,0],[loc.x,loc.y,loc.z]])} fill="none" stroke="#9b9de0" strokeWidth="2" strokeDasharray="4 5"/>;}
 const viewBox=focus?`70 ${215-(focus-1)*43.4} 460 260`:'50 55 500 515';
 return <section className="iso-garage"><div className="scene-toolbar"><div className="floor-dropdown"><Layers size={13}/><select aria-label="Select floor" value={focus||'all'} onChange={e=>{setFocus(e.target.value==='all'?null:Number(e.target.value));setInspected(null);}}><option value="all">All floors</option>{[6,5,4,3,2,1].map(f=><option key={f} value={f}>Floor {f}</option>)}</select><ChevronDown size={13}/></div></div><div className={`isometric-stage ${focus?'floor-focus':''}`}>
 <svg className="garage-svg" viewBox={viewBox} role="group" aria-label="Isometric donut-shaped garage with six floors, parked vehicles, and a shared central shaft"><defs><radialGradient id="garage-ambient"><stop offset="0" stopColor="#526477" stopOpacity=".14"/><stop offset="1" stopColor="#0a0d12" stopOpacity="0"/></radialGradient></defs><ellipse cx="300" cy="430" rx="250" ry="115" fill="url(#garage-ambient)"/>
 {!focus&&<g opacity=".15" stroke="#73808c" strokeWidth=".6">{[-120,-80,-40,0,40,80,120].map(v=><g key={v}><line x1={project(v,-5,-120)[0]} y1={project(v,-5,-120)[1]} x2={project(v,-5,120)[0]} y2={project(v,-5,120)[1]}/><line x1={project(-120,-5,v)[0]} y1={project(-120,-5,v)[1]} x2={project(120,-5,v)[0]} y2={project(120,-5,v)[1]}/></g>)}</g>}
 {!focus&&[1,2,3,4,5,6].map(f=><g key={f}><Floor floor={f} state={{...state,choice:inspected||state.choice}} focused={false} choosing={false} send={send} onInspect={inspect}/></g>)}
 {focus&&<Floor floor={focus} state={{...state,choice:inspected||state.choice}} focused choosing={state.choosing} send={send} onInspect={inspect}/>}
 {!focus&&<><line x1={project(0,165,0)[0]} y1={project(0,165,0)[1]} x2={project(0,-2,0)[0]} y2={project(0,-2,0)[1]} stroke="#8995a5" strokeWidth="1" strokeDasharray="3 7" opacity=".5"/>{flightPath}{vehicle}{active?.id==='C-204'&&<Vehicle x={0} y={83} z={0} angle={0} active/>}</>}
 </svg></div>{inspected&&<Popover open onOpenChange={open=>{if(!open)setInspected(null);}}><PopoverAnchor virtualRef={anchorRef} asChild><span className="spot-anchor" style={{position:'absolute',left:'50%',top:'50%',width:1,height:1}}/></PopoverAnchor><PopoverContent side="top" aria-label={`Spot F${inspected.floor}-${String(inspected.bay).padStart(2,'0')}`} onCloseAutoFocus={e=>{e.preventDefault();lastTrigger.current?.focus();}}><div className="spot-popover-head"><div className="spot-title-row"><h3>Spot F{inspected.floor}-{String(inspected.bay).padStart(2,'0')}</h3><span className={`spot-availability ${occupied?'is-occupied':''}`}>{occupied?'Occupied':'Available'}</span></div><PopoverClose asChild><button className="spot-close" aria-label="Close spot details"><X size={15}/></button></PopoverClose></div><dl className="spot-facts"><div><dt>Location</dt><dd>Floor {inspected.floor} · Bay {String(inspected.bay).padStart(2,'0')}</dd></div><div><dt>Vehicle size</dt><dd>Standard</dd></div><div><dt>Charging</dt><dd>{inspected.bay===6?'Available':'Not equipped'}</dd></div></dl>{occupied?<div className="parked-car"><div className="parked-car-heading"><span>Vehicle</span><strong>{car.id}</strong></div><div className="parking-time-label"><span>{car.arrival}</span><span>{car.departure}</span></div><div className="parking-time-track" role="progressbar" aria-label="Parking time elapsed" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(timing.percent)}><span style={{width:`${timing.percent}%`}}/></div><div className="parking-time-caption"><span>{timing.elapsed} parked</span><span>{timing.remaining} left</span></div>{state.requests.some(r=>r.id===car.id&&r.type==='departure'&&r.status!=='complete')&&<p className="spot-popover-note">Departure {state.requests.find(r=>r.id===car.id).status==='new'?'requested':state.requests.find(r=>r.id===car.id).status==='queued'?'queued':'in progress'}</p>}</div>:arrivals.length>0?<><label className="spot-car-label" htmlFor="spot-car">Assign to</label><select id="spot-car" value={selectedArrival?.id||''} onChange={e=>setAssignCar(e.target.value)}>{arrivals.map(r=><option key={r.id} value={r.id}>{r.id} · until {r.departure}</option>)}</select><button className="spot-assign" onClick={()=>{send('assign-spot',{id:selectedArrival.id,floor:inspected.floor,bay:inspected.bay});setInspected(null);}}>Assign to {selectedArrival?.id}<ArrowDown size={13}/></button><p className="spot-popover-note">Reserves the spot and adds the car to the queue.</p></>:<><button className="spot-assign" disabled>No arrivals waiting</button><p className="spot-popover-note">A parking request is required to assign this spot.</p></>}</PopoverContent></Popover>}</section>;
}
