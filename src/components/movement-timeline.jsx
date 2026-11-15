import React from 'react';
import {ShieldCheck,ScanLine,LogIn,CarFront,Check,ArrowDown,ArrowUp} from 'lucide-react';

export default function MovementTimeline({movement,progress=0,complete=false,checking=false}){
 if(!movement)return <section className="movement-timeline timeline-empty" aria-label="Movement timeline"><CarFront size={18}/><span>{checking?'Verifying shaft clearance':'No active movement'}</span></section>;
 const arrival=movement.type==='arrival';
 const steps=[{label:'Approved',icon:ShieldCheck},{label:'Safety check',icon:ScanLine},{label:'Shaft entry',icon:LogIn},{label:arrival?'Parking':'Departing',icon:CarFront},{label:arrival?'Parked':'Departed',icon:Check}];
 const current=complete?5:movement.phase==='confirming'?4:movement.phase==='transit'?3:movement.phase==='reserved'?2:1;
 const route=arrival?`Roof → F${movement.floor} · ${String(movement.bay).padStart(2,'0')}`:`F${movement.floor} · ${String(movement.bay).padStart(2,'0')} → Roof`;
 return <section className="movement-timeline" aria-label={`${movement.id} ${arrival?'parking':'departure'} timeline`}><div className="timeline-heading"><span className="timeline-car">{arrival?<ArrowDown size={14}/>:<ArrowUp size={14}/>} {movement.id}</span><span className="timeline-route">{route}</span></div><ol className="movement-steps">{steps.map(({label,icon:Icon},i)=>{const done=i<current,active=i===current;return <li key={label} className={`${done?'step-done':''} ${active?'step-current':''}`} aria-current={active?'step':undefined}><div className="step-track"><span className="step-node">{done?<Check size={13}/>:<Icon size={13}/>}</span>{i<steps.length-1&&<span className="step-connector"><span style={{width:done?'100%':active&&i===3?`${progress}%`:'0%'}}/></span>}</div><span className="step-label">{label}</span><span className="step-state">{done?'Done':active?i===4?'Confirming':i===3?'In progress':i===2?'Ready to enter':'Checking':'Pending'}</span></li>;})}</ol></section>;
}
