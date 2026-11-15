import React from 'react';
import {ShieldCheck,ScanLine,LogIn,LockKeyhole,CarFront,Check,ArrowDown,ArrowUp} from 'lucide-react';

export default function MovementTimeline({movement,progress=0,complete=false,checking=false}){
 if(!movement)return <section className="movement-timeline timeline-empty" aria-label="Movement timeline"><CarFront size={18}/><span>{checking?'Verifying shaft clearance':'No active movement'}</span></section>;
 const arrival=movement.type==='arrival';
 const steps=[{label:'Approved',icon:ShieldCheck},{label:'Safety check',icon:ScanLine},{label:'Gate open',icon:LogIn},{label:arrival?'Parking':'Departing',icon:CarFront},{label:'Gate closed',icon:LockKeyhole},{label:arrival?'Parked':'Departed',icon:Check}];
 const current=complete?6:movement.phase==='confirming'?5:movement.phase==='gate-closing'?4:movement.phase==='transit'?3:movement.phase==='gate-open'?2:movement.phase==='reserved'?2:1;
 const gate=complete||movement.phase==='confirming'||movement.phase==='authorizing'?'Gate closed':movement.phase==='reserved'?'Gate opening':movement.phase==='gate-closing'?'Gate closing':'Gate open';
 const route=arrival?`Roof → F${movement.floor} · ${String(movement.bay).padStart(2,'0')}`:`F${movement.floor} · ${String(movement.bay).padStart(2,'0')} → Roof`;
 return <section className="movement-timeline" aria-label={`${movement.id} ${arrival?'parking':'departure'} timeline`}><div className="timeline-heading"><span className="timeline-car">{arrival?<ArrowDown size={14}/>:<ArrowUp size={14}/>} {movement.id}</span><span className="timeline-route">{route}</span><span className="gate-status">{gate}</span></div><ol className="movement-steps">{steps.map(({label,icon:Icon},i)=>{const done=i<current,active=i===current;return <li key={label} className={`${done?'step-done':''} ${active?'step-current':''}`} aria-current={active?'step':undefined}><div className="step-track"><span className="step-node">{done?<Check size={13}/>:<Icon size={13}/>}</span>{i<steps.length-1&&<span className="step-connector"><span style={{width:done?'100%':active&&i===3?`${progress}%`:'0%'}}/></span>}</div><span className="step-label">{label}</span><span className="step-state">{done?'Done':active?i===5?'Confirming':i===4?'Closing':i===3?'In progress':i===2?(movement.phase==='gate-open'?'Open':'Opening'):'Checking':'Pending'}</span></li>;})}</ol></section>;
}
